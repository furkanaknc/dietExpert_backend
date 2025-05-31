import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { MessageContentSchema } from './chat-content.validation';

const SendAIMessageSchema = z.object({
  content: MessageContentSchema,
});

const SendImageMessageSchema = z.object({
  content: MessageContentSchema,
  imageData: z.string().min(1),
  mimeType: z.string().regex(/^image\/(jpeg|png|gif|webp)$/, {
    message: 'Must be a valid image MIME type',
  }),
});

const SendAudioMessageSchema = z.object({
  content: MessageContentSchema,
  audioData: z.string().min(1),
  mimeType: z.string().regex(/^audio\/(mpeg|wav|ogg|mp4|webm)$/, {
    message: 'Must be a valid audio MIME type',
  }),
});

export class SendAIMessagePayload extends createZodDto(SendAIMessageSchema) {}
export class SendImageMessagePayload extends createZodDto(SendImageMessageSchema) {}
export class SendAudioMessagePayload extends createZodDto(SendAudioMessageSchema) {}
