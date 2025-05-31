import { HttpStatus } from '@nestjs/common';

import { ErrorCode } from '../enums/error-code.enum';
import { AppError } from './app.error';

export class InternalError extends AppError {
  constructor({ message = 'An unexpected error occurred', code }: { code?: ErrorCode; message?: string } = {}) {
    super({
      code: code || ErrorCode.Unexpected,
      message,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}