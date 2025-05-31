import { Body, Controller, Delete, Get, HttpCode, Patch, Req } from '@nestjs/common';

import { OmittedUser } from '../../common/types/model.type';
import { UserDetailsResponse } from './interfaces/user-detail-response.interface';
import { UsersService } from './users.service';
import { IRequest } from '../../common/interfaces/requests.interface';
import { UserUpdatePayload } from '../../validations/users/users.validation';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async profile(@Req() req: IRequest): Promise<UserDetailsResponse> {
    return await this.usersService.getDetails(req.user.id);
  }

  @Patch('update-profile')
  async updateProfile(@Req() req: IRequest, @Body() payload: UserUpdatePayload): Promise<OmittedUser> {
    return await this.usersService.updateProfile(req.user.id, payload);
  }

  @HttpCode(204)
  @Delete('delete-account')
  async deleteAccount(@Req() req: IRequest): Promise<void> {
    await this.usersService.deleteAccount(req.user.id);
  }
}
