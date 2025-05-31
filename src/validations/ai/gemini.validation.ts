import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { MessageContentSchema } from '../chat/chat-content.validation';

// Simple text generation
const GenerateTextSchema = z.object({
  prompt: z.string().min(1).max(32000),
});

// Chat message with mixed content support
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.union([
    z.string().min(1), // Simple text message
    MessageContentSchema, // Mixed content message
  ]),
});

const StartChatSessionSchema = z.object({
  history: z.array(ChatMessageSchema).optional(),
});

const SendChatMessageSchema = z.object({
  sessionId: z.string().min(1),
  content: z.union([
    z.string().min(1).max(32000), // Simple text message
    MessageContentSchema, // Mixed content message
  ]),
});

// Mixed content generation (text + images + audio)
const GenerateContentWithMixedMediaSchema = z.object({
  content: MessageContentSchema,
  systemPrompt: z.string().optional(),
});

// Legacy support for single image
const GenerateContentWithImageSchema = z.object({
  prompt: z.string().min(1).max(32000),
  imageData: z.string().min(1), // Base64 encoded image
  mimeType: z.string().regex(/^image\/(jpeg|png|gif|webp)$/, {
    message: 'Must be a valid image MIME type',
  }),
});

const CountTokensSchema = z.object({
  text: z.string().min(1),
});

const GeminiResponseSchema = z.object({
  text: z.string(),
  usage: z
    .object({
      promptTokens: z.number(),
      candidatesTokens: z.number(),
      totalTokens: z.number(),
    })
    .optional(),
});

const ChatSessionResponseSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
});

export class GenerateTextPayload extends createZodDto(GenerateTextSchema) {}
export class StartChatSessionPayload extends createZodDto(StartChatSessionSchema) {}
export class SendChatMessagePayload extends createZodDto(SendChatMessageSchema) {}
export class GenerateContentWithMixedMediaPayload extends createZodDto(GenerateContentWithMixedMediaSchema) {}
export class GenerateContentWithImagePayload extends createZodDto(GenerateContentWithImageSchema) {}
export class CountTokensPayload extends createZodDto(CountTokensSchema) {}

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type GeminiResponseType = z.infer<typeof GeminiResponseSchema>;
export type ChatSessionResponse = z.infer<typeof ChatSessionResponseSchema>;
