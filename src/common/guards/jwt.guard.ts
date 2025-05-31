import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { VerificationService } from '../../modules/auth/verification.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenType } from '../enums/token-type.enum';
import { UnauthorizedError } from '../errors/unauthorized.error';
import { IRequest } from '../interfaces/requests.interface';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verificationService: VerificationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<IRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedError({ message: 'No token provided' });
    }

    const user = await this.verificationService.verifyUser(token);
    request.user = {
      id: user.id,
    };

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === TokenType.Bearer ? token : undefined;
  }
}
