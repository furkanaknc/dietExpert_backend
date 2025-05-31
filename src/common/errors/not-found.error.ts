import { HttpStatus } from '@nestjs/common';

import { ErrorCode } from '../enums/error-code.enum';
import { AppError } from './app.error';

export class NotFoundError extends AppError {
  constructor({ message = 'Resource not found', code }: { code?: ErrorCode; message?: string } = {}) {
    super({
      code: code || ErrorCode.ResourceNotFound,
      message,
      statusCode: HttpStatus.NOT_FOUND,
    });
  }
}