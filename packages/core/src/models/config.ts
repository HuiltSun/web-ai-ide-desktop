export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'qwen';
  apiKeyEnvVar: string;
  baseUrl?: string;
  defaultModel?: string;
  description?: string;
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o',
    description: 'Most capable model for complex tasks',
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
    description: 'Fast and cost-effective',
  },
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-5-sonnet-20240620',
    description: 'Balanced performance and intelligence',
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-opus-20240229',
    description: 'Most capable Claude model',
  },
  'qwen-coder-plus': {
    id: 'qwen-coder-plus',
    name: 'Qwen Coder Plus',
    provider: 'qwen',
    apiKeyEnvVar: 'DASHSCOPE_API_KEY',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-coder-plus',
    description: 'Optimized for code tasks',
  },
  'qwen3-coder': {
    id: 'qwen3-coder',
    name: 'Qwen3 Coder',
    provider: 'qwen',
    apiKeyEnvVar: 'DASHSCOPE_API_KEY',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen3-coder',
    description: 'Latest open-source coder model',
  },
};

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_CONFIGS[modelId];
}

export function listModelsByProvider(provider: 'openai' | 'anthropic' | 'qwen'): ModelConfig[] {
  return Object.values(MODEL_CONFIGS).filter((config) => config.provider === provider);
}

export function listAllModels(): ModelConfig[] {
  return Object.values(MODEL_CONFIGS);
}
