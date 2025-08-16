import { DynamicModule, Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLMService } from './llm.service';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { OllamaProvider } from './providers/ollama.provider';

export interface LLMModuleOptions {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaBaseUrl?: string;
  defaultProvider?: string;
  fallbackProviders?: string[];
  retryAttempts?: number;
  retryDelay?: number;
}

@Global()
@Module({})
export class LLMModule {
  static forRoot(options?: LLMModuleOptions): DynamicModule {
    return {
      module: LLMModule,
      imports: [ConfigModule],
      providers: [
        LLMService,
        {
          provide: 'LLM_OPTIONS',
          useValue: options || {},
        },
        {
          provide: 'LLM_PROVIDERS',
          useFactory: async (
            configService: ConfigService,
            llmOptions: LLMModuleOptions,
            llmService: LLMService
          ) => {
            // Get configuration from options or environment variables
            const openaiKey =
              llmOptions.openaiApiKey ||
              configService.get<string>('OPENAI_API_KEY');
            const anthropicKey =
              llmOptions.anthropicApiKey ||
              configService.get<string>('ANTHROPIC_API_KEY');
            const ollamaUrl =
              llmOptions.ollamaBaseUrl ||
              configService.get<string>('OLLAMA_BASE_URL') ||
              'http://localhost:11434';

            // Create and register providers
            if (openaiKey) {
              const openaiProvider = new OpenAIProvider(openaiKey);
              llmService.registerProvider(openaiProvider);
            }

            if (anthropicKey) {
              const claudeProvider = new ClaudeProvider(anthropicKey);
              llmService.registerProvider(claudeProvider);
            }

            const ollamaProvider = new OllamaProvider(ollamaUrl);
            llmService.registerProvider(ollamaProvider);

            // Configure the service
            llmService.configure({
              defaultProvider:
                llmOptions.defaultProvider ||
                configService.get<string>('LLM_DEFAULT_PROVIDER') ||
                'openai',
              fallbackProviders:
                llmOptions.fallbackProviders ||
                ['ollama', 'claude', 'openai'],
              retryAttempts: llmOptions.retryAttempts || 3,
              retryDelay: llmOptions.retryDelay || 1000,
            });

            return llmService;
          },
          inject: [ConfigService, 'LLM_OPTIONS', LLMService],
        },
      ],
      exports: [LLMService],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory?: (
      ...args: any[]
    ) => Promise<LLMModuleOptions> | LLMModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: LLMModule,
      imports: [ConfigModule, ...(options.imports || [])],
      providers: [
        LLMService,
        {
          provide: 'LLM_OPTIONS',
          useFactory: options.useFactory || (() => ({})),
          inject: options.inject || [],
        },
        {
          provide: 'LLM_PROVIDERS',
          useFactory: async (
            configService: ConfigService,
            llmOptions: LLMModuleOptions,
            llmService: LLMService
          ) => {
            // Get configuration from options or environment variables
            const openaiKey =
              llmOptions.openaiApiKey ||
              configService.get<string>('OPENAI_API_KEY');
            const anthropicKey =
              llmOptions.anthropicApiKey ||
              configService.get<string>('ANTHROPIC_API_KEY');
            const ollamaUrl =
              llmOptions.ollamaBaseUrl ||
              configService.get<string>('OLLAMA_BASE_URL') ||
              'http://localhost:11434';

            // Create and register providers
            if (openaiKey) {
              const openaiProvider = new OpenAIProvider(openaiKey);
              llmService.registerProvider(openaiProvider);
            }

            if (anthropicKey) {
              const claudeProvider = new ClaudeProvider(anthropicKey);
              llmService.registerProvider(claudeProvider);
            }

            const ollamaProvider = new OllamaProvider(ollamaUrl);
            llmService.registerProvider(ollamaProvider);

            // Configure the service
            llmService.configure({
              defaultProvider:
                llmOptions.defaultProvider ||
                configService.get<string>('LLM_DEFAULT_PROVIDER') ||
                'openai',
              fallbackProviders:
                llmOptions.fallbackProviders ||
                ['ollama', 'claude', 'openai'],
              retryAttempts: llmOptions.retryAttempts || 3,
              retryDelay: llmOptions.retryDelay || 1000,
            });

            return llmService;
          },
          inject: [ConfigService, 'LLM_OPTIONS', LLMService],
        },
      ],
      exports: [LLMService],
    };
  }
}