// features/profile/users.controller.ts
import { Controller, Delete, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './user.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

//   @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Query() query:any) {
    return this.usersService.getProfile(query.email);
  }

  @Post('user')
  async addUser(@Query() query:any) {
    return this.usersService.addUser(query.email);
  }

  @Put('user')
  async updateUser(@Query() query:any) {
    return this.usersService.updateUser(query.email);
  }

    @Delete('user')
  async deleteUser(@Query() query:any) {
    return this.usersService.deleteUser(query.email);
  }
}
