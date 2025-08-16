import { Injectable, Logger } from '@nestjs/common';
import {
  LLMProvider,
  LLMMessage,
  LLMResponse,
  LLMProviderOptions,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OllamaProvider implements LLMProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  public readonly name = 'ollama';

  constructor(private readonly baseUrl: string = 'http://localhost:11434') {}

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      this.logger.error('Ollama provider is not available', error);
      return false;
    }
  }

  async generateCompletion(
    messages: LLMMessage[],
    options: LLMProviderOptions = {}
  ): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || 'llama3.2',
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens,
            top_p: options.topP,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      return {
        content: data.message?.content || '',
        usage: data.eval_count
          ? {
              promptTokens: data.prompt_eval_count || 0,
              completionTokens: data.eval_count || 0,
              totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
            }
          : undefined,
        provider: this.name,
      };
    } catch (error) {
      this.logger.error('Error generating completion with Ollama', error);
      throw error;
    }
  }
}