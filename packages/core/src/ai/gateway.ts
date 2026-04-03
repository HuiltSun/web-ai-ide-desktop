import { ChatMessage } from '@web-ai-ide/shared';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { QwenProvider } from './providers/qwen.js';

type ProviderType = 'openai' | 'anthropic' | 'qwen';

export interface AIGatewayConfig {
  provider: ProviderType;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class AIGateway {
  private provider: OpenAIProvider | AnthropicProvider | QwenProvider;

  constructor(config: AIGatewayConfig) {
    switch (config.provider) {
      case 'openai':
        this.provider = new OpenAIProvider({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        });
        break;
      case 'anthropic':
        this.provider = new AnthropicProvider({
          apiKey: config.apiKey,
          model: config.model,
        });
        break;
      case 'qwen':
        this.provider = new QwenProvider({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        });
        break;
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    yield* this.provider.streamChat(messages);
  }
}
