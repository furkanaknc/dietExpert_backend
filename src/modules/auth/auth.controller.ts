import { Body, Controller, Headers, Post } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { UnauthorizedError } from '../../common/errors/unauthorized.error';
import { UserTokenResponse } from '../../common/interfaces/token-response.interface';
import { AuthService } from './auth.service';
import { VerificationService } from './verification.service';
import { UserLoginPayload, UserRegisterPayload } from '../../validations/auth/auth.validation';

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
  ) {}

  @Post('register')
  async register(@Body() payload: UserRegisterPayload): Promise<void> {
    await this.authService.register(payload);
  }

  @Post('login')
  async login(@Body() payload: UserLoginPayload): Promise<UserTokenResponse> {
    return await this.authService.login(payload);
  }

  @Post('verify')
  async verifyToken(@Headers('authorization') authHeader: string): Promise<{ verified: boolean; user?: any }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const user = await this.verificationService.verifyUser(token);

      return {
        verified: true,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      };
    } catch (error) {
      return { verified: false };
    }
  }
}
