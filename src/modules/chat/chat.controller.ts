import { Controller, Post, Body, Get, Param, Delete, Put, Query } from '@nestjs/common';
import { CreateChatPayload } from '../../validations/chat/chat.validation';
import { ChatService } from './chat.service';
import {
  SendAIMessagePayload,
  SendImageMessagePayload,
  SendAudioMessagePayload,
} from '../../validations/chat/chat-ai.validation';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(@Body() payload: CreateChatPayload) {
    return this.chatService.createChat(payload);
  }

  @Get('user/:userId')
  async getUserChats(@Param('userId') userId: string) {
    return this.chatService.getUserChats(userId);
  }

  @Get(':chatId')
  async getChatById(@Param('chatId') chatId: string) {
    return this.chatService.getChatById(chatId);
  }

  @Post(':chatId/message')
  async sendAIMessage(@Param('chatId') chatId: string, @Body() payload: SendAIMessagePayload) {
    return this.chatService.sendMessageToAI(chatId, payload.content);
  }

  @Post(':chatId/image')
  async sendImageMessage(@Param('chatId') chatId: string, @Body() payload: SendImageMessagePayload) {
    return this.chatService.sendImageToAI(chatId, payload.content, payload.imageData, payload.mimeType);
  }

  @Post(':chatId/audio')
  async sendAudioMessage(@Param('chatId') chatId: string, @Body() payload: SendAudioMessagePayload) {
    try {
      return this.chatService.sendAudioToAI(chatId, payload.content, payload.audioData, payload.mimeType);
    } catch (error) {
      throw error;
    }
  }

  @Put(':chatId/title')
  async updateChatTitle(
    @Param('chatId') chatId: string,
    @Body() payload: { title: string },
    @Query('userId') userId: string,
  ) {
    return this.chatService.updateChatTitle(chatId, userId, payload.title);
  }

  @Delete(':chatId')
  async deleteChat(@Param('chatId') chatId: string, @Query('userId') userId: string) {
    return this.chatService.deleteChat(chatId, userId);
  }
}
