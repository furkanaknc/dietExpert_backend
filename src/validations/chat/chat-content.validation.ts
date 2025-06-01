import { z } from 'zod';

const TextContentSchema = z.object({
  type: z.literal('TEXT'),
  text: z.string(),
  metadata: z
    .object({
      formatting: z.string().optional(),
      mentions: z.array(z.string()).optional(),
    })
    .optional(),
});

const AudioContentSchema = z.object({
  type: z.literal('AUDIO'),
  audio_url: z.string().url(),
  duration: z.number().min(0),
  file_size: z.number().min(0),
  transcription: z.string().optional(),
  metadata: z
    .object({
      format: z.string().optional(),
      bitrate: z.number().optional(),
      original_filename: z.string().optional(),
    })
    .optional(),
});

const ImageContentSchema = z.object({
  type: z.literal('IMAGE'),
  image_url: z.string().url(),
  width: z.number().min(1).optional(),
  height: z.number().min(1).optional(),
  file_size: z.number().min(0),
  metadata: z
    .object({
      format: z.string().optional(),
      alt_text: z.string().optional(),
      caption: z.string().optional(),
      original_filename: z.string().optional(),
    })
    .optional(),
});

export const ContentItemSchema = z.union([TextContentSchema, AudioContentSchema, ImageContentSchema]);

export const MessageContentSchema = z.object({
  items: z.array(ContentItemSchema).min(1),
  combined_text: z.string().optional(),
});

export type MessageContent = z.infer<typeof MessageContentSchema>;
