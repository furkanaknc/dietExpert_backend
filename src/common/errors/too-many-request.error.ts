import { HttpStatus } from '@nestjs/common';

import { ErrorCode } from '../enums/error-code.enum';
import { AppError } from './app.error';

export class TooManyRequestsError extends AppError {
  constructor({ message = 'Too Many Requests', code }: { message?: string; code?: ErrorCode } = {}) {
    super({
      code: code || ErrorCode.TooManyRequests,
      message,
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
    });
  }
}
