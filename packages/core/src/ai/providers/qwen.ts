import { ChatMessage } from '@web-ai-ide/shared';
import { OpenAIProvider, OpenAIConfig } from './openai.js';

export interface QwenConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class QwenProvider {
  private provider: OpenAIProvider;

  constructor(config: QwenConfig) {
    const openAIConfig: OpenAIConfig = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: config.model || 'qwen-coder-plus',
    };
    this.provider = new OpenAIProvider(openAIConfig);
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    yield* this.provider.streamChat(messages);
  }
}
