import { createZodDto } from '@anatine/zod-nestjs';

import { z } from 'zod';

export const ParseFoodSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  messageId: z.string().optional(),
});

export const UpdateFoodEntrySchema = z.object({
  food_name: z.string().min(1).optional(),
  calories: z.number().min(0).optional(),
});

export const CalorieStatsQuerySchema = z.object({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const WeeklyStatsQuerySchema = z.object({
  weekStart: z.string().optional(),
});

export const MonthlyStatsQuerySchema = z.object({
  year: z.number().int().min(2020).max(2030).optional(),
  month: z.number().int().min(1).max(12).optional(),
});

export class ParseFoodDto extends createZodDto(ParseFoodSchema) {}
export class UpdateFoodEntryDto extends createZodDto(UpdateFoodEntrySchema) {}
export class CalorieStatsQueryDto extends createZodDto(CalorieStatsQuerySchema) {}
export class WeeklyStatsQueryDto extends createZodDto(WeeklyStatsQuerySchema) {}
export class MonthlyStatsQueryDto extends createZodDto(MonthlyStatsQuerySchema) {}
