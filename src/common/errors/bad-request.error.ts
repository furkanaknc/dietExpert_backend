import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';
import { AppError } from './app.error';

export class BadRequestError extends AppError {
  constructor({ message = 'Bad request', code }: { code?: ErrorCode; message?: string } = {}) {
    super({
      code: code || ErrorCode.InvalidRequest,
      message,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
