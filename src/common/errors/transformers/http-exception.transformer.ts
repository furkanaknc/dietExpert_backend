import { BadRequestException, ConflictException, HttpException, NotFoundException } from '@nestjs/common';

import { AppError } from '../app.error';
import { BadRequestError } from '../bad-request.error';
import { NotFoundError } from '../not-found.error';
import { ConflictError } from '../conflict.error';
import { InternalError } from '../internal.error';

export function transformHTTPException(exception: HttpException): AppError {
  if (exception instanceof BadRequestException) {
    return new BadRequestError();
  }

  if (exception instanceof NotFoundException) {
    return new NotFoundError();
  }

  if (exception instanceof ConflictException) {
    return new ConflictError();
  }

  return new InternalError();
}
