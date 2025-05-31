import { createZodDto } from '@anatine/zod-nestjs';
import { UserStatus } from '@prisma/client';
import { z } from 'zod';

import { emailSchema, passwordSchema, usernameSchema } from '../auth/auth.validation';

const userCreateSchema = z.object({
  email: emailSchema,
  first_name: usernameSchema.shape.first_name,
  last_name: usernameSchema.shape.last_name,
  password: passwordSchema,
  status: z.nativeEnum(UserStatus),
});

const userBaseUpdateSchema = userCreateSchema.partial();

const userUpdateSchema = userBaseUpdateSchema.pick({ email: true, first_name: true, last_name: true, password: true });

export class UserCreatePayload extends createZodDto(userCreateSchema) {}
export class UserUpdatePayload extends createZodDto(userUpdateSchema) {}
