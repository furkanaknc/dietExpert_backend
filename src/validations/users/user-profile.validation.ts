import { createZodDto } from '@anatine/zod-nestjs';
import { ActivityLevel, Goal, Sex } from '@prisma/client';
import { z } from 'zod';

export const UserPersonalProfileSchema = z.object({
  weight: z.number().min(0).max(300).optional(),
  height: z.number().min(10).max(250).optional(),
  age: z.number().min(1).max(120).optional(),
  sex: z.nativeEnum(Sex).optional(),
});

export const UserHealthSchema = z.object({
  activity_level: z.nativeEnum(ActivityLevel).optional(),
  goal: z.nativeEnum(Goal).optional(),
  dietary_restrictions: z.array(z.string()).optional(),
  medical_conditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
});

export class UserInformationPayload extends createZodDto(UserPersonalProfileSchema) {}
export class UserHealthPayload extends createZodDto(UserHealthSchema) {}
