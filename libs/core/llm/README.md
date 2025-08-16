# Core LLM Library

다중 LLM 프로바이더 지원 및 자동 페일오버를 위한 공유 라이브러리입니다.

## 개요

이 라이브러리는 다음 기능을 제공합니다:
- 다중 LLM 프로바이더 지원 (OpenAI, Claude, Ollama)
- 자동 페일오버 및 재시도 로직
- 통합된 인터페이스를 통한 프로바이더 관리
- 토큰 사용량 추적 및 모니터링
- 스트리밍 응답 지원

## 지원하는 프로바이더

- **OpenAI** (GPT-3.5, GPT-4, GPT-4o 등)
- **Claude** (Claude-3 Haiku, Sonnet, Opus)
- **Ollama** (로컬 모델 지원)

## 설치 및 설정

### 1. 의존성 추가

```bash
yarn add @ai-solution/core/llm
```

### 2. 환경 변수 설정

`.env` 파일에 다음 변수들을 추가하세요:

```bash
# OpenAI 설정
OPENAI_API_KEY=sk-your-openai-api-key

# Anthropic 설정
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Ollama 설정 (로컬)
OLLAMA_BASE_URL=http://localhost:11434

# LLM 서비스 설정
LLM_DEFAULT_PROVIDER=openai
LLM_RETRY_ATTEMPTS=3
LLM_RETRY_DELAY=1000
```

### 3. 모듈 import

애플리케이션 모듈에서 LLMModule을 import합니다:

```typescript
import { Module } from '@nestjs/common';
import { LLMModule } from '@ai-solution/core/llm';

@Module({
  imports: [
    LLMModule.forRoot({
      defaultProvider: 'openai',
      fallbackProviders: ['claude', 'ollama'],
      retryAttempts: 3,
      retryDelay: 1000,
    }),
    // 다른 모듈들...
  ],
})
export class AppModule {}
```

### 4. 고급 설정 (forRootAsync 사용)

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMModule } from '@ai-solution/core/llm';

@Module({
  imports: [
    LLMModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        openaiApiKey: configService.get('OPENAI_API_KEY'),
        anthropicApiKey: configService.get('ANTHROPIC_API_KEY'),
        ollamaBaseUrl: configService.get('OLLAMA_BASE_URL'),
        defaultProvider: configService.get('LLM_DEFAULT_PROVIDER'),
        fallbackProviders: ['claude', 'ollama'],
        retryAttempts: 3,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## 기본 사용법

### 1. 간단한 텍스트 생성

```typescript
import { Injectable } from '@nestjs/common';
import { LLMService } from '@ai-solution/core/llm';

@Injectable()
export class ChatService {
  constructor(private readonly llmService: LLMService) {}

  async generateResponse(userMessage: string): Promise<string> {
    const messages = [
      { role: 'system', content: '당신은 도움이 되는 AI 어시스턴트입니다.' },
      { role: 'user', content: userMessage },
    ];

    const response = await this.llmService.generateCompletion(messages);
    return response.content;
  }
}
```

### 2. 특정 프로바이더 사용

```typescript
async generateWithSpecificProvider(userMessage: string): Promise<string> {
  const messages = [
    { role: 'user', content: userMessage },
  ];

  const response = await this.llmService.generateCompletion(messages, {
    provider: 'claude',
    model: 'claude-3-haiku-20240307',
    temperature: 0.7,
    maxTokens: 1000,
  });

  return response.content;
}
```

### 3. 대화 컨텍스트 유지

```typescript
@Injectable()
export class ConversationService {
  private conversations: Map<string, LLMMessage[]> = new Map();

  constructor(private readonly llmService: LLMService) {}

  async addMessage(
    conversationId: string,
    userMessage: string
  ): Promise<string> {
    // 기존 대화 가져오기 또는 새로 시작
    const messages = this.conversations.get(conversationId) || [
      {
        role: 'system',
        content: '당신은 도움이 되는 AI 어시스턴트입니다. 이전 대화 내용을 기억하고 일관성 있게 응답하세요.',
      },
    ];

    // 사용자 메시지 추가
    messages.push({ role: 'user', content: userMessage });

    // LLM 응답 생성
    const response = await this.llmService.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 1000,
    });

    // 어시스턴트 응답 추가
    messages.push({ role: 'assistant', content: response.content });

    // 대화 저장 (최근 20개 메시지만 유지)
    if (messages.length > 20) {
      messages.splice(1, messages.length - 20);
    }
    this.conversations.set(conversationId, messages);

    return response.content;
  }

  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }
}
```

## 고급 사용 예제

### 1. 코드 생성 서비스

```typescript
@Injectable()
export class CodeGenerationService {
  constructor(private readonly llmService: LLMService) {}

  async generateCode(
    language: string,
    description: string,
    requirements?: string[]
  ): Promise<{ code: string; explanation: string; usage: any }> {
    const systemPrompt = `당신은 전문 개발자입니다. 
주어진 요구사항에 따라 ${language} 코드를 생성하세요.
코드는 깔끔하고, 주석이 잘 달려있으며, 모범 사례를 따라야 합니다.`;

    let userPrompt = `다음 기능을 구현하는 ${language} 코드를 작성해주세요:\n${description}`;
    
    if (requirements && requirements.length > 0) {
      userPrompt += `\n\n추가 요구사항:\n${requirements.map(req => `- ${req}`).join('\n')}`;
    }

    userPrompt += `\n\n응답 형식:
\`\`\`${language}
// 코드
\`\`\`

설명: 코드 동작 방식과 주요 특징을 설명해주세요.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.llmService.generateCompletion(messages, {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2000,
    });

    // 코드와 설명 분리
    const content = response.content;
    const codeMatch = content.match(/```[\w]*\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1] : '';
    
    const explanationStart = content.indexOf('설명:');
    const explanation = explanationStart > -1 
      ? content.substring(explanationStart + 3).trim()
      : content;

    return {
      code,
      explanation,
      usage: response.usage,
    };
  }

  async reviewCode(code: string, language: string): Promise<{
    review: string;
    suggestions: string[];
    rating: number;
  }> {
    const messages = [
      {
        role: 'system',
        content: `당신은 시니어 개발자입니다. 제공된 코드를 검토하고 피드백을 제공하세요.
평가 기준: 코드 품질, 성능, 보안, 가독성, 모범 사례 준수
평점: 1-10점 (10점이 최고)`,
      },
      {
        role: 'user',
        content: `다음 ${language} 코드를 검토해주세요:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n
응답 형식:
평점: [1-10]
검토 의견: [전반적인 평가]
개선 제안:
1. [구체적인 개선사항]
2. [구체적인 개선사항]`,
      },
    ];

    const response = await this.llmService.generateCompletion(messages, {
      temperature: 0.5,
      maxTokens: 1500,
    });

    // 응답 파싱
    const content = response.content;
    const ratingMatch = content.match(/평점:\s*(\d+)/);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;

    const reviewMatch = content.match(/검토 의견:\s*(.*?)(?=개선 제안:|$)/s);
    const review = reviewMatch ? reviewMatch[1].trim() : '';

    const suggestionsMatch = content.match(/개선 제안:\s*([\s\S]*)/);
    const suggestionsText = suggestionsMatch ? suggestionsMatch[1] : '';
    const suggestions = suggestionsText
      .split(/\d+\./)
      .slice(1)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return { review, suggestions, rating };
  }
}
```

### 2. 문서 요약 서비스

```typescript
@Injectable()
export class DocumentSummaryService {
  constructor(private readonly llmService: LLMService) {}

  async summarizeText(
    text: string,
    summaryType: 'brief' | 'detailed' | 'bullet' = 'brief',
    language = 'ko'
  ): Promise<{ summary: string; keyPoints: string[]; usage: any }> {
    const summaryInstructions = {
      brief: '3-5문장으로 간단히 요약',
      detailed: '상세한 요약 (200-300단어)',
      bullet: '주요 포인트를 불렛 포인트로 정리',
    };

    const messages = [
      {
        role: 'system',
        content: `당신은 전문 문서 요약 도구입니다. 
주어진 텍스트를 ${language === 'ko' ? '한국어' : '영어'}로 ${summaryInstructions[summaryType]}해주세요.
핵심 내용을 놓치지 않으면서도 간결하게 작성하세요.`,
      },
      {
        role: 'user',
        content: `다음 텍스트를 요약해주세요:\n\n${text}\n\n
응답 형식:
요약:
[요약 내용]

주요 포인트:
- [포인트 1]
- [포인트 2]
- [포인트 3]`,
      },
    ];

    const response = await this.llmService.generateCompletion(messages, {
      temperature: 0.3,
      maxTokens: 1000,
    });

    // 응답 파싱
    const content = response.content;
    const summaryMatch = content.match(/요약:\s*(.*?)(?=주요 포인트:|$)/s);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    const keyPointsMatch = content.match(/주요 포인트:\s*([\s\S]*)/);
    const keyPointsText = keyPointsMatch ? keyPointsMatch[1] : '';
    const keyPoints = keyPointsText
      .split(/[-*]/)
      .slice(1)
      .map(point => point.trim())
      .filter(point => point.length > 0);

    return {
      summary,
      keyPoints,
      usage: response.usage,
    };
  }

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage = 'auto'
  ): Promise<{ translation: string; confidence: number }> {
    const messages = [
      {
        role: 'system',
        content: `당신은 전문 번역가입니다. 자연스럽고 정확한 번역을 제공하세요.
번역 품질에 대한 신뢰도도 1-10점으로 평가해주세요.`,
      },
      {
        role: 'user',
        content: `다음 텍스트를 ${targetLanguage}로 번역해주세요:

${text}

응답 형식:
번역: [번역된 텍스트]
신뢰도: [1-10점]`,
      },
    ];

    const response = await this.llmService.generateCompletion(messages, {
      temperature: 0.2,
      maxTokens: 2000,
    });

    const content = response.content;
    const translationMatch = content.match(/번역:\s*(.*?)(?=신뢰도:|$)/s);
    const translation = translationMatch ? translationMatch[1].trim() : '';

    const confidenceMatch = content.match(/신뢰도:\s*(\d+)/);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;

    return { translation, confidence };
  }
}
```

### 3. 챗봇 컨트롤러

```typescript
@Controller('chat')
export class ChatController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly codeGenerationService: CodeGenerationService,
    private readonly documentSummaryService: DocumentSummaryService,
  ) {}

  @Post('message')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @CurrentUser() user: any,
    @Body() body: { message: string; conversationId?: string },
  ) {
    const conversationId = body.conversationId || `user_${user.id}_${Date.now()}`;
    
    try {
      const response = await this.conversationService.addMessage(
        conversationId,
        body.message,
      );

      return {
        success: true,
        data: {
          response,
          conversationId,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: '응답 생성 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  @Post('generate-code')
  @UseGuards(JwtAuthGuard)
  async generateCode(
    @Body() body: {
      language: string;
      description: string;
      requirements?: string[];
    },
  ) {
    try {
      const result = await this.codeGenerationService.generateCode(
        body.language,
        body.description,
        body.requirements,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: '코드 생성 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  @Post('summarize')
  @UseGuards(JwtAuthGuard)
  async summarizeDocument(
    @Body() body: {
      text: string;
      summaryType?: 'brief' | 'detailed' | 'bullet';
      language?: string;
    },
  ) {
    try {
      const result = await this.documentSummaryService.summarizeText(
        body.text,
        body.summaryType,
        body.language,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: '문서 요약 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  @Get('providers')
  @UseGuards(JwtAuthGuard)
  async getProviderStatus() {
    try {
      const availability = await this.llmService.checkProviderAvailability();
      const availableProviders = this.llmService.getAvailableProviders();

      return {
        success: true,
        data: {
          providers: availableProviders,
          availability,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: '프로바이더 상태 확인 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  @Delete('conversation/:id')
  @UseGuards(JwtAuthGuard)
  async clearConversation(@Param('id') conversationId: string) {
    this.conversationService.clearConversation(conversationId);
    return {
      success: true,
      message: '대화 기록이 삭제되었습니다.',
    };
  }
}
```

## 프로바이더별 설정

### 1. OpenAI 설정

```typescript
// 다양한 모델 사용
const gpt4Response = await llmService.generateCompletion(messages, {
  provider: 'openai',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
});

const gpt35Response = await llmService.generateCompletion(messages, {
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  temperature: 0.5,
  maxTokens: 1000,
});
```

### 2. Claude 설정

```typescript
// Claude 모델 사용
const claudeResponse = await llmService.generateCompletion(messages, {
  provider: 'claude',
  model: 'claude-3-sonnet-20240229',
  temperature: 0.6,
  maxTokens: 1500,
});
```

### 3. Ollama 설정

```typescript
// 로컬 모델 사용
const ollamaResponse = await llmService.generateCompletion(messages, {
  provider: 'ollama',
  model: 'llama2',
  temperature: 0.8,
  maxTokens: 1000,
});
```

## 에러 처리 및 모니터링

### 1. 프로바이더 상태 확인

```typescript
@Injectable()
export class HealthService {
  constructor(private readonly llmService: LLMService) {}

  async checkLLMHealth() {
    const availability = await this.llmService.checkProviderAvailability();
    const providers = this.llmService.getAvailableProviders();

    return {
      totalProviders: providers.length,
      availableProviders: Object.values(availability).filter(Boolean).length,
      providerStatus: availability,
    };
  }
}
```

### 2. 사용량 추적

```typescript
@Injectable()
export class UsageTrackingService {
  private usageStats: Map<string, { requests: number; tokens: number }> = new Map();

  trackUsage(provider: string, usage: any) {
    const current = this.usageStats.get(provider) || { requests: 0, tokens: 0 };
    current.requests += 1;
    current.tokens += usage?.totalTokens || 0;
    this.usageStats.set(provider, current);
  }

  getUsageStats() {
    return Object.fromEntries(this.usageStats);
  }
}
```

### 3. 에러 처리 패턴

```typescript
@Injectable()
export class RobustLLMService {
  constructor(private readonly llmService: LLMService) {}

  async generateWithFallback(
    messages: LLMMessage[],
    options: any = {}
  ): Promise<{ content: string; provider: string; fallbackUsed: boolean }> {
    const providers = ['openai', 'claude', 'ollama'];
    let fallbackUsed = false;

    for (const provider of providers) {
      try {
        const response = await this.llmService.generateCompletion(messages, {
          ...options,
          provider,
        });

        return {
          content: response.content,
          provider: response.provider,
          fallbackUsed,
        };
      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error.message);
        fallbackUsed = true;
      }
    }

    throw new Error('All LLM providers are unavailable');
  }
}
```

## 최적화 팁

### 1. 토큰 사용량 최적화

```typescript
// 프롬프트 길이 제한
function truncatePrompt(text: string, maxTokens = 3000): string {
  const estimatedTokens = text.length / 4; // 대략적인 추정
  if (estimatedTokens <= maxTokens) return text;
  
  const ratio = maxTokens / estimatedTokens;
  const truncatedLength = Math.floor(text.length * ratio);
  return text.substring(0, truncatedLength) + '...';
}

// 시스템 프롬프트 재사용
const SYSTEM_PROMPTS = {
  ASSISTANT: '당신은 도움이 되는 AI 어시스턴트입니다.',
  CODER: '당신은 전문 개발자입니다.',
  TRANSLATOR: '당신은 전문 번역가입니다.',
};
```

### 2. 캐싱 전략

```typescript
@Injectable()
export class CachedLLMService {
  private cache: Map<string, { response: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1시간

  async generateWithCache(
    messages: LLMMessage[],
    options: any = {}
  ): Promise<string> {
    const cacheKey = this.generateCacheKey(messages, options);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.response;
    }

    const response = await this.llmService.generateCompletion(messages, options);
    
    this.cache.set(cacheKey, {
      response: response.content,
      timestamp: Date.now(),
    });

    return response.content;
  }

  private generateCacheKey(messages: LLMMessage[], options: any): string {
    return JSON.stringify({ messages, options });
  }
}
```

이 가이드를 통해 core-llm 라이브러리를 사용하여 강력하고 신뢰성 있는 AI 기능을 구현할 수 있습니다.