import { Body, Controller, Delete, Get, HttpCode, Patch, Req, Param, Put, UseGuards } from '@nestjs/common';

import { OmittedUser } from '../../common/types/model.type';
import { UserDetailsResponse } from './interfaces/user-detail-response.interface';
import { UsersService } from './users.service';
import { IRequest } from '../../common/interfaces/requests.interface';
import { UserUpdatePayload } from '../../validations/users/users.validation';
import { UserHealthPayload, UserInformationPayload } from '../../validations/users/user-profile.validation';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async profile(@Req() req: IRequest): Promise<UserDetailsResponse> {
    return await this.usersService.getDetails(req.user.id);
  }

  @Get('personal-information')
  async getUserProfile(@Req() req: IRequest) {
    return this.usersService.getPersonalInformation(req.user.id);
  }

  @Patch('profile')
  async updateProfile(@Req() req: IRequest, @Body() payload: UserUpdatePayload): Promise<OmittedUser> {
    return this.usersService.updateProfile(req.user.id, payload);
  }

  @Patch('information')
  async updatePersonalInformation(@Req() req: IRequest, @Body() payload: UserInformationPayload) {
    return this.usersService.upsertInformation(req.user.id, payload);
  }

  @Patch('health')
  async updateHealth(@Req() req: IRequest, @Body() payload: UserHealthPayload) {
    return this.usersService.upsertHealth(req.user.id, payload);
  }

  @HttpCode(204)
  @Delete('delete-account')
  async deleteAccount(@Req() req: IRequest): Promise<void> {
    await this.usersService.deleteAccount(req.user.id);
  }
}
