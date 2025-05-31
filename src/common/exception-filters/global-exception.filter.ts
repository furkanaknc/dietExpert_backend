import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../errors/app.error';
import { InternalError } from '../errors/internal.error';
import { transformHTTPException } from '../errors/transformers/http-exception.transformer';
import { transformZodError } from '../errors/transformers/zod-error.transformer';
import { transformPrismaError } from '../errors/transformers/prisma-error.transformer';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    try {
      if (exception instanceof AppError) {
        return this.sendErrorResponse(response, exception);
      }

      let error: AppError | undefined;

      if (exception instanceof PrismaClientKnownRequestError || exception instanceof PrismaClientValidationError) {
        error = transformPrismaError(exception);
      } else if (exception instanceof HttpException) {
        error = transformHTTPException(exception);
      } else if (exception instanceof ZodError) {
        error = transformZodError(exception);
      } else {
        error = new InternalError();
      }

      return this.sendErrorResponse(response, error);
    } catch {
      const fallbackException = new InternalError();

      return this.sendErrorResponse(response, fallbackException);
    }
  }

  private sendErrorResponse(response: Response, error: AppError) {
    response.status(error.statusCode).json(error.toJSON());
  }
}
