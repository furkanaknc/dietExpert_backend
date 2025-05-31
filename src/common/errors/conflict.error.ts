import { HttpStatus } from '@nestjs/common';
import { AppError } from './app.error';
import { ErrorCode } from '../enums/error-code.enum';


export class ConflictError extends AppError {
  constructor({ message = 'Conflict', code }: { code?: ErrorCode; message?: string } = {}) {
    super({
      code: code || ErrorCode.DuplicateEntry,
      message,
      statusCode: HttpStatus.CONFLICT,
    });
  }
}
