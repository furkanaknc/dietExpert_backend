import { HttpStatus } from '@nestjs/common';

import { ErrorCode } from '../enums/error-code.enum';
import { AppError } from './app.error';

export class UnauthorizedError extends AppError {
  constructor({ message = 'Access denied', code }: { code?: ErrorCode; message?: string } = {}) {
    super({
      code: code || ErrorCode.Unauthorized,
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  }
}