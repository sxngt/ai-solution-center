export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
}

export interface LLMProviderOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface LLMProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generateCompletion(
    messages: LLMMessage[],
    options?: LLMProviderOptions
  ): Promise<LLMResponse>;
}