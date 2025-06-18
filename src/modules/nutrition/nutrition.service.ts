import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SimpleCalorieParserService } from './services/simple-calorie-parser.service';
import { CalorieTrackerService } from './services/calorie-tracker.service';

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calorieParser: SimpleCalorieParserService,
    private readonly calorieTracker: CalorieTrackerService,
  ) {}

  async parseAndStoreFoodFromMessage(messageId: string, userId: string, content: string) {
    try {
      this.logger.log(`Parsing food data from message: ${messageId}`);

      const parsedFood = await this.calorieParser.parseFoodFromText(content);

      if (parsedFood.length > 0) {
        const foodEntries = await this.calorieTracker.createFoodEntries(userId, parsedFood, messageId);

        await this.calorieTracker.updateDailyCalorieSummary(userId, new Date());

        this.logger.log(`Created ${foodEntries.length} food entries for user ${userId}`);
        return foodEntries;
      }

      return [];
    } catch (error) {
      this.logger.error(`Error parsing and storing food data: ${error.message}`, error.stack);
      return [];
    }
  }

  async parseAndStoreFoodFromConversation(messageId: string, userId: string, userMessage: string, aiResponse: string) {
    try {
      this.logger.log(`Parsing food data from conversation for message: ${messageId}`);
      this.logger.log(`USER MESSAGE: "${userMessage.substring(0, 200)}${userMessage.length > 200 ? '...' : ''}"`);
      this.logger.log(`AI RESPONSE: "${aiResponse.substring(0, 200)}${aiResponse.length > 200 ? '...' : ''}"`);

      const parsedFood = await this.calorieParser.parseFoodFromConversation(userMessage, aiResponse);

      if (parsedFood.length > 0) {
        this.logger.log(`🍎 ABOUT TO CREATE ${parsedFood.length} FOOD ENTRIES:`);
        parsedFood.forEach((item, index) => {
          this.logger.log(`  ${index + 1}. ${item.food_name}: ${item.calories} cal`);
        });

        const foodEntries = await this.calorieTracker.createFoodEntries(userId, parsedFood, messageId);

        await this.calorieTracker.updateDailyCalorieSummary(userId, new Date());

        const totalCalories = parsedFood.reduce((sum, item) => sum + item.calories, 0);
        this.logger.log(
          `✅ SUCCESS: Created ${foodEntries.length} food entries for user ${userId} - Total: ${totalCalories} calories`,
        );
        return foodEntries;
      } else {
        this.logger.log(`❌ NO FOOD ITEMS PARSED - No entries created`);
      }

      return [];
    } catch (error) {
      this.logger.error(`💥 ERROR parsing and storing food data from conversation: ${error.message}`, error.stack);
      return [];
    }
  }

  async getDailyCalorieStats(userId: string, date: Date) {
    return this.calorieTracker.getDailyCalorieStats(userId, date);
  }

  async getWeeklyCalorieStats(userId: string, startDate: Date) {
    return this.calorieTracker.getWeeklyCalorieStats(userId, startDate);
  }

  async getMonthlyCalorieStats(userId: string, year: number, month: number) {
    return this.calorieTracker.getMonthlyCalorieStats(userId, year, month);
  }

  async getFoodEntries(userId: string, startDate?: Date, endDate?: Date) {
    return this.calorieTracker.getFoodEntries(userId, startDate, endDate);
  }

  async deleteFoodEntry(userId: string, entryId: string) {
    return this.calorieTracker.deleteFoodEntry(userId, entryId);
  }

  async updateFoodEntry(userId: string, entryId: string, updateData: any) {
    return this.calorieTracker.updateFoodEntry(userId, entryId, updateData);
  }
}
