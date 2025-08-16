import { Injectable } from '@nestjs/common';
import { LLMService } from '@ai-solution/core/llm';

export interface ChatRequest {
  message: string;
  provider?: 'openai' | 'claude' | 'ollama';
}

export interface ChatResponse {
  response: string;
  provider: string;
  timestamp: Date;
}

@Injectable()
export class AppService {
  constructor(private readonly llmService: LLMService) {}

  async generateChatResponse(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.llmService.generateCompletion(
        [
          {
            role: 'system',
            content: '당신은 도움이 되는 AI 어시스턴트입니다. 사용자의 질문에 정확하고 유용한 답변을 제공하세요.'
          },
          {
            role: 'user',
            content: request.message
          }
        ],
        {
          provider: request.provider || 'openai',
          maxTokens: 500,
          temperature: 0.7
        }
      );

      return {
        response: response.content,
        provider: response.provider,
        timestamp: new Date()
      };
    } catch (error) {
      // 실제 LLM 연동이 실패하면 모의 응답 반환
      const mockResponses = [
        "안녕하세요! AI 챗봇입니다. 무엇을 도와드릴까요?",
        "흥미로운 질문이네요! 더 자세히 설명해주시겠어요?",
        "정말 좋은 질문입니다! 이것에 대해 함께 알아보겠습니다."
      ];
      
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      return {
        response: `${randomResponse}\n\n(모의 모드 - 원본 메시지: "${request.message}")`,
        provider: 'mock',
        timestamp: new Date()
      };
    }
  }

  async getAvailableProviders() {
    try {
      const providers = await this.llmService.getAvailableProviders();
      return {
        providers,
        total: providers.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        providers: ['mock'],
        total: 1,
        status: 'LLM integration pending - using mock mode',
        timestamp: new Date().toISOString()
      };
    }
  }
}
