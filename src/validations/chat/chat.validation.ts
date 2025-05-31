import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { MessageContentSchema } from './chat-content.validation';

const CreateChatSchema = z.object({
  title: z.string().min(1).max(255),
  content: MessageContentSchema,
  user_id: z.string().min(1),
  room_id: z.string().min(1).optional(),
});

export class CreateChatPayload extends createZodDto(CreateChatSchema) {}

export type CreateChatType = z.infer<typeof CreateChatSchema>;
