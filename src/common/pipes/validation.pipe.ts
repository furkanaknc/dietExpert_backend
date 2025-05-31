import { ZodDtoStatic, ZodValidationPipe } from '@anatine/zod-nestjs';
import { Injectable } from '@nestjs/common';
import { ArgumentMetadata } from '@nestjs/common';

import { ValidationError } from '../errors/validation.error';

@Injectable()
export class ValidationPipe extends ZodValidationPipe {
  transform(data: unknown, metadata: ArgumentMetadata): unknown {
    const zodSchema = (metadata?.metatype as ZodDtoStatic)?.zodSchema;

    if (zodSchema) {
      const parseResult = zodSchema.safeParse(data);

      if (!parseResult.success) throw new ValidationError(parseResult.error);

      return parseResult.data;
    }

    return data;
  }
}
