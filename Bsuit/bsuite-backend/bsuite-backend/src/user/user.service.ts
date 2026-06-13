import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/auth/entities/user.entity";
import { GcsService } from "./gcs.service";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import { AuthService } from "src/auth/auth.service";
import * as argon2 from "argon2";
import { EmailService } from "src/auth/mail.service";
import * as Handlebars from "handlebars";
import * as fs from "fs";
import { UserCompanyRelation } from "src/company/entities/user-company-relation.entity";
import { TenantService } from "src/database/tenants.service";
import { Company } from "src/company/entities/company.entity";
import type { Response } from "express";
import { getTemplatePath } from "src/shared/utils";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private gcsService: GcsService,
    private readonly configService: ConfigService,
    private readonly mailerService: EmailService,
    private jwtService: JwtService,
    @InjectRepository(UserCompanyRelation)
    private relationsRepo: Repository<UserCompanyRelation>,
    private readonly tenantService: TenantService,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    @Optional()
    @Inject(forwardRef(() => AuthService))
    private readonly authService?: AuthService,
  ) { }


  private loadEmailTemplate(
    username: string,
    redirectLink: string
  ) {
    const filePath = getTemplatePath("2FA-recovery-email.html")
    const templateSource = fs.readFileSync(filePath, "utf8");

    const template = Handlebars.compile(templateSource);
    const year = new Date().getFullYear();

    return template({
      username,
      redirectLink,
      year,
    });
  }

  async changeDisplayName(user: UserPayload, displayName: string) {
    const userExists = await this.usersRepository.findOne({
      where: { id: user.id },
    });
    if (!userExists) {
      throw new InternalServerErrorException("User not found!");
    }
    userExists.displayName = displayName;
    return await this.usersRepository.save(userExists);
  }

  async uploadProfilePicture(file: Express.Multer.File, req: any) {
    if (!file) throw new BadRequestException("No file uploaded!");
    const user = req.user;

    const userExists = await this.usersRepository.findOne({
      where: { id: user.id },
    });
    if (!userExists) {
      throw new InternalServerErrorException("User not found!");
    }

    if (userExists.profileImage) {
      await this.gcsService.deleteFile(userExists.profileImage);
    }

    const folderPath = this.configService.get<string>("PROFILE_PIC_BUCKET")!;
    const randomString = randomBytes(6).toString("hex");
    const uniqueFilename = `${randomString}-${file.originalname}`;

    userExists.profileImage = `${folderPath}/${uniqueFilename}`;
    await this.usersRepository.save(userExists);

    return {
      url: await this.gcsService.uploadImage(file, folderPath, uniqueFilename),
    };
  }

  async profileHome(userId: number) {
    if (!this.authService) {
      throw new UnauthorizedException("You don't have access to Auth module");
    }
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    let url: string | undefined;
    if (user.profileImage) {
      url = await this.gcsService.getSignedUrl(user.profileImage);
    }
    const sessions = await this.authService.getSessionsForUser(userId);
    return {
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      profilePicUrl: url,
      twoFAEnabled: user.twoFAEnabled,
      sessions,
      password: user.password ? true : false
    };
  }

  async sendRecoveryEmail(email: string, req: any, res: Response) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException("User does not exist!");
    if (!user.twoFAEnabled) throw new BadRequestException("2FA not enabled!");


    const token = this.jwtService.sign(
      { email },
      {
        secret: process.env.JWT_RECOVERY_SECRET,
        expiresIn: "15m",
      }
    );

    const redirectLink = `${req.headers['origin']}${process.env.RECOVERY_URL}/${token}`;

    const userEmailTemplate = this.loadEmailTemplate(
      user.displayName,
      redirectLink
    );

    res.clearCookie("email", {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === "development" ? "none" : "strict",
      path: "/",
    });

    await this.mailerService.sendEmail({
      to: email,
      subject: "BSuite Recover Account - Recovery 2FA",
      html: userEmailTemplate,
    });
  }

  async verifyPassword(email: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ["defaultCompany"],
    });
    if (!user) {
      throw new NotFoundException("User does not exist!")
    }
    const isMatch = await argon2.verify(user.password!, password);
    if (!isMatch) {
      throw new BadRequestException('Invalid password');
    }
    return user;
  }

  async deleteUserAccount(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } })
    if (!user) throw new ForbiddenException("User Does Not Exists!")

    const relation = await this.relationsRepo.find(
      { where: { user: { id }, status: 'Owner' }, relations: ['user', 'company'] }
    )

    for (const rel of relation) {
      await this.tenantService.removeTenantUser(rel.company.companyId, rel.user.id);
      await this.tenantService.removeTenant(rel.company.companyId);

      await this.companyRepo.remove(rel.company);
    }

    await this.usersRepository.remove(user)
  }

  async removeProfileImage(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } })
    if (!user) throw new ForbiddenException("User Does Not Exists!")

    user.profileImage = null

    await this.usersRepository.save(user)
  }
}
