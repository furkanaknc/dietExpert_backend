import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '@prisma/client';

import { UnauthorizedError } from '../../common/errors/unauthorized.error';
import { UsersService } from '../users/users.service';
import { EnvironmentService } from '../common/environments/environment.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly envService: EnvironmentService,
    private readonly usersService: UsersService,
  ) {}

  async verifyUser(token: string): Promise<User> {
    let payload;

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.envService.get('JWT_ACCESS_TOKEN_SECRET'),
      });
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedError({ message: 'Token expired' });
      }

      throw new UnauthorizedError({ message: 'Invalid token' });
    }

    const { sub: email } = payload;

    const user = await this.usersService.findByEmailOrThrow(email, { omit: { status: false } });

    if (!user || user.status !== UserStatus.ACTIVE) throw new UnauthorizedError();

    return user;
  }
}
