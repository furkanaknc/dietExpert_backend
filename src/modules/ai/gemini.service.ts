import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import { EnvironmentService } from '../common/environments/environment.service';
import { GeminiChatMessage } from './interfaces/chat.interface';
import { GeminiResponse, ServiceResponse } from './interfaces/response.interface';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private environmentService: EnvironmentService) {
    const apiKey = this.environmentService.get('GEMINI_API_KEY');

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async generateText(prompt: string): Promise<ServiceResponse<GeminiResponse>> {
    try {
      this.logger.log(`Generating text for prompt: ${prompt.substring(0, 50)}...`);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return {
        success: true,
        data: {
          text,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error generating text: ${error.message}`, error.stack);
   
      return {
        success: false,
        error: `Gemini API error: ${error.message}`,
      };
    }
  }

  async startChatSession(history: GeminiChatMessage[] = []): Promise<ServiceResponse<ChatSession>> {
    try {
      const formattedHistory = history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      }));

      const chat = this.model.startChat({
        history: formattedHistory,
      });

      return {
        success: true,
        data: chat,
      };
    } catch (error) {
      this.logger.error(`Error starting chat session: ${error.message}`, error.stack);
     
      return {
        success: false,
        error: `Gemini chat session error: ${error.message}`,
      };
    }
  }

  async sendChatMessage(chat: ChatSession, message: string): Promise<ServiceResponse<GeminiResponse>> {
    try {
      this.logger.log(`Sending chat message: ${message.substring(0, 50)}...`);

      const result = await chat.sendMessage(message);
      const response = result.response;
      const text = response.text();

      return {
        success: true,
        data: {
          text,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error sending chat message: ${error.message}`, error.stack);
   
      return {
        success: false,
        error: `Gemini chat error: ${error.message}`,
      };
    }
  }

  async generateContentWithImage(
    prompt: string,
    imageData: string,
    mimeType: string,
  ): Promise<ServiceResponse<GeminiResponse>> {
    try {
      const visionModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: mimeType,
        },
      };

      const result = await visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        data: {
          text,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error generating content with image: ${error.message}`, error.stack);
     
      return {
        success: false,
        error: `Gemini vision API error: ${error.message}`,
      };
    }
  }

  async generateContentWithAudio(
    prompt: string,
    audioData: string,
    mimeType: string,
  ): Promise<ServiceResponse<GeminiResponse>> {
    try {
      this.logger.log(`Generating content with audio for prompt: ${prompt.substring(0, 50)}...`);

      const audioModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const audioPart = {
        inlineData: {
          data: audioData,
          mimeType: mimeType,
        },
      };

      const result = await audioModel.generateContent([prompt, audioPart]);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        data: {
          text,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error generating content with audio: ${error.message}`, error.stack);
     
      return {
        success: false,
        error: `Gemini audio API error: ${error.message}`,
      };
    }
  }

  async countTokens(text: string): Promise<ServiceResponse<{ text: string; tokenCount: number }>> {
    try {
      const result = await this.model.countTokens(text);
     
      return {
        success: true,
        data: {
          text,
          tokenCount: result.totalTokens,
        },
      };
    } catch (error) {
      this.logger.error(`Error counting tokens: ${error.message}`, error.stack);
     
      return {
        success: false,
        error: `Token counting error: ${error.message}`,
      };
    }
  }
}
