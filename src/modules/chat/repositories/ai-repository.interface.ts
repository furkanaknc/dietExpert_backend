import { MessageContent } from '../../../validations/chat/chat-content.validation';

export interface AIResponse {
  content: MessageContent;
  usage?: any;
}

export interface AIRepository {
  generateResponse(
    prompt: string,
    history?: Array<{ role: 'user' | 'model'; parts: string }>,
    personalContext?: string,
  ): Promise<AIResponse | null>;

  generateResponseWithImage(
    prompt: string,
    imageData: string,
    mimeType: string,
    personalContext?: string,
  ): Promise<AIResponse | null>;

  generateResponseWithAudio(
    prompt: string,
    audioData: string,
    mimeType: string,
    personalContext?: string,
  ): Promise<AIResponse | null>;
}
