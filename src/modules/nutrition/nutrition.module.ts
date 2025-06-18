import { Module } from '@nestjs/common';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';
import { SimpleCalorieParserService } from './services/simple-calorie-parser.service';
import { CalorieTrackerService } from './services/calorie-tracker.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AIModule],
  controllers: [NutritionController],
  providers: [NutritionService, SimpleCalorieParserService, CalorieTrackerService],
  exports: [NutritionService, SimpleCalorieParserService, CalorieTrackerService],
})
export class NutritionModule {}
