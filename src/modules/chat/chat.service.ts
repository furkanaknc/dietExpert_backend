import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { CreateChatType } from '../../validations/chat/chat.validation';
import { MessageContent } from '../../validations/chat/chat-content.validation';
import { ContentType, MessageRole } from '@prisma/client';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
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

  🍎 Nutritional Analysis - Upload photos of your meals for calorie and nutrient breakdown

  🥗 Diet Planning - Get personalized meal plans and dietary advice

  🔍 Food Questions - Ask about ingredients, recipes, and healthy alternatives

  📊 Health Goals - Assistance with weight management and nutrition targets

  What would you like to know about nutrition today?`,
        },
      ],
      combined_text: `Hello! I'm DietExpert, your AI nutrition assistant. I'm here to help you with:

  🍎 Nutritional Analysis - Upload photos of your meals for calorie and nutrient breakdown

  🥗 Diet Planning - Get personalized meal plans and dietary advice

  🔍 Food Questions - Ask about ingredients, recipes, and healthy alternatives

  📊 Health Goals - Assistance with weight management and nutrition targets

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

      const userPersonalInfo = await this.getUserPersonalInfo(chat.user_id);

      const aiResponse = await this.getAIResponseWithHistory(chat.messages, userMessage, userPersonalInfo);

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

      const prompt = this.extractTextFromContent(userMessage);

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
      const prompt = this.extractTextFromContent(userMessage);

      try {
        this.logger.log('Attempting native Gemini audio processing...');

        const audioPrompt = prompt
          ? `${prompt}`
          : 'Please respond naturally to what the user said in their audio message. You are DietExpert, their AI nutrition assistant.';

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

        const chat = await this.getChatById(chatId);
        const aiResponse = await this.getAIResponseWithHistory(chat.messages, userMessage);

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

  private async getAIResponse(userMessage: MessageContent, systemContext?: string) {
    try {
      let prompt = this.extractTextFromContent(userMessage);

      // Prepend system context if available
      if (systemContext) {
        prompt = `${systemContext}\n\nUser: ${prompt}`;
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

  private async getAIResponseWithHistory(messages: any[], userMessage: MessageContent, userPersonalInfo?: any) {
    try {
      // Build system context with user's personal information
      let systemContext = '';
      if (userPersonalInfo) {
        systemContext = this.buildUserContextPrompt(userPersonalInfo);
      }

      const geminiHistory = messages
        .slice(0, -1)
        .filter((msg) => msg.role === 'USER' || msg.role === 'ASSISTANT')
        .map((msg: any) => ({
          role: msg.role === 'USER' ? ('user' as const) : ('model' as const),
          parts: this.extractTextFromContent(msg.content),
        }));

      // Add system context as first message if available and no history exists
      if (systemContext && (geminiHistory.length === 0 || geminiHistory[0].role === 'model')) {
        geminiHistory.unshift({
          role: 'user' as const,
          parts: systemContext,
        });
        geminiHistory.push({
          role: 'model' as const,
          parts: 'I understand. I will use your personal information to provide personalized nutrition advice.',
        });
      }

      if (geminiHistory.length === 0 || geminiHistory[0].role === 'model') {
        this.logger.log('Using simple text generation (no valid history)');
        return this.getAIResponse(userMessage, systemContext);
      }

      const sessionResult = await this.geminiService.startChatSession(geminiHistory);

      if (!sessionResult.success || !sessionResult.data) {
        this.logger.warn('Failed to start chat session, falling back to simple generation');
        return this.getAIResponse(userMessage, systemContext);
      }

      let userMessageText = this.extractTextFromContent(userMessage);

      // If we have user info but didn't add to history, prepend to current message
      if (systemContext && geminiHistory.length <= 2) {
        userMessageText = `${systemContext}\n\nUser: ${userMessageText}`;
      }

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

      const systemContext = userPersonalInfo ? this.buildUserContextPrompt(userPersonalInfo) : '';
      return this.getAIResponse(userMessage, systemContext);
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

  private async getUserPersonalInfo(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          health: true,
        },
      });

      return user;
    } catch (error) {
      this.logger.error(`Error fetching user personal info: ${error.message}`);
      return null;
    }
  }

  private buildUserContextPrompt(userInfo: any): string {
    if (!userInfo) return '';

    const parts = ["You are DietExpert, an AI nutrition assistant. Here is the user's personal information:"];

    // Basic info
    parts.push(`Name: ${userInfo.first_name} ${userInfo.last_name}`);

    // Profile information
    if (userInfo.profile) {
      const profile = userInfo.profile;
      if (profile.age) parts.push(`Age: ${profile.age} years old`);
      if (profile.sex) parts.push(`Gender: ${profile.sex.toLowerCase()}`);
      if (profile.weight) parts.push(`Weight: ${profile.weight} kg`);
      if (profile.height) parts.push(`Height: ${profile.height} cm`);
    }

    // Health information
    if (userInfo.health) {
      const health = userInfo.health;
      if (health.activity_level) {
        parts.push(`Activity Level: ${health.activity_level.replace('_', ' ').toLowerCase()}`);
      }
      if (health.goal) {
        parts.push(`Health Goal: ${health.goal.replace('_', ' ').toLowerCase()}`);
      }
      if (health.dietary_restrictions && health.dietary_restrictions.length > 0) {
        parts.push(`Dietary Restrictions: ${health.dietary_restrictions.join(', ')}`);
      }
      if (health.medical_conditions && health.medical_conditions.length > 0) {
        parts.push(`Medical Conditions: ${health.medical_conditions.join(', ')}`);
      }
      if (health.allergies && health.allergies.length > 0) {
        parts.push(`Allergies: ${health.allergies.join(', ')}`);
      }
    }

    parts.push(
      '\nPlease use this information to provide personalized nutrition advice and diet recommendations. If any critical information is missing for diet planning, politely ask the user to provide it.',
    );

    return parts.join('\n');
  }
}
