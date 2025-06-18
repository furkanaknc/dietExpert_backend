import { Injectable, Logger } from '@nestjs/common';

export interface SimpleFoodItem {
  food_name: string;
  calories: number;
}

@Injectable()
export class SimpleCalorieParserService {
  private readonly logger = new Logger(SimpleCalorieParserService.name);

  async parseFoodFromConversation(userMessage: string, aiResponse?: string): Promise<SimpleFoodItem[]> {
    try {
      this.logger.log(`Checking conversation for food data...`);
      this.logger.log(`User message: "${userMessage.substring(0, 100)}..."`);
      this.logger.log(`AI response: "${aiResponse?.substring(0, 100) || 'None'}..."`);

      const hasConsumption = this.containsConsumptionContent(userMessage);
      this.logger.log(`🍽️  Consumption check: ${hasConsumption ? 'YES' : 'NO'}`);
      if (!hasConsumption) {
        this.logger.log('❌ No food consumption keywords detected in user message');
        return [];
      }

      const hasCalories = aiResponse && this.containsCalorieInformation(aiResponse);
      this.logger.log(`🔢 Calorie info check: ${hasCalories ? 'YES' : 'NO'}`);
      if (!hasCalories) {
        this.logger.log('❌ No calorie information found in AI response');
        return [];
      }

      this.logger.log('Food consumption detected in user message AND calorie info in AI response - parsing...');

      const parsedItems = this.parseCaloriesFromAIResponse(aiResponse);
      this.logger.log(`Parsed ${parsedItems.length} food items from AI response`);

      if (parsedItems.length > 0) {
        this.logger.log('=== PARSED FOOD ITEMS ===');
        parsedItems.forEach((item, index) => {
          this.logger.log(`Item ${index + 1}: ${item.food_name} - ${item.calories} calories`);
        });
        const totalCalories = parsedItems.reduce((sum, item) => sum + item.calories, 0);
        this.logger.log(`TOTAL CALORIES TO BE ADDED: ${totalCalories}`);
        this.logger.log('=========================');
      } else {
        this.logger.log('No food items were parsed from the conversation');
      }

      return parsedItems;
    } catch (error) {
      this.logger.error(`Error parsing food from conversation: ${error.message}`, error.stack);
      return [];
    }
  }

  async parseFoodFromText(content: string): Promise<SimpleFoodItem[]> {
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

  private parseCaloriesFromAIResponse(aiResponse: string): SimpleFoodItem[] {
    try {
      this.logger.log('🔍 Starting smart calorie parsing...');

      const totalCalorieMatch = this.extractTotalCalories(aiResponse);
      if (totalCalorieMatch) {
        this.logger.log(`✅ Found total calories: ${totalCalorieMatch.calories} (${totalCalorieMatch.description})`);
        return [
          {
            food_name: totalCalorieMatch.description,
            calories: totalCalorieMatch.calories,
          },
        ];
      }

      const foodItems = this.extractIndividualFoodItems(aiResponse);

      this.logger.log(`Extracted ${foodItems.length} food items from AI response`);
      return foodItems;
    } catch (error) {
      this.logger.error(`Error parsing calories from AI response: ${error.message}`);
      return [];
    }
  }

  private extractTotalCalories(aiResponse: string): { calories: number; description: string } | null {
    const totalPatterns = [
      /total.*?calorie.*?(?:estimate|count).*?(?:is|=).*?(?:around|approximately|about)?\s*(\d+)\s*-?\s*(\d+)?\s*calories?/i,
      /therefore.*?total.*?(?:is|=|around|approximately|about)\s*(\d+)\s*-?\s*(\d+)?\s*calories?/i,
      /total[:.]?\s*(\d+)\s*-?\s*(\d+)?\s*calories?/i,
      /(?:approximately|around|about)\s*(\d+)\s*-?\s*(\d+)?\s*calories?\s*total/i,
    ];

    for (const pattern of totalPatterns) {
      const match = aiResponse.match(pattern);
      if (match) {
        const [fullMatch, calories1, calories2] = match;

        let finalCalories: number;
        if (calories2) {
          finalCalories = Math.round((parseInt(calories1) + parseInt(calories2)) / 2);
          this.logger.log(`📊 Found calorie range: ${calories1}-${calories2}, using middle value: ${finalCalories}`);
        } else {
          finalCalories = parseInt(calories1);
          this.logger.log(`📊 Found single total calorie value: ${finalCalories}`);
        }

        return {
          calories: finalCalories,
          description: 'Mixed Plate',
        };
      }
    }

    return null;
  }

  private extractIndividualFoodItems(aiResponse: string): SimpleFoodItem[] {
    const foodItems: SimpleFoodItem[] = [];

    const bulletMatches = aiResponse.match(
      /[•*-]\s*([^:]+?)[:.]?\s*(?:approximately|around|about|roughly)?\s*(\d+)(?:-(\d+))?\s*(?:calories?|kcal)/gi,
    );

    if (bulletMatches) {
      for (const match of bulletMatches) {
        const bulletMatch = match.match(
          /[•*-]\s*([^:]+?)[:.]?\s*(?:approximately|around|about|roughly)?\s*(\d+)(?:-(\d+))?\s*(?:calories?|kcal)/i,
        );

        if (bulletMatch) {
          const [, foodName, calories1, calories2] = bulletMatch;

          // If it's a range, take the lower value for individual items (more conservative)
          const finalCalories = calories2 ? parseInt(calories1) : parseInt(calories1);

          const cleanFoodName = foodName.replace(/^(the|this|these|those)\s+/i, '').trim();

          if (cleanFoodName.length > 1) {
            foodItems.push({
              food_name: cleanFoodName.charAt(0).toUpperCase() + cleanFoodName.slice(1).toLowerCase(),
              calories: finalCalories,
            });
          }
        }
      }
    }

    if (foodItems.length === 0) {
      const sentences = aiResponse.split(/[.!?]+/);

      for (const sentence of sentences) {
        const calorieMatch = sentence.match(
          /(\w+[^:]*?)[:.]?\s*(?:approximately|around|about|roughly)?\s*(\d+)(?:-(\d+))?\s*(?:calories?|kcal)/i,
        );

        if (calorieMatch) {
          const [, foodName, calories1, calories2] = calorieMatch;

          const finalCalories = calories2 ? parseInt(calories1) : parseInt(calories1);

          const cleanFoodName = foodName
            .replace(/^(the|this|these|those|my|i ate|i had)\s+/i, '')
            .replace(/\s*(is|are|was|were|contains?|has|have)\s*/i, ' ')
            .trim();

          if (cleanFoodName.length > 1) {
            foodItems.push({
              food_name: cleanFoodName.charAt(0).toUpperCase() + cleanFoodName.slice(1).toLowerCase(),
              calories: finalCalories,
            });
          }
        }
      }
    }

    return foodItems;
  }
}
