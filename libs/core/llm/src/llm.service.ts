import { Injectable, Logger } from '@nestjs/common';
import {
  LLMProvider,
  LLMMessage,
  LLMResponse,
  LLMProviderOptions,
} from './interfaces/llm-provider.interface';

export interface LLMServiceOptions {
  defaultProvider?: string;
  fallbackProviders?: string[];
  retryAttempts?: number;
  retryDelay?: number;
}

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider?: string;
  private fallbackProviders: string[] = [];
  private retryAttempts = 3;
  private retryDelay = 1000;

  configure(options: LLMServiceOptions) {
    if (options.defaultProvider) {
      this.defaultProvider = options.defaultProvider;
    }
    if (options.fallbackProviders) {
      this.fallbackProviders = options.fallbackProviders;
    }
    if (options.retryAttempts !== undefined) {
      this.retryAttempts = options.retryAttempts;
    }
    if (options.retryDelay !== undefined) {
      this.retryDelay = options.retryDelay;
    }
  }

  registerProvider(provider: LLMProvider) {
    this.providers.set(provider.name, provider);
    this.logger.log(`Registered LLM provider: ${provider.name}`);
  }

  async generateCompletion(
    messages: LLMMessage[],
    options: LLMProviderOptions & { provider?: string } = {}
  ): Promise<LLMResponse> {
    const providerName = options.provider || this.defaultProvider;
    
    if (!providerName) {
      throw new Error('No provider specified and no default provider configured');
    }

    const primaryProvider = this.providers.get(providerName);
    if (!primaryProvider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    // Try primary provider with retry logic
    try {
      return await this.executeWithRetry(primaryProvider, messages, options);
    } catch (error) {
      this.logger.error(
        `Failed to generate completion with ${providerName}`,
        error
      );

      // Try fallback providers
      for (const fallbackName of this.fallbackProviders) {
        if (fallbackName === providerName) continue;

        const fallbackProvider = this.providers.get(fallbackName);
        if (!fallbackProvider) continue;

        try {
          const isAvailable = await fallbackProvider.isAvailable();
          if (!isAvailable) continue;

          this.logger.log(`Falling back to provider: ${fallbackName}`);
          return await this.executeWithRetry(
            fallbackProvider,
            messages,
            options
          );
        } catch (fallbackError) {
          this.logger.error(
            `Fallback provider ${fallbackName} also failed`,
            fallbackError
          );
        }
      }

      throw error;
    }
  }

  private async executeWithRetry(
    provider: LLMProvider,
    messages: LLMMessage[],
    options: LLMProviderOptions
  ): Promise<LLMResponse> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          throw new Error(`Provider ${provider.name} is not available`);
        }

        return await provider.generateCompletion(messages, options);
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Attempt ${attempt}/${this.retryAttempts} failed for provider ${provider.name}`
        );

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async checkProviderAvailability(): Promise<Record<string, boolean>> {
    const availability: Record<string, boolean> = {};

    for (const [name, provider] of this.providers) {
      availability[name] = await provider.isAvailable();
    }

    return availability;
  }
}