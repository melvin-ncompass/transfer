import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as path from 'path';
import * as fs from 'fs';
import { SysPassword } from '../entity/sys_password.entity';
import { SysUser } from '../entity/sys_user.entity';
import { SysUserInfo } from '../entity/sys_user_info.entity';
import * as mime from 'mime-types';
import { UpdateUserDto, ChangePasswordDto } from './dto/profile.dto';
import { BizPermission } from 'src/visualizationV1/entity/biz_permission.entity';
import { SettingsService } from '../../settings/settings.service';
import { menuConfig } from 'scaffolding/common/utils/menu-config.utils';
import { MailerService } from 'scaffolding/common/email-service/mail.service';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
    @InjectRepository(SysUser)
    private readonly userRepo: Repository<SysUser>,
    @InjectRepository(SysPassword)
    private readonly passwordRepo: Repository<SysPassword>,
    private readonly settingsService: SettingsService, // added to constructor
  ) {}

  // async findById(id: string) {
  //   this.logger.log(`findById called with ID: ${id}`);

  //   try {
  //     const user = await this.dataSource.getRepository(User).findOne({
  //       where: { id },
  //       relations: [
  //         'userInfo',
  //         'roleMappings',
  //         'roleMappings.role',
  //         'roleMappings.role.permissionMappings',
  //         'roleMappings.role.permissionMappings.permission',
  //         'password',
  //       ],
  //     });

  //     if (!user) {
  //       this.logger.warn(`User not found with ID: ${id}`);
  //       throw new NotFoundException('User not found');
  //     }

  //     const permissionNames = user.roleMappings
  //       .flatMap((rm) => rm.role?.permissionMappings || [])
  //       .map((rp) => rp.permission?.name)
  //       .filter((name, i, arr) => !!name && arr.indexOf(name) === i); // deduplicate and remove nulls

  //     const { password, ...safe } = user;

  //     this.logger.log(
  //       `User found with ID: ${id}, permissions: ${permissionNames.length}`,
  //     );

  //     return {
  //       ...safe,
  //       permissions: permissionNames,
  //     };
  //   } catch (error) {
  //     this.logger.error(`Error in findById: ${error.message}`);
  //     throw error;
  //   }
  // }

  async findById(id: string) {
    this.logger.log(`findById called with ID: ${id}`);

    try {
      const userRepo = this.dataSource.getRepository(SysUser);

      const user = await userRepo.findOne({
        where: { id },
        relations: [
          'userInfo',
          'roleMappings',
          'roleMappings.role',
          'roleMappings.role.permissionMappings',
          'roleMappings.role.permissionMappings.permission',
          'roleMappings.role.visualizationPermissionMappings',
          'roleMappings.role.visualizationPermissionMappings.permission',
          'roleMappings.role.visualizationPermissionMappings.permission.parent',
          'roleMappings.role.visualizationPermissionMappings.permission.children',
          'password',
        ],
      });

      if (!user) {
        this.logger.warn(`User not found with ID: ${id}`);
        throw new NotFoundException('User not found');
      }

      // SYSTEM PERMISSIONS
      const systemPermissions = user.roleMappings
        .flatMap((rm) => rm.role?.permissionMappings || [])
        .map((rp) => rp.permission?.name)
        .filter((name, i, arr) => !!name && arr.indexOf(name) === i);

      // BUSINESS PERMISSIONS (assigned)
      const assignedBizPermissions = user.roleMappings
        .flatMap((rm) => rm.role?.visualizationPermissionMappings || [])
        .map((rp) => rp.permission)
        .filter((p) => !!p && !p.deletedAt);

      // Collect all ancestors of assigned permissions
      const bizIdToPerm = new Map<string, BizPermission>();
      const collectAncestors = (perm: BizPermission) => {
        if (bizIdToPerm.has(perm.id)) return;
        bizIdToPerm.set(perm.id, perm);
        if (perm.parent) collectAncestors(perm.parent);
      };

      for (const perm of assignedBizPermissions) {
        collectAncestors(perm);
      }

      // Build node map
      const bizIdToNode = new Map<
        string,
        { id: string; name: string; children: any[] }
      >();
      bizIdToPerm.forEach((perm) => {
        bizIdToNode.set(perm.id, {
          id: perm.id,
          name: perm.name,
          children: [],
        });
      });

      // Link children to parents
      const childIds = new Set<string>();
      bizIdToPerm.forEach((perm) => {
        const node = bizIdToNode.get(perm.id);
        if (perm.parent && bizIdToNode.has(perm.parent.id)) {
          const parentNode = bizIdToNode.get(perm.parent.id);
          parentNode.children.push(node);
          childIds.add(perm.id);
        }
      });

      // Collect root nodes
      const businessPermissions = Array.from(bizIdToPerm.values())
        .filter((perm) => !childIds.has(perm.id))
        .map((perm) => bizIdToNode.get(perm.id));

      const { password, ...safeUser } = user;

      this.logger.log(
        `User found with ID: ${id}, system permissions: ${systemPermissions.length}, business permissions: ${businessPermissions.length}`,
      );

      const allPermissions = [
        ...systemPermissions,
        ...assignedBizPermissions.map((p) => p.name),
      ];

      const filteredMenu = menuConfig.filter(
        (menu) =>
          menu.allowedPermissions.length === 0 ||
          menu.allowedPermissions.some((perm) => allPermissions.includes(perm)),
      );

      return {
        ...safeUser,
        permissions: {
          system: systemPermissions,
          business: businessPermissions,
        },
        navigation: filteredMenu,
      };
    } catch (error) {
      this.logger.error(`Error in findById: ${error.message}`);
      throw error;
    }
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    this.logger.log(`updateUser called with ID: ${id}`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.getRepository(SysUser).findOne({
        where: { id },
        relations: ['userInfo'],
      });
      if (!user) {
        this.logger.warn(`User not found with ID: ${id}`);
        throw new NotFoundException('User not found');
      }

      if(user.isArchived){
         this.logger.warn(`User with ID: ${id} has been deactivated`);
        throw new NotFoundException('User has been deactivated');
      }

      if (dto.name) user.userInfo.name = dto.name;
      if (dto.phone) user.userInfo.phone = dto.phone;

      await queryRunner.manager.getRepository(SysUserInfo).save(user.userInfo);
      await queryRunner.commitTransaction();
      this.logger.log(`User updated successfully with ID: ${id}`);
      return { message: 'User updated successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in updateUser: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    this.logger.log(`changePassword called for user ID: ${userId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(SysUser);
      const passwordRepo = queryRunner.manager.getRepository(SysPassword);

      const user = await userRepo.findOne({
        where: { id: userId },
        relations: ['password'],
      });

      if (!user) {
        this.logger.warn(`User not found with ID: ${userId}`);
        throw new NotFoundException('User not found');
      }

      const isMatch = await bcrypt.compare(
        dto.currentPassword,
        user.password.password,
      );
      if (!isMatch) {
        this.logger.warn(`Incorrect current password for user ID: ${userId}`);
        throw new UnauthorizedException('Incorrect current password');
      }

      const newHash = await bcrypt.hash(dto.newPassword, 10);
      user.password.password = newHash;
      await passwordRepo.save(user.password);

      await queryRunner.commitTransaction();
      this.logger.log(`Password updated successfully for user ID: ${userId}`);
      return { msg: 'Password updated successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error in changePassword: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ----------------- profile picture -----------------

  async changeProfilePic(file, userId: string) {
    const userRepo = this.dataSource.getRepository(SysUser);
    const userInfo = await userRepo.findOne({
      where: { id: userId },
      relations: ['userInfo'],
    });

    if (!userInfo || !userInfo.userInfo) {
      throw new BadRequestException('User or user info not found');
    }

    // Delete old image if it exists
    if (userInfo.userInfo.profilePicId) {
      const storagePath =
        (await this.settingsService.getSetting('storagePath')) ?? './uploads';
      const oldPath = path.join(
        storagePath,
        'profile-pics',
        userInfo.userInfo.profilePicId,
      );
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const imageId = file.filename; // already UUID + extension

    console.log({ imageId });
    userInfo.userInfo.profilePicId = imageId;
    await userRepo.save(userInfo);

    return { message: 'Profile picture updated', imageId };
  }

  async removeProfilePic(userId: string) {
    const userRepo = this.dataSource.getRepository(SysUser);
    const userInfo = await userRepo.findOne({
      where: { id: userId },
      relations: ['userInfo'],
    });

    console.log({ userInfo });

    if (!userInfo || !userInfo.userInfo?.profilePicId) {
      throw new BadRequestException('No profile picture to remove');
    }

    const storagePath =
      (await this.settingsService.getSetting('storagePath')) ?? './uploads';
    const imagePath = path.join(
      storagePath,
      'profile-pics',
      userInfo.userInfo.profilePicId,
    );

    console.log({ imagePath });

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('File deleted:', imagePath);
    } else {
      console.warn('File not found:', imagePath);
    }

    userInfo.userInfo.profilePicId = null;
    await userRepo.save(userInfo);

    return { message: 'Profile picture removed' };
  }

  // async getProfilePic(userId: string, res) {

  //   try {
  //   const userRepo = this.dataSource.getRepository(User);
  //   const userInfo = await userRepo.findOne({
  //     where: { id: userId },
  //     relations: ['userInfo'],
  //   });

  //   console.log({ userInfo });

  //   if (!userInfo || !userInfo.userInfo?.profilePicId) {
  //     throw new NotFoundException('Profile picture not found');
  //   }

  //   let filePath: string | null = null;
  //   let contentType: string | null = null;

  //   const candidate = join(
  //     __dirname,
  //     '..',
  //     '..',
  //     'uploads',
  //     'profile-pics',
  //     userInfo.userInfo.profilePicId,
  //   );
  //   console.log({ candidate });
  //   if (!fs.existsSync(candidate)) {
  //     throw new NotFoundException('Profile picture file missing');
  //   }

  //   console.log({ filePath: candidate });
  //   if (!filePath || !contentType) {
  //     throw new NotFoundException('Profile picture file missing');
  //   }

  //   const buffer = fs.readFileSync(filePath);
  //   res.setHeader('Content-Type', contentType);
  //   res.send(buffer);
  // }
  // catch (error) {
  //     throw error;
  //   }
  // }

  // ----------------- forget password -----------------

  async getProfilePic(userId: string, res) {
    try {
      const userRepo = this.dataSource.getRepository(SysUser);
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: ['userInfo'],
      });

      if (!user?.userInfo?.profilePicId) {
        throw new NotFoundException('Profile picture not found');
      }

      const storagePath =
        (await this.settingsService.getSetting('storagePath')) ?? './uploads';
      const filePath = path.join(
        storagePath,
        'profile-pics',
        user.userInfo.profilePicId,
      );

      console.log('filePath', filePath);

      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('Profile picture file missing');
      }

      const contentType = mime.lookup(filePath) || 'application/octet-stream';
      const buffer = fs.readFileSync(filePath);

      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    } catch (error) {
      throw error;
    }
  }

  async sendResetLink(email: string) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.userInfo', 'info')
      .where('info.email = :email', { email })
      .getOne();

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if(user.isArchived){
      throw new ConflictException(`User has been deactivated`);
    }
    const token = this.jwtService.sign(
      { sub: user.id, purpose: 'password-reset' },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: '15m' },
    );

    const BASE_URL = this.configService.get<string>('CALLBACK_URL');
    const redirectUrl = `${BASE_URL}/user/resetpassword?token=${token}`;
    const html = `
          <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
            <h2 style="margin: 0 0 12px; font-weight: 600;">Reset Your CxH Pulse Password</h2>
            <p style="margin: 0 0 12px;">Hello${user.userInfo.name ? ` ${user.userInfo.name}` : ''},</p>
            <p style="margin: 0 0 16px;">
              We received a request to reset your password for your CxH Pulse account. If you made this request, please click the button below to proceed.
            </p>
            <p style="margin: 0 0 16px;">
              <a href="${redirectUrl}" style="display: inline-block; padding: 10px 16px; background-color: #2563EB; color: #ffffff; text-decoration: none; border-radius: 6px;">
                Reset Password
              </a>
            </p>
            <p style="margin: 0 0 8px; font-size: 12px; color: #6B7280;">
              If the button doesn't work, you can also reset your password using the link below:
            </p>
            <p style="margin: 0; font-size: 12px;">
              <a href="${redirectUrl}" style="color: #2563EB; text-decoration: underline;">Reset password link</a>
            </p>
          </div>
        `;
    const subject = 'Reset your password for CxH Pulse';
    await this.mailerService.sendMail(user.userInfo.email, subject, html);
  }

  async resetPassword(token: string, newPassword: string) {
    const payload = this.jwtService.verify(token, {
      secret: this.configService.get('JWT_SECRET'),
    });

    if (payload.purpose !== 'password-reset') {
      throw new ForbiddenException('Invalid token purpose.');
    }

    const user = await this.userRepo
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.password', 'password')
      .where('user.id = :id', { id: payload.sub })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const tokenIssuedAt = new Date(payload.iat * 1000);
    const passwordUpdatedAt = user.password.updatedAt;

    if (tokenIssuedAt < passwordUpdatedAt) {
      throw new ForbiddenException(
        'This token was issued before the last password change.',
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.passwordRepo
      .createQueryBuilder()
      .update(SysPassword)
      .set({ password: hashed })
      .where('id = :id', { id: user.password.id })
      .execute();
  }

  async checkResetToken(token: string) {
    let payload: any;

    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (err) {
      throw new BadRequestException(
        'Invalid or expired token. Please request a new link.',
      );
    }

    if (payload.purpose !== 'password-reset') {
      throw new ForbiddenException('Invalid token purpose.');
    }

    const user = await this.userRepo
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.password', 'password')
      .innerJoinAndSelect('user.userInfo', 'info')
      .where('user.id = :id', { id: payload.sub })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const tokenIssuedAt = new Date(payload.iat * 1000);
    const passwordUpdatedAt = user.password.updatedAt;

    if (tokenIssuedAt < passwordUpdatedAt) {
      throw new ForbiddenException(
        'This reset link has already been used. Please request a new one.',
      );
    }

    return {
      status: 'valid',
      message: 'Reset token is valid. You may proceed.',
      user: {
        email: user.userInfo.email,
        name: user.userInfo.name,
      },
    };
  }
}
