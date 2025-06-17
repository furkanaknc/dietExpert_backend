import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { CreateChatType } from '../../validations/chat/chat.validation';
import { MessageContent } from '../../validations/chat/chat-content.validation';
import { ContentType, MessageRole } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly usersService: UsersService, // Add users service for profile data
  ) {}

  async createChat(data: CreateChatType) {
    this.logger.log(`Creating new chat for user: ${data.user_id}`);

    const chat = await this.prisma.chat.create({
      data: {
        title: data.title,
        user_id: data.user_id,
      },
      include: {
        messages: true,
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    const welcomeMessage: MessageContent = {
      items: [
        {
          type: 'TEXT',
          text: `Hello! I'm DietExpert, your AI nutrition assistant. I'm here to help you with:

🍎 **Nutritional Analysis** - Upload photos of your meals for calorie and nutrient breakdown
🥗 **Diet Planning** - Get personalized meal plans and dietary advice  
🔍 **Food Questions** - Ask about ingredients, recipes, and healthy alternatives
📊 **Health Goals** - Assistance with weight management and nutrition targets

What would you like to know about nutrition today?`,
        },
      ],
      combined_text: `Hello! I'm DietExpert, your AI nutrition assistant. I'm here to help you with:

🍎 **Nutritional Analysis** - Upload photos of your meals for calorie and nutrient breakdown
🥗 **Diet Planning** - Get personalized meal plans and dietary advice  
🔍 **Food Questions** - Ask about ingredients, recipes, and healthy alternatives
📊 **Health Goals** - Assistance with weight management and nutrition targets

What would you like to know about nutrition today?`,
    };

    await this.addMessage(chat.id, MessageRole.ASSISTANT, welcomeMessage);

    return this.getChatById(chat.id);
  }

  async getChatById(chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { created_at: 'asc' },
        },
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  async getUserChats(userId: string) {
    return this.prisma.chat.findMany({
      where: { user_id: userId },
      include: {
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async sendMessageToAI(chatId: string, userMessage: MessageContent) {
    try {
      this.logger.log(`Processing AI message for chat: ${chatId}`);

      const userMsg = await this.addMessage(chatId, MessageRole.USER, userMessage);

      const chat = await this.getChatById(chatId);

      // Get personalized context for the user
      const personalContext = await this.getUserPersonalizedContext(chat.user_id);

      const aiResponse = await this.getAIResponseWithHistory(chat.messages, userMessage, personalContext);

      if (!aiResponse) {
        throw new Error('Failed to get AI response');
      }

      const aiMsg = await this.addMessage(chatId, MessageRole.ASSISTANT, aiResponse.content);

      return {
        userMessage: userMsg,
        aiMessage: aiMsg,
        usage: aiResponse.usage,
      };
    } catch (error) {
      this.logger.error(`Error processing AI message: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendImageToAI(chatId: string, userMessage: MessageContent, imageData: string, mimeType: string) {
    try {
      this.logger.log(`Processing AI image message for chat: ${chatId}`);

      const userMsg = await this.addMessage(chatId, MessageRole.USER, userMessage);

      const chat = await this.getChatById(chatId);

      // Get personalized context for the user
      const personalContext = await this.getUserPersonalizedContext(chat.user_id);

      let prompt = this.extractTextFromContent(userMessage);
      
      // Enhance the image analysis prompt with personal context
      if (personalContext) {
        prompt = this.createPersonalizedSystemPrompt(personalContext) + 
                '\n\nPlease analyze this food image and provide personalized advice based on my profile:\n' + prompt;
      } else {
        prompt = 'Please analyze this food image for nutritional content and provide dietary advice:\n' + prompt;
      }

      const geminiResponse = await this.geminiService.generateContentWithImage(prompt, imageData, mimeType);

      if (!geminiResponse.success || !geminiResponse.data) {
        throw new Error('Failed to get response from Gemini Vision');
      }

      const aiMessageContent: MessageContent = {
        items: [
          {
            type: 'TEXT',
            text: geminiResponse.data.text,
          },
        ],
        combined_text: geminiResponse.data.text,
      };

      const aiMsg = await this.addMessage(chatId, MessageRole.ASSISTANT, aiMessageContent);

      return {
        userMessage: userMsg,
        aiMessage: aiMsg,
        usage: geminiResponse.data.usage,
      };
    } catch (error) {
      this.logger.error(`Error processing AI image message: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendAudioToAI(chatId: string, userMessage: MessageContent, audioData: string, mimeType: string) {
    try {
      this.logger.log(`Processing AI audio message for chat: ${chatId}`);

      const userMsg = await this.addMessage(chatId, MessageRole.USER, userMessage);
      const chat = await this.getChatById(chatId);

      // Get personalized context for the user
      const personalContext = await this.getUserPersonalizedContext(chat.user_id);

      const prompt = this.extractTextFromContent(userMessage);

      try {
        this.logger.log('Attempting native Gemini audio processing...');

        let audioPrompt = prompt
          ? `${prompt}`
          : 'Please respond naturally to what the user said in their audio message. You are DietExpert, their AI nutrition assistant.';

        // Enhance the audio prompt with personal context
        if (personalContext) {
          audioPrompt = this.createPersonalizedSystemPrompt(personalContext) + 
                      '\n\nPlease respond to the user\'s audio message with personalized advice:\n' + audioPrompt;
        }

        const geminiAudioResponse = await this.geminiService.generateContentWithAudio(audioPrompt, audioData, mimeType);

        if (geminiAudioResponse.success && geminiAudioResponse.data) {
          this.logger.log('Successfully processed audio with native Gemini');

          const aiMessageContent: MessageContent = {
            items: [
              {
                type: 'TEXT',
                text: geminiAudioResponse.data.text,
              },
            ],
            combined_text: geminiAudioResponse.data.text,
          };

          const aiMsg = await this.addMessage(chatId, MessageRole.ASSISTANT, aiMessageContent);

          return {
            userMessage: userMsg,
            aiMessage: aiMsg,
            usage: geminiAudioResponse.data.usage,
          };
        }
      } catch (audioError) {
        this.logger.warn(`Native audio processing failed: ${audioError.message}`);
      }

      if (prompt && prompt.trim() && prompt !== 'I sent you an audio message') {
        this.logger.log(`Falling back to transcribed text processing: ${prompt.substring(0, 100)}...`);

        const aiResponse = await this.getAIResponseWithHistory(chat.messages, userMessage, personalContext);

        if (!aiResponse) {
          throw new Error('Failed to get AI response');
        }

        const aiMsg = await this.addMessage(chatId, MessageRole.ASSISTANT, aiResponse.content);

        return {
          userMessage: userMsg,
          aiMessage: aiMsg,
          usage: aiResponse.usage,
        };
      } else {
        const fallbackPrompt =
          "I received an audio message but couldn't process it directly. As DietExpert, I'd be happy to help with nutrition questions! Could you please either:\n\n1. Try speaking again (make sure your browser supports speech recognition)\n2. Type your nutrition question as text\n3. Upload a photo of food you'd like me to analyze\n\nI'm here to help with meal planning, nutrition analysis, dietary advice, and healthy recipes!";

        const geminiResponse = await this.geminiService.generateText(fallbackPrompt);

        if (!geminiResponse.success || !geminiResponse.data) {
          throw new Error('Failed to get response from Gemini for audio message');
        }

        const aiMessageContent: MessageContent = {
          items: [
            {
              type: 'TEXT',
              text: geminiResponse.data.text,
            },
          ],
          combined_text: geminiResponse.data.text,
        };

        const aiMsg = await this.addMessage(chatId, MessageRole.ASSISTANT, aiMessageContent);

        return {
          userMessage: userMsg,
          aiMessage: aiMsg,
          usage: geminiResponse.data.usage,
        };
      }
    } catch (error) {
      this.logger.error(`Error processing AI audio message: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendMixedMessageToAI(chatId: string, userMessage: MessageContent) {
    try {
      this.logger.log(`Processing AI mixed message for chat: ${chatId}`);

      const userMsg = await this.addMessage(chatId, MessageRole.USER, userMessage);
      const chat = await this.getChatById(chatId);

      // Get personalized context for the user
      const personalContext = await this.getUserPersonalizedContext(chat.user_id);

      // Check what types of content we have
      const hasText = userMessage.items.some(item => item.type === 'TEXT');
      const hasImage = userMessage.items.some(item => item.type === 'IMAGE');
      const hasAudio = userMessage.items.some(item => item.type === 'AUDIO');

      // For mixed content, use the standard AI response with history approach
      // since it can handle complex content types via extractTextFromContent
      const aiResponse = await this.getAIResponseWithHistory(chat.messages, userMessage, personalContext);

      if (!aiResponse) {
        throw new Error('Failed to get AI response for mixed message');
      }

      const aiMsg = await this.addMessage(chatId, MessageRole.ASSISTANT, aiResponse.content);

      return {
        userMessage: userMsg,
        aiMessage: aiMsg,
        usage: aiResponse.usage,
      };
    } catch (error) {
      this.logger.error(`Error processing AI mixed message: ${error.message}`, error.stack);
      throw error;
    }
  }

  async addMessage(chatId: string, role: MessageRole, content: MessageContent, contentType?: ContentType) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const finalContentType = contentType || this.determineContentType(content);

    const message = await this.prisma.message.create({
      data: {
        chat_id: chatId,
        role,
        content_type: finalContentType,
        content: content as any,
      },
    });

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updated_at: new Date() },
    });

    return message;
  }

  async deleteChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        user_id: userId,
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found or you do not have permission to delete it');
    }

    await this.prisma.chat.delete({
      where: { id: chatId },
    });

    return { message: 'Chat deleted successfully' };
  }

  async updateChatTitle(chatId: string, userId: string, title: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        user_id: userId,
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found or you do not have permission to update it');
    }

    return this.prisma.chat.update({
      where: { id: chatId },
      data: { title },
    });
  }

  private async getAIResponse(userMessage: MessageContent, personalContext?: string) {
    try {
      let prompt = this.extractTextFromContent(userMessage);
      
      // Add personalized context if available
      if (personalContext) {
        prompt = this.createPersonalizedSystemPrompt(personalContext) + '\n\nUser: ' + prompt;
      }
      
      const response = await this.geminiService.generateText(prompt);

      if (!response.success || !response.data) {
        return null;
      }

      return {
        content: {
          items: [
            {
              type: 'TEXT' as const,
              text: response.data.text,
            },
          ],
          combined_text: response.data.text,
        },
        usage: response.data.usage,
      };
    } catch (error) {
      this.logger.error(`Error getting AI response: ${error.message}`);
      return null;
    }
  }

  private async getAIResponseWithHistory(messages: any[], userMessage: MessageContent, personalContext?: string) {
    try {
      const geminiHistory = messages
        .slice(0, -1)
        .filter((msg) => msg.role === 'USER' || msg.role === 'ASSISTANT')
        .map((msg: any) => ({
          role: msg.role === 'USER' ? ('user' as const) : ('model' as const),
          parts: this.extractTextFromContent(msg.content),
        }));

      if (geminiHistory.length === 0 || geminiHistory[0].role === 'model') {
        this.logger.log('Using simple text generation (no valid history)');
        return this.getAIResponse(userMessage, personalContext);
      }

      // Add personalized system context to the first message if available
      if (personalContext && geminiHistory.length > 0) {
        const systemPrompt = this.createPersonalizedSystemPrompt(personalContext);
        geminiHistory[0].parts = systemPrompt + '\n\nUser: ' + geminiHistory[0].parts;
      }

      const sessionResult = await this.geminiService.startChatSession(geminiHistory);

      if (!sessionResult.success || !sessionResult.data) {
        this.logger.warn('Failed to start chat session, falling back to simple generation');
        return this.getAIResponse(userMessage, personalContext);
      }

      const userMessageText = this.extractTextFromContent(userMessage);
      const geminiResponse = await this.geminiService.sendChatMessage(sessionResult.data, userMessageText);

      if (!geminiResponse.success || !geminiResponse.data) {
        return null;
      }

      return {
        content: {
          items: [
            {
              type: 'TEXT' as const,
              text: geminiResponse.data.text,
            },
          ],
          combined_text: geminiResponse.data.text,
        },
        usage: geminiResponse.data.usage,
      };
    } catch (error) {
      this.logger.error(`Error getting AI response with history: ${error.message}`);
      this.logger.log('Falling back to simple text generation');
      return this.getAIResponse(userMessage, personalContext);
    }
  }

  private extractTextFromContent(content: MessageContent): string {
    if (content.combined_text) {
      return content.combined_text;
    }

    const textParts: string[] = [];
    for (const item of content.items) {
      if (item.type === 'TEXT') {
        textParts.push(item.text);
      } else if (item.type === 'AUDIO' && item.transcription) {
        textParts.push(item.transcription);
      }
    }

    return textParts.join(' ') || 'Mixed content message';
  }

  private determineContentType(content: MessageContent): ContentType {
    if (content.items.length === 1) {
      const item = content.items[0];
      switch (item.type) {
        case 'TEXT':
          return ContentType.TEXT;
        case 'AUDIO':
          return ContentType.AUDIO;
        case 'IMAGE':
          return ContentType.IMAGE;
      }
    }
    return ContentType.MIXED;
  }

  // New method to get personalized context for AI prompts
  private async getUserPersonalizedContext(userId: string): Promise<string> {
    try {
      // Get user's personal information including profile and health data
      const personalInfo = await this.usersService.getPersonalInformation(userId);
      
      if (!personalInfo) {
        this.logger.log(`No personal information found for user ${userId}`);
        return '';
      }

      const contextParts: string[] = [];

      // Add user's name for personalization
      if (personalInfo.first_name) {
        contextParts.push(`User's name: ${personalInfo.first_name}`);
      }

      // Add physical information
      if (personalInfo.profile) {
        const { age, sex, weight, height } = personalInfo.profile;
        
        if (age) contextParts.push(`Age: ${age} years old`);
        if (sex) contextParts.push(`Sex: ${sex.toLowerCase()}`);
        if (weight) contextParts.push(`Weight: ${weight} kg`);
        if (height) contextParts.push(`Height: ${height} cm`);

        // Calculate BMI if we have weight and height
        if (weight && height) {
          const heightInM = height / 100;
          const bmi = (weight / (heightInM * heightInM)).toFixed(1);
          let bmiCategory = '';
          const bmiValue = parseFloat(bmi);
          
          if (bmiValue < 18.5) {
            bmiCategory = ' (underweight)';
          } else if (bmiValue < 25) {
            bmiCategory = ' (normal weight)';
          } else if (bmiValue < 30) {
            bmiCategory = ' (overweight)';
          } else {
            bmiCategory = ' (obese)';
          }
          
          contextParts.push(`BMI: ${bmi}${bmiCategory}`);
        }
      }

      // Add health and lifestyle information
      if (personalInfo.health) {
        const { activity_level, goal, dietary_restrictions, medical_conditions, allergies } = personalInfo.health;

        if (activity_level) {
          const activityMap = {
            'SEDENTARY': 'sedentary lifestyle (little to no exercise)',
            'LIGHTLY_ACTIVE': 'lightly active (light exercise 1-3 days/week)',
            'MODERATELY_ACTIVE': 'moderately active (moderate exercise 3-5 days/week)',
            'VERY_ACTIVE': 'very active (hard exercise 6-7 days/week)',
            'EXTRA_ACTIVE': 'extremely active (very hard exercise, physical job)'
          };
          contextParts.push(`Activity level: ${activityMap[activity_level] || activity_level.toLowerCase()}`);
        }

        if (goal) {
          const goalMap = {
            'WEIGHT_LOSS': 'weight loss',
            'WEIGHT_GAIN': 'weight gain',
            'MAINTENANCE': 'weight maintenance',
            'MUSCLE_GAIN': 'muscle gain',
            'HEALTH_IMPROVEMENT': 'general health improvement',
            'SPORTS_PERFORMANCE': 'sports performance enhancement',
            'GENERAL_WELLNESS': 'general wellness'
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

      this.logger.log(`Generated personal context for user ${userId} with ${contextParts.length} data points`);
      return `\n\n[PERSONAL CONTEXT FOR PERSONALIZED ADVICE]\n${contextParts.join('\n')}\n[END PERSONAL CONTEXT]\n\n`;
    } catch (error) {
      this.logger.warn(`Failed to get user personalized context for user ${userId}: ${error.message}`);
      return '';
    }
  }

  // Enhanced method to create personalized system prompt
  private createPersonalizedSystemPrompt(personalContext: string): string {
    const basePrompt = `You are DietExpert, an AI nutrition assistant specializing in personalized dietary advice, meal planning, and nutrition analysis.`;
    
    if (!personalContext.trim()) {
      return basePrompt + `

CAPABILITIES:
🍎 Nutritional Analysis - Analyze food photos for calories and nutrients
🥗 Meal Planning - Create personalized meal plans
🔍 Food Questions - Answer questions about ingredients and recipes
📊 Health Goals - Provide advice for fitness and wellness goals

Please provide helpful, evidence-based nutrition advice.`;
    }

    return basePrompt + `

${personalContext}

CAPABILITIES:
🍎 Nutritional Analysis - Analyze food photos for calories and nutrients
🥗 Meal Planning - Create personalized meal plans based on the user's profile
🔍 Food Questions - Answer questions about ingredients and recipes
📊 Health Goals - Provide advice tailored to the user's specific goals and lifestyle

PERSONALIZATION GUIDELINES:
- Use the user's personal context to provide tailored advice
- Consider their BMI, activity level, and health goals in recommendations
- Respect dietary restrictions and allergies in all suggestions
- Account for medical conditions when providing advice
- Adjust portion sizes and calorie recommendations based on their profile
- Use their name when appropriate to make responses more personal

Please provide helpful, evidence-based nutrition advice that's specifically tailored to this user's profile.`;
  }
}
