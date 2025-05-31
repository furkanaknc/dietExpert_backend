import { ZodError } from 'zod';

import { AppError } from '../app.error';
import { ValidationError } from '../validation.error';

export function transformZodError(error: ZodError): AppError {
  return new ValidationError(error);
}
