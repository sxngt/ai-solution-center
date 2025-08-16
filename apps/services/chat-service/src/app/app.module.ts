import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LLMModule } from '@ai-solution/core/llm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LLMModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
