import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ParsedFoodItem } from './calorie-parser.service';
import { ActivityLevel, Goal } from '@prisma/client';

export interface CalorieStats {
  total_calories: number;
  goal_calories?: number;
  date: Date;
  food_entries?: any[];
}

export interface WeeklyStats {
  week_start: Date;
  week_end: Date;
  days: CalorieStats[];
  total_calories: number;
  average_calories: number;
}

export interface MonthlyStats {
  year: number;
  month: number;
  days: CalorieStats[];
  total_calories: number;
  average_calories: number;
}

@Injectable()
export class CalorieTrackerService {
  private readonly logger = new Logger(CalorieTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createFoodEntries(userId: string, parsedFood: ParsedFoodItem[], messageId?: string) {
    try {
      const foodEntries = await Promise.all(
        parsedFood.map((food) =>
          this.prisma.foodEntry.create({
            data: {
              user_id: userId,
              message_id: messageId,
              food_name: food.food_name,
              calories: food.calories,
              consumed_at: new Date(),
            },
          }),
        ),
      );

      this.logger.log(`Created ${foodEntries.length} food entries for user ${userId}`);
      return foodEntries;
    } catch (error) {
      this.logger.error(`Error creating food entries: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateDailyCalorieSummary(userId: string, date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all food entries for the day
      const foodEntries = await this.prisma.foodEntry.findMany({
        where: {
          user_id: userId,
          consumed_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Calculate totals
      const totals = foodEntries.reduce(
        (acc, entry) => ({
          calories: acc.calories + entry.calories,
        }),
        {
          calories: 0,
        },
      );

      // Get user's calorie goal
      const userProfile = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true, health: true },
      });

      const goalCalories = this.calculateDailyCalorieGoal(userProfile);

      // Update or create daily summary
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      await this.prisma.dailyCalorieSummary.upsert({
        where: {
          user_id_date: {
            user_id: userId,
            date: dateOnly,
          },
        },
        update: {
          total_calories: totals.calories,
          goal_calories: goalCalories,
        },
        create: {
          user_id: userId,
          date: dateOnly,
          total_calories: totals.calories,

          goal_calories: goalCalories,
        },
      });

      this.logger.log(`Updated daily calorie summary for user ${userId} on ${dateOnly.toDateString()}`);
    } catch (error) {
      this.logger.error(`Error updating daily calorie summary: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDailyCalorieStats(userId: string, date: Date): Promise<CalorieStats> {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const summary = await this.prisma.dailyCalorieSummary.findUnique({
      where: {
        user_id_date: {
          user_id: userId,
          date: dateOnly,
        },
      },
    });

    if (!summary) {
      return {
        total_calories: 0,
        date: dateOnly,
      };
    }

    return {
      total_calories: summary.total_calories,

      goal_calories: summary.goal_calories || undefined,
      date: summary.date,
    };
  }

  async getWeeklyCalorieStats(userId: string, startDate: Date): Promise<WeeklyStats> {
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const days: CalorieStats[] = [];
    let totalCalories = 0;

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(currentDate.getDate() + i);

      const dayStats = await this.getDailyCalorieStats(userId, currentDate);
      days.push(dayStats);
      totalCalories += dayStats.total_calories;
    }

    return {
      week_start: weekStart,
      week_end: weekEnd,
      days,
      total_calories: totalCalories,
      average_calories: totalCalories / 7,
    };
  }

  async getMonthlyCalorieStats(userId: string, year: number, month: number): Promise<MonthlyStats> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // Last day of the month

    const days: CalorieStats[] = [];
    let totalCalories = 0;

    for (let day = 1; day <= monthEnd.getDate(); day++) {
      const currentDate = new Date(year, month - 1, day);
      const dayStats = await this.getDailyCalorieStats(userId, currentDate);
      days.push(dayStats);
      totalCalories += dayStats.total_calories;
    }

    return {
      year,
      month,
      days,
      total_calories: totalCalories,
      average_calories: totalCalories / monthEnd.getDate(),
    };
  }

  async getFoodEntries(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { user_id: userId };

    if (startDate || endDate) {
      where.consumed_at = {};
      if (startDate) {
        where.consumed_at.gte = startDate;
      }
      if (endDate) {
        where.consumed_at.lte = endDate;
      }
    }

    return this.prisma.foodEntry.findMany({
      where,
      orderBy: { consumed_at: 'desc' },
      include: {
        message: {
          select: { id: true, created_at: true },
        },
      },
    });
  }

  async deleteFoodEntry(userId: string, entryId: string) {
    const entry = await this.prisma.foodEntry.findFirst({
      where: { id: entryId, user_id: userId },
    });

    if (!entry) {
      throw new Error('Food entry not found or you do not have permission to delete it');
    }

    await this.prisma.foodEntry.delete({
      where: { id: entryId },
    });

    // Update daily summary
    await this.updateDailyCalorieSummary(userId, entry.consumed_at);

    return { message: 'Food entry deleted successfully' };
  }

  async updateFoodEntry(userId: string, entryId: string, updateData: Partial<ParsedFoodItem>) {
    const entry = await this.prisma.foodEntry.findFirst({
      where: { id: entryId, user_id: userId },
    });

    if (!entry) {
      throw new Error('Food entry not found or you do not have permission to update it');
    }

    const updatedEntry = await this.prisma.foodEntry.update({
      where: { id: entryId },
      data: {
        food_name: updateData.food_name,
        calories: updateData.calories,
      },
    });

    // Update daily summary
    await this.updateDailyCalorieSummary(userId, entry.consumed_at);

    return updatedEntry;
  }

  private calculateDailyCalorieGoal(user: any): number | null {
    if (!user?.profile || !user.health) {
      return null;
    }

    const { weight, height, age, sex } = user.profile;
    const { activity_level, goal } = user.health;

    if (!weight || !height || !age || !sex) {
      return null;
    }

    // Calculate BMR using Mifflin-St Jeor equation
    let bmr: number;
    if (sex === 'MALE') {
      bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else {
      bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
    }

    // Apply activity level multiplier
    const activityMultipliers = {
      SEDENTARY: 1.2,
      LIGHTLY_ACTIVE: 1.375,
      MODERATELY_ACTIVE: 1.55,
      VERY_ACTIVE: 1.725,
      EXTRA_ACTIVE: 1.9,
    };

    const tdee = bmr * (activityMultipliers[activity_level as ActivityLevel] || 1.2);

    // Apply goal adjustment
    const goalAdjustments = {
      WEIGHT_LOSS: -500, // 500 calorie deficit
      WEIGHT_GAIN: 500, // 500 calorie surplus
      MUSCLE_GAIN: 300, // 300 calorie surplus
      MAINTENANCE: 0,
      HEALTH_IMPROVEMENT: 0,
      SPORTS_PERFORMANCE: 100,
      GENERAL_WELLNESS: 0,
    };

    return Math.round(tdee + (goalAdjustments[goal as Goal] || 0));
  }
}
