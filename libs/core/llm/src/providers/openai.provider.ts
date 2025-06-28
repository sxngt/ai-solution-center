import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  LLMProvider,
  LLMMessage,
  LLMResponse,
  LLMProviderOptions,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OpenAIProvider implements LLMProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private client: OpenAI | null = null;
  public readonly name = 'openai';

  constructor(private readonly apiKey?: string) {
    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      this.logger.error('OpenAI provider is not available', error);
      return false;
    }
  }

  async generateCompletion(
    messages: LLMMessage[],
    options: LLMProviderOptions = {}
  ): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('OpenAI client is not initialized');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        stream: false,
      });

      const response = completion.choices[0];
      return {
        content: response.message?.content || '',
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
        provider: this.name,
      };
    } catch (error) {
      this.logger.error('Error generating completion with OpenAI', error);
      throw error;
    }
  }
}