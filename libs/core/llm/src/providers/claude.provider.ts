import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import {
  LLMProvider,
  LLMMessage,
  LLMResponse,
  LLMProviderOptions,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class ClaudeProvider implements LLMProvider {
  private readonly logger = new Logger(ClaudeProvider.name);
  private client: Anthropic | null = null;
  public readonly name = 'claude';

  constructor(private readonly apiKey?: string) {
    if (this.apiKey) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.client && !!this.apiKey;
  }

  async generateCompletion(
    messages: LLMMessage[],
    options: LLMProviderOptions = {}
  ): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('Claude client is not initialized');
    }

    try {
      // Separate system message from other messages
      const systemMessage = messages.find((msg) => msg.role === 'system');
      const userMessages = messages.filter((msg) => msg.role !== 'system');

      const completion = await this.client.messages.create({
        model: options.model || 'claude-3-5-sonnet-latest',
        system: systemMessage?.content,
        messages: userMessages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 4096,
        top_p: options.topP,
      });

      const content = completion.content[0];
      return {
        content: content.type === 'text' ? content.text : '',
        usage: completion.usage
          ? {
              promptTokens: completion.usage.input_tokens,
              completionTokens: completion.usage.output_tokens,
              totalTokens:
                completion.usage.input_tokens + completion.usage.output_tokens,
            }
          : undefined,
        provider: this.name,
      };
    } catch (error) {
      this.logger.error('Error generating completion with Claude', error);
      throw error;
    }
  }
}