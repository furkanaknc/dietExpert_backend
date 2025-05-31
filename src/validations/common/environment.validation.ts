import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string(),

  PORT: z.coerce.number().default(3000),

  NODE_ENV: z.enum(['development', 'production']).default('development'),

  JWT_ACCESS_TOKEN_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

  GEMINI_API_KEY: z.string().min(1),

  FRONTEND_URL: z.string().url().optional(),
});

export type EnvVariables = z.infer<typeof envSchema>;
