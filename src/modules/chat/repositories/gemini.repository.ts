import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../ai/gemini.service';
import { AIRepository, AIResponse } from './ai-repository.interface';
import { MessageContent } from '../../../validations/chat/chat-content.validation';

@Injectable()
export class GeminiRepository implements AIRepository {
  private readonly logger = new Logger(GeminiRepository.name);

  constructor(private readonly geminiService: GeminiService) {}

  async generateResponse(
    prompt: string,
    history?: Array<{ role: 'user' | 'model'; parts: string }>,
    personalContext?: string,
  ): Promise<AIResponse | null> {
    try {
      if (history && history.length > 0) {
        const sessionResult = await this.geminiService.startChatSession(history);
        if (!sessionResult.success || !sessionResult.data) {
          return this.generateSimpleResponse(prompt, personalContext);
        }

        const response = await this.geminiService.sendChatMessage(sessionResult.data, prompt);
        if (!response.success || !response.data) {
          return null;
        }

        return this.createAIResponse(response.data.text, response.data.usage);
      }

      return this.generateSimpleResponse(prompt, personalContext);
    } catch (error) {
      this.logger.error(`Error generating response: ${error.message}`);
      return null;
    }
  }

  async generateResponseWithImage(
    prompt: string,
    imageData: string,
    mimeType: string,
    personalContext?: string,
  ): Promise<AIResponse | null> {
    try {
      const enhancedPrompt = personalContext
        ? `${personalContext}\n\nPlease analyze this food image and provide personalized advice based on my profile:\n${prompt}`
        : `Please analyze this food image for nutritional content and provide dietary advice:\n${prompt}`;

      const response = await this.geminiService.generateContentWithImage(enhancedPrompt, imageData, mimeType);

      if (!response.success || !response.data) {
        return null;
      }

      return this.createAIResponse(response.data.text, response.data.usage);
    } catch (error) {
      this.logger.error(`Error generating image response: ${error.message}`);
      return null;
    }
  }

  async generateResponseWithAudio(
    prompt: string,
    audioData: string,
    mimeType: string,
    personalContext?: string,
  ): Promise<AIResponse | null> {
    try {
      let enhancedPrompt = prompt
        ? `${prompt}`
        : 'Please respond naturally to what the user said in their audio message. You are DietExpert, their AI nutrition assistant.';

      if (personalContext) {
        enhancedPrompt = `${personalContext}\n\nPlease respond to the user's audio message with personalized advice:\n${enhancedPrompt}`;
      }

      const response = await this.geminiService.generateContentWithAudio(enhancedPrompt, audioData, mimeType);

      if (!response.success || !response.data) {
        return null;
      }

      return this.createAIResponse(response.data.text, response.data.usage);
    } catch (error) {
      this.logger.error(`Error generating audio response: ${error.message}`);
      return null;
    }
  }

  private async generateSimpleResponse(prompt: string, personalContext?: string): Promise<AIResponse | null> {
    const enhancedPrompt = personalContext ? `${personalContext}\n\nUser: ${prompt}` : prompt;
    const response = await this.geminiService.generateText(enhancedPrompt);

    if (!response.success || !response.data) {
      return null;
    }

    return this.createAIResponse(response.data.text, response.data.usage);
  }

  private createAIResponse(text: string, usage?: any): AIResponse {
    const content: MessageContent = {
      items: [
        {
          type: 'TEXT',
          text,
        },
      ],
      combined_text: text,
    };

    return { content, usage };
  }
}
