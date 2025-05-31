import { NestFactory } from '@nestjs/core';
import * as express from 'express';

import { AppModule } from './app.module';
import { EnvironmentService } from './modules/common/environments/environment.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const envService = app.get(EnvironmentService);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.enableCors({
    origin: [envService.get('FRONTEND_URL')].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Access-Token',
      'X-Refresh-Token',
    ],
    exposedHeaders: ['X-Access-Token', 'X-Refresh-Token'],
    optionsSuccessStatus: 200,
  });

  await app.listen(envService.get('PORT'));
}

void bootstrap();
