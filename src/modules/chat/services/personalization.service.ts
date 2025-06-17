import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { PersonalizationLevel } from '../enums/personalization-level.enum';

@Injectable()
export class PersonalizationService {
  private readonly logger = new Logger(PersonalizationService.name);

  constructor(private readonly usersService: UsersService) {}

  async getUserPersonalizedContext(userId: string, level: PersonalizationLevel): Promise<string> {
    try {
      if (level === PersonalizationLevel.NONE) {
        return '';
      }

      const personalInfo = await this.usersService.getPersonalInformation(userId);

      if (!personalInfo) {
        this.logger.log(`No personal information found for user ${userId}`);
        return '';
      }

      const contextParts: string[] = [];

      if (personalInfo.first_name) {
        contextParts.push(`User's name: ${personalInfo.first_name}`);
      }

      if (level >= PersonalizationLevel.LIGHT && personalInfo.profile) {
        const { age, sex, weight, height } = personalInfo.profile;

        if (age) contextParts.push(`Age: ${age} years old`);
        if (sex) contextParts.push(`Sex: ${sex.toLowerCase()}`);
        if (weight) contextParts.push(`Weight: ${weight} kg`);
        if (height) contextParts.push(`Height: ${height} cm`);
      }

      if (level >= PersonalizationLevel.MODERATE && personalInfo.health) {
        const { activity_level, goal, dietary_restrictions, medical_conditions, allergies } = personalInfo.health;

        if (activity_level) {
          const activityMap = {
            SEDENTARY: 'sedentary lifestyle (little to no exercise)',
            LIGHTLY_ACTIVE: 'lightly active (light exercise 1-3 days/week)',
            MODERATELY_ACTIVE: 'moderately active (moderate exercise 3-5 days/week)',
            VERY_ACTIVE: 'very active (hard exercise 6-7 days/week)',
            EXTRA_ACTIVE: 'extremely active (very hard exercise, physical job)',
          };
          contextParts.push(`Activity level: ${activityMap[activity_level] || activity_level.toLowerCase()}`);
        }

        if (goal) {
          const goalMap = {
            WEIGHT_LOSS: 'weight loss',
            WEIGHT_GAIN: 'weight gain',
            MAINTENANCE: 'weight maintenance',
            MUSCLE_GAIN: 'muscle gain',
            HEALTH_IMPROVEMENT: 'general health improvement',
            SPORTS_PERFORMANCE: 'sports performance enhancement',
            GENERAL_WELLNESS: 'general wellness',
          };
          contextParts.push(`Health goal: ${goalMap[goal] || goal.toLowerCase()}`);
        }

        if (dietary_restrictions?.length > 0) {
          contextParts.push(`Dietary restrictions: ${dietary_restrictions.join(', ')}`);
        }

        if (medical_conditions?.length > 0) {
          contextParts.push(`Medical conditions: ${medical_conditions.join(', ')}`);
        }

        if (allergies?.length > 0) {
          contextParts.push(`Allergies: ${allergies.join(', ')}`);
        }
      }

      if (contextParts.length === 0) {
        this.logger.log(`No personal context available for user ${userId}`);
        return '';
      }

      this.logger.log(
        `Generated personal context for user ${userId} with ${contextParts.length} data points at level ${level}`,
      );
      return `\n\n[PERSONAL CONTEXT FOR PERSONALIZED ADVICE]\n${contextParts.join('\n')}\n[END PERSONAL CONTEXT]\n\n`;
    } catch (error) {
      this.logger.warn(`Failed to get user personalized context for user ${userId}: ${error.message}`);
      return '';
    }
  }

  createPersonalizedSystemPrompt(personalContext: string, level: PersonalizationLevel): string {
    const basePrompt = `You are DietExpert, an AI nutrition assistant specializing in dietary advice, meal planning, and nutrition analysis.`;

    if (!personalContext.trim() || level === PersonalizationLevel.NONE) {
      return (
        basePrompt +
        `

CAPABILITIES:
🍎 Nutritional Analysis - Analyze food photos for calories and nutrients
🥗 Meal Planning - Create meal plans
🔍 Food Questions - Answer questions about ingredients and recipes
📊 Health Goals - Provide advice for fitness and wellness goals

Please provide helpful, evidence-based nutrition advice.`
      );
    }

    let personalizationGuidelines = '';
    if (level >= PersonalizationLevel.MODERATE) {
      personalizationGuidelines = `
PERSONALIZATION GUIDELINES:
- Use the user's personal context to provide tailored advice
- Consider their BMI, activity level, and health goals in recommendations
- Respect dietary restrictions and allergies in all suggestions
- Account for medical conditions when providing advice
- Adjust portion sizes and calorie recommendations based on their profile
- Use their name when appropriate to make responses more personal`;
    }

    return (
      basePrompt +
      `

${personalContext}

CAPABILITIES:
🍎 Nutritional Analysis - Analyze food photos for calories and nutrients
🥗 Meal Planning - Create personalized meal plans based on the user's profile
🔍 Food Questions - Answer questions about ingredients and recipes
📊 Health Goals - Provide advice tailored to the user's specific goals and lifestyle
${personalizationGuidelines}

Please provide helpful, evidence-based nutrition advice${level >= PersonalizationLevel.MODERATE ? " that's specifically tailored to this user's profile" : ''}.`
    );
  }
}
