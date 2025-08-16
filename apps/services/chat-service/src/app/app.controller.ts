import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

export interface ChatRequest {
  message: string;
  provider?: 'openai' | 'claude' | 'ollama';
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return { 
      status: 'ok', 
      service: 'ai-chat-service',
      timestamp: new Date().toISOString()
    };
  }

  @Post('chat')
  async chat(@Body() request: ChatRequest) {
    return this.appService.generateChatResponse(request);
  }

  @Get('providers')
  async getProviders() {
    return this.appService.getAvailableProviders();
  }
}
