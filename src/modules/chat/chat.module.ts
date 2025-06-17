import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { UsersService } from '../users/users.service';
import { GeminiRepository } from './repositories/gemini.repository';
import { AIRepositoryFactory } from './repositories/ai-repository.factory';
import { PersonalizationService } from './services/personalization.service';
import { RequestClassifierService } from './services/request-classifier.service';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    PrismaService,
    GeminiService,
    UsersService,
    GeminiRepository,
    AIRepositoryFactory,
    PersonalizationService,
    RequestClassifierService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
