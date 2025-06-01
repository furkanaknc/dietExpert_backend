import { Injectable } from '@nestjs/common';
import { Prisma, User, UserProfile, UserHealth } from '@prisma/client';

import { ConflictError } from '../../common/errors/conflict.error';
import { NotFoundError } from '../../common/errors/not-found.error';
import { OmittedUser } from '../../common/types/model.type';
import { hashPassword } from '../../common/utils/hash-password.util';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserDetailsResponse } from './interfaces/user-detail-response.interface';
import { UserRegisterPayload } from '../../validations/auth/auth.validation';
import { UserUpdatePayload } from '../../validations/users/users.validation';
import { UserHealthPayload, UserInformationPayload } from '../../validations/users/user-profile.validation';
import { UserWithHealth, UserWithProfile } from './types/model.type';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async checkExistUserOrThrow(
    email: string,
    first_name: string,
    last_name: string,
    options?: Omit<Prisma.UserFindUniqueArgs, 'where'>,
  ): Promise<void> {
    const existingUser = await this.prismaService.user.findFirst({
      ...options,
      where: {
        OR: [{ email }, { first_name }, { last_name }],
      },
    });

    if (existingUser) throw new ConflictError({ message: 'User already exists' });
  }

  async findByIdOrThrow(id: string, options?: Omit<Prisma.UserFindUniqueArgs, 'where'>): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      ...options,
      where: { id },
    });

    if (!user) throw new NotFoundError({ message: 'User not found' });

    return user;
  }

  async findByEmailOrThrow(email: string, options?: Omit<Prisma.UserFindUniqueArgs, 'where'>): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      ...options,
      where: { email },
    });

    if (!user) throw new NotFoundError({ message: 'User not found' });

    return user;
  }

  async create(payload: UserRegisterPayload): Promise<OmittedUser> {
    const { password, ...data } = payload;
    const hashedPassword = hashPassword(payload.password);
    return this.prismaService.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async updateProfile(id: string, payload: UserUpdatePayload): Promise<OmittedUser> {
    await this.findByIdOrThrow(id);
    let data = payload;

    if (payload.email) {
      const existingUser = await this.prismaService.user.findFirst({ where: { email: payload.email } });
      if (existingUser) throw new ConflictError({ message: 'Email already exists' });
    }

    if (payload.password) {
      const hashedPassword = hashPassword(payload.password);
      data = { ...payload, password: hashedPassword };
    }

    return this.prismaService.user.update({
      where: { id },
      data,
    });
  }

  async upsertInformation(id: string, payload: UserInformationPayload): Promise<UserWithProfile> {
    await this.findByIdOrThrow(id);

    await this.prismaService.userProfile.upsert({
      where: { user_id: id },
      create: { ...payload, user_id: id },
      update: payload,
    });

    const userWithProfile = await this.prismaService.user.findUnique({
      where: { id: id },
      select: {
        first_name: true,
        last_name: true,
        profile: { omit: { id: true, user_id: true, updated_at: true, created_at: true } },
      },
    });

    if (!userWithProfile) throw new NotFoundError({ message: 'User not found' });

    return userWithProfile;
  }

  async upsertHealth(id: string, payload: UserHealthPayload): Promise<UserWithHealth> {
    await this.findByIdOrThrow(id);

    await this.prismaService.userHealth.upsert({
      where: { user_id: id },
      create: { ...payload, user_id: id },
      update: payload,
    });

    const userWithHealth = await this.prismaService.user.findUnique({
      where: { id: id },
      select: {
        first_name: true,
        last_name: true,
        health: { omit: { id: true, user_id: true, updated_at: true, created_at: true } },
      },
    });

    if (!userWithHealth) throw new NotFoundError({ message: 'User not found' });

    return userWithHealth;
  }

  async getPersonalInformation(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: {
        profile: true,
        health: true,
      },
    });

    if (!user) throw new NotFoundError({ message: 'User not found' });

    return user;
  }

  async getDetails(id: string): Promise<UserDetailsResponse> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundError({ message: 'User not found' });

    return user;
  }

  async deleteAccount(id: string): Promise<void> {
    await this.findByIdOrThrow(id);

    await this.prismaService.user.delete({
      where: { id },
    });
  }
}
