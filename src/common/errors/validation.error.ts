import { HttpStatus } from '@nestjs/common';
import { ZodError, ZodIssue, ZodIssueCode } from 'zod';

import { ErrorCode } from '../enums/error-code.enum';
import { ValidationErrorType } from '../enums/validation-error-type.enum';
import { IValidationErrorDetail, IValidationErrorResponse } from '../interfaces/app-error-response.interface';
import { AppError } from './app.error';

export class ValidationError extends AppError {
  readonly details: IValidationErrorDetail[];

  constructor(readonly zodError: ZodError) {
    super({
      message: 'Validation errors occurred.',
      code: ErrorCode.ValidationFailed,
      statusCode: HttpStatus.BAD_REQUEST,
    });

    this.details = this.buildDetails();
  }

  toJSON(): IValidationErrorResponse {
    return {
      error: {
        code: this.code,
        type: this.type,
        message: this.message,
        details: this.details,
      },
    };
  }

  buildDetails(): IValidationErrorDetail[] {
    return this.zodError.errors.flatMap((error): IValidationErrorDetail[] => {
      const type = this.detectDetailType(error);

      const path = error.path.map((item) => item.toString());

      if (error.code === ZodIssueCode.unrecognized_keys) {
        return error.keys.map((key) => ({
          path: [...path, key],
          type: ValidationErrorType.Unrecognized,
          message: 'This key is not recognized',
        }));
      }

      return [
        {
          path,
          type,
          message: error.message,
        },
      ];
    });
  }

  private detectDetailType(error: ZodIssue): ValidationErrorType {
    switch (error.code) {
      case ZodIssueCode.invalid_type: {
        if (error.received === 'undefined') return ValidationErrorType.MissingField;

        return ValidationErrorType.Invalid;
      }

      case ZodIssueCode.unrecognized_keys:
        return ValidationErrorType.Unrecognized;

      default:
        return ValidationErrorType.Invalid;
    }
  }
}
