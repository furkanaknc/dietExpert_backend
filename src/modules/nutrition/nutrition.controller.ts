import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, Req } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { IRequest } from '../../common/interfaces/requests.interface';

@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('daily-stats')
  async getDailyStats(@Req() req: IRequest, @Query('date') date?: string) {
    const userId = req.user.id;
    const targetDate = date ? new Date(date) : new Date();

    return this.nutritionService.getDailyCalorieStats(userId, targetDate);
  }

  @Get('weekly-stats')
  async getWeeklyStats(@Req() req: IRequest, @Query('weekStart') weekStart?: string) {
    const userId = req.user.id;
    const startDate = weekStart ? new Date(weekStart) : this.getStartOfWeek(new Date());

    return this.nutritionService.getWeeklyCalorieStats(userId, startDate);
  }

  @Get('monthly-stats')
  async getMonthlyStats(
    @Req() req: IRequest,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
  ) {
    const userId = req.user.id;
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || currentDate.getMonth() + 1;

    return this.nutritionService.getMonthlyCalorieStats(userId, targetYear, targetMonth);
  }

  @Get('food-entries')
  async getFoodEntries(
    @Req() req: IRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.id;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.nutritionService.getFoodEntries(userId, start, end);
  }

  @Delete('food-entries/:entryId')
  async deleteFoodEntry(@Req() req: IRequest, @Param('entryId') entryId: string) {
    const userId = req.user.id;
    return this.nutritionService.deleteFoodEntry(userId, entryId);
  }

  @Put('food-entries/:entryId')
  async updateFoodEntry(@Req() req: IRequest, @Param('entryId') entryId: string, @Body() updateData: any) {
    const userId = req.user.id;
    return this.nutritionService.updateFoodEntry(userId, entryId, updateData);
  }

  @Get('chart-data/daily')
  async getDailyChartData(@Req() req: IRequest, @Query('days', new ParseIntPipe({ optional: true })) days: number = 7) {
    const userId = req.user.id;
    const chartData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const stats = await this.nutritionService.getDailyCalorieStats(userId, date);
      chartData.push({
        date: date.toISOString().split('T')[0],
        calories: stats.total_calories,
        goal_calories: stats.goal_calories,
      });
    }

    return { data: chartData };
  }

  @Get('chart-data/weekly')
  async getWeeklyChartData(
    @Req() req: IRequest,
    @Query('weeks', new ParseIntPipe({ optional: true })) weeks: number = 4,
  ) {
    const userId = req.user.id;
    const chartData = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = this.getStartOfWeek(new Date());
      weekStart.setDate(weekStart.getDate() - i * 7);

      const stats = await this.nutritionService.getWeeklyCalorieStats(userId, weekStart);
      chartData.push({
        week_start: stats.week_start.toISOString().split('T')[0],
        week_end: stats.week_end.toISOString().split('T')[0],
        total_calories: stats.total_calories,
        average_calories: stats.average_calories,
        days: stats.days.map((day) => ({
          date: day.date.toISOString().split('T')[0],
          calories: day.total_calories,
        })),
      });
    }

    return { data: chartData };
  }

  @Get('chart-data/monthly')
  async getMonthlyChartData(
    @Req() req: IRequest,
    @Query('months', new ParseIntPipe({ optional: true })) months: number = 3,
  ) {
    const userId = req.user.id;
    const chartData = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      const stats = await this.nutritionService.getMonthlyCalorieStats(userId, year, month);
      chartData.push({
        year: stats.year,
        month: stats.month,
        month_name: this.getMonthName(stats.month),
        total_calories: stats.total_calories,
        average_calories: stats.average_calories,
        days_data: stats.days.map((day) => ({
          date: day.date.toISOString().split('T')[0],
          calories: day.total_calories,
        })),
      });
    }

    return { data: chartData };
  }

  @Get('nutrition-breakdown')
  async getNutritionBreakdown(@Req() req: IRequest, @Query('date') date?: string) {
    const userId = req.user.id;
    const targetDate = date ? new Date(date) : new Date();

    const stats = await this.nutritionService.getDailyCalorieStats(userId, targetDate);

    return {
      date: targetDate.toISOString().split('T')[0],
      total_calories: stats.total_calories,
      goal_calories: stats.goal_calories,
      goal_progress: stats.goal_calories ? Math.round((stats.total_calories / stats.goal_calories) * 100) : null,
    };
  }

  @Post('parse-food')
  async parseFood(@Req() req: IRequest, @Body() body: { content: string; messageId?: string }) {
    const userId = req.user.id;
    return this.nutritionService.parseAndStoreFoodFromMessage(body.messageId || 'manual', userId, body.content);
  }

  private getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1] || 'Unknown';
  }
}
