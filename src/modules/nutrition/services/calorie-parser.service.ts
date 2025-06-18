import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../ai/gemini.service';

export interface ParsedFoodItem {
  food_name: string;
  calories: number;
}

@Injectable()
export class CalorieParserService {
  private readonly logger = new Logger(CalorieParserService.name);

  constructor(private readonly geminiService: GeminiService) {}

  async parseFoodFromConversation(userMessage: string, aiResponse?: string): Promise<ParsedFoodItem[]> {
    try {
      this.logger.log(`Checking conversation for food data...`);
      this.logger.log(`User message: "${userMessage.substring(0, 100)}..."`);
      this.logger.log(`AI response: "${aiResponse?.substring(0, 100) || 'None'}..."`);

      if (!this.containsConsumptionContent(userMessage)) {
        this.logger.log('No food consumption detected in user message');
        return [];
      }

      if (!aiResponse || !this.containsCalorieInformation(aiResponse)) {
        this.logger.log('No calorie information found in AI response');
        return [];
      }

      this.logger.log('Food consumption detected in user message AND calorie info in AI response - parsing...');

      const parsedItems = this.parseCaloriesFromAIResponse(aiResponse);
      this.logger.log(`Parsed ${parsedItems.length} food items from AI response`);

      return parsedItems;
    } catch (error) {
      this.logger.error(`Error parsing food from conversation: ${error.message}`, error.stack);
      return [];
    }
  }

  async parseFoodFromText(content: string): Promise<ParsedFoodItem[]> {
    return this.parseFoodFromConversation(content);
  }

  private containsConsumptionContent(content: string): boolean {
    const consumptionKeywords = [
      'ate',
      'eaten',
      'eating',
      'drank',
      'drunk',
      'drinking',
      'had',
      'consumed',
      'finished',
      'yedim',
      'içtim',
      'tükettim',
      'breakfast',
      'lunch',
      'dinner',
      'meal',
      'snack',
      'for breakfast',
      'for lunch',
      'for dinner',
      'this morning',
      'today i',
      'yesterday i',
      'just ate',
      'just had',
    ];

    const lowerContent = content.toLowerCase();
    return consumptionKeywords.some((keyword) => lowerContent.includes(keyword));
  }

  private containsCalorieInformation(content: string): boolean {
    const caloriePatterns = [
      /\d+\s*calories?/i,
      /\d+\s*kcal/i,
      /calories?:\s*\d+/i,
      /kcal:\s*\d+/i,
      /approximately\s*\d+\s*calories?/i,
      /around\s*\d+\s*calories?/i,
      /about\s*\d+\s*calories?/i,
      /roughly\s*\d+\s*calories?/i,
      /total.*calories?.*\d+/i,
      /estimated.*calories?.*\d+/i,
    ];

    return caloriePatterns.some((pattern) => pattern.test(content));
  }

  private parseCaloriesFromAIResponse(aiResponse: string): ParsedFoodItem[] {
    try {
      const foodItems: ParsedFoodItem[] = [];

      const sentences = aiResponse.split(/[.!?]+/);

      for (const sentence of sentences) {
        const calorieMatch = sentence.match(
          /(\w+[^:]*?)[:.]?\s*(?:approximately|around|about|roughly)?\s*(\d+)\s*(?:calories?|kcal)/i,
        );

        if (calorieMatch) {
          const [, foodName, calories] = calorieMatch;

          const cleanFoodName = foodName
            .replace(/^(the|this|these|those|my|i ate|i had)\s+/i, '')
            .replace(/\s*(is|are|was|were|contains?|has|have)\s*/i, ' ')
            .trim();

          if (cleanFoodName.length > 1) {
            foodItems.push({
              food_name: cleanFoodName.charAt(0).toUpperCase() + cleanFoodName.slice(1).toLowerCase(),
              calories: parseInt(calories, 10),
            });
          }
        }
      }

      if (foodItems.length === 0) {
        const listMatches = aiResponse.match(
          /(?:•|\*|\d+\.)\s*([^:]+?)[:.]?\s*(?:approximately|around|about|roughly)?\s*(\d+)\s*(?:calories?|kcal)/gi,
        );

        if (listMatches) {
          for (const match of listMatches) {
            const calorieMatch = match.match(
              /(?:•|\*|\d+\.)\s*([^:]+?)[:.]?\s*(?:approximately|around|about|roughly)?\s*(\d+)\s*(?:calories?|kcal)/i,
            );

            if (calorieMatch) {
              const [, foodName, calories] = calorieMatch;

              const cleanFoodName = foodName.replace(/^(the|this|these|those)\s+/i, '').trim();

              if (cleanFoodName.length > 1) {
                foodItems.push({
                  food_name: cleanFoodName.charAt(0).toUpperCase() + cleanFoodName.slice(1).toLowerCase(),
                  calories: parseInt(calories, 10),
                });
              }
            }
          }
        }
      }

      this.logger.log(`Extracted ${foodItems.length} food items from AI response`);
      return foodItems;
    } catch (error) {
      this.logger.error(`Error parsing calories from AI response: ${error.message}`);
      return [];
    }
  }

  private determineMealTypeFromTime(): 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER' {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 11) return 'BREAKFAST';
    if (hour >= 11 && hour < 15) return 'LUNCH';
    if (hour >= 17 && hour < 22) return 'DINNER';
    return 'SNACK';
  }

  private containsFoodRelatedContent(content: string): boolean {
    const foodKeywords = [
      'ate',
      'eating',
      'drank',
      'drinking',
      'breakfast',
      'lunch',
      'dinner',
      'meal',
      'food',
      'calories',
      'protein',
      'carbs',
      'nutrition',
      'snack',
      'fruit',
      'vegetable',
      'estimate',
      'kcal',
      'grams',
      'serving',
      'portion',
      'ounces',
      'brussels sprouts',
      'celery',
      'olives',
    ];

    const lowerContent = content.toLowerCase();
    return foodKeywords.some((keyword) => lowerContent.includes(keyword));
  }
}
