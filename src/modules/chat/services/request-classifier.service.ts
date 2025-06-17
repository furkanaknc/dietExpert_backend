import { Injectable, Logger } from '@nestjs/common';
import { PersonalizationLevel } from '../enums/personalization-level.enum';
import * as natural from 'natural';

@Injectable()
export class RequestClassifierService {
  private readonly logger = new Logger(RequestClassifierService.name);
  private readonly classifier: natural.BayesClassifier;
  private readonly tokenizer: natural.WordTokenizer;

  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.tokenizer = new natural.WordTokenizer();
    this.trainClassifier();
  }

  private trainClassifier() {
    this.classifier.addDocument('analyze my', PersonalizationLevel.FULL);
    this.classifier.addDocument('evaluate my', PersonalizationLevel.FULL);
    this.classifier.addDocument('review my', PersonalizationLevel.FULL);
    this.classifier.addDocument('check my', PersonalizationLevel.FULL);
    this.classifier.addDocument('assess my', PersonalizationLevel.FULL);
    this.classifier.addDocument('my current', PersonalizationLevel.FULL);
    this.classifier.addDocument('my progress', PersonalizationLevel.FULL);
    this.classifier.addDocument('my status', PersonalizationLevel.FULL);
    this.classifier.addDocument('my condition', PersonalizationLevel.FULL);
    this.classifier.addDocument('my situation', PersonalizationLevel.FULL);
    this.classifier.addDocument('my history', PersonalizationLevel.FULL);

    this.classifier.addDocument('recommend', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('suggest', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('plan', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('advice', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('help me with', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('guide me on', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('what should I', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('how to', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('tips for', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('ideas for', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('diet for', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('meal plan for', PersonalizationLevel.MODERATE);
    this.classifier.addDocument('nutrition for', PersonalizationLevel.MODERATE);

    this.classifier.addDocument('what is', PersonalizationLevel.LIGHT);
    this.classifier.addDocument('tell me about', PersonalizationLevel.LIGHT);
    this.classifier.addDocument('explain', PersonalizationLevel.LIGHT);
    this.classifier.addDocument('define', PersonalizationLevel.LIGHT);
    this.classifier.addDocument('general information', PersonalizationLevel.LIGHT);
    this.classifier.addDocument('basics of', PersonalizationLevel.LIGHT);
    this.classifier.addDocument('overview of', PersonalizationLevel.LIGHT);
    this.classifier.addDocument('common questions', PersonalizationLevel.LIGHT);
    this.classifier.addDocument('information about', PersonalizationLevel.LIGHT);
    this.classifier.addDocument('learn about', PersonalizationLevel.LIGHT);

    this.classifier.addDocument('calories in', PersonalizationLevel.NONE);
    this.classifier.addDocument('nutrition facts for', PersonalizationLevel.NONE);
    this.classifier.addDocument('ingredients of', PersonalizationLevel.NONE);
    this.classifier.addDocument('food composition of', PersonalizationLevel.NONE);
    this.classifier.addDocument('basic info on', PersonalizationLevel.NONE);
    this.classifier.addDocument('simple facts about', PersonalizationLevel.NONE);
    this.classifier.addDocument('quick answer on', PersonalizationLevel.NONE);
    this.classifier.addDocument('straightforward question', PersonalizationLevel.NONE);
    this.classifier.addDocument('direct answer for', PersonalizationLevel.NONE);
    this.classifier.addDocument('basic question about', PersonalizationLevel.NONE);
    this.classifier.addDocument('how many calories', PersonalizationLevel.NONE);
    this.classifier.addDocument('what are the ingredients', PersonalizationLevel.NONE);
    this.classifier.addDocument('what is the nutrition', PersonalizationLevel.NONE);

    this.classifier.train();
  }

  classifyRequest(text: string): PersonalizationLevel {
    try {
      const tokens = this.tokenizer.tokenize(text.toLowerCase());
      const classification = this.classifier.classify(tokens.join(' '));

      this.logger.debug(`Classified request: "${text}" as ${classification}`);

      return classification as PersonalizationLevel;
    } catch (error) {
      this.logger.warn(`Error classifying request: ${error.message}`);
      return PersonalizationLevel.LIGHT;
    }
  }
}
