// features/profile/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async getProfile(email: string) {
    return this.findByEmail(email);
  }

  async addUser(email: string) {
    return this.findByEmail(email);
  }

  async updateUser(email: string) {
    return this.findByEmail(email);
  }

  async deleteUser(email: string) {
    return this.findByEmail(email);
  }
}
