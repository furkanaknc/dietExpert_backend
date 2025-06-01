import { Module } from '@nestjs/common';
import { EnvironmentModule } from './modules/common/environments/environment.module';
import { PrismaModule } from './modules/common/prisma/prisma.module';
import { AIModule } from './modules/ai/ai.module';
import { ChatModule } from './modules/chat/chat.module';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/exception-filters/global-exception.filter';
import { JwtGuard } from './common/guards/jwt.guard';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ValidationPipe } from './common/pipes/validation.pipe';

@Module({
  imports: [EnvironmentModule, PrismaModule, AIModule, ChatModule, UsersModule, AuthModule],
  providers: [
    { provide: APP_PIPE, useClass: ValidationPipe },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtGuard },
  ],
})
export class AppModule {}
