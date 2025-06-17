import { Injectable } from '@nestjs/common';
import { AIRepository } from './ai-repository.interface';
import { GeminiRepository } from './gemini.repository';

export enum AIRepositoryType {
  GEMINI = 'gemini',
  // Add more AI providers here as needed
}

@Injectable()
export class AIRepositoryFactory {
  constructor(private readonly geminiRepository: GeminiRepository) {}

  getRepository(type: AIRepositoryType): AIRepository {
    switch (type) {
      case AIRepositoryType.GEMINI:
        return this.geminiRepository;
      default:
        throw new Error(`Unsupported AI repository type: ${type}`);
    }
  }
}
