import type { ProviderConfig } from '../services/agent-process-manager.js';
import { prisma } from '../utils/prisma.js';

export const PROVIDER_TYPE_MAP: Record<string, ProviderConfig['type']> = {
  openai: 'openai',
  anthropic: 'anthropic',
  gemini: 'gemini',
  qwen: 'qwen',
  deepseek: 'openai',
  azure: 'openai',
  github: 'github',
  ollama: 'ollama',
};

export function mapProviderIdToType(providerId: string): ProviderConfig['type'] {
  return PROVIDER_TYPE_MAP[providerId] || 'openai';
}

export function getDefaultProviderConfig(): ProviderConfig {
  return {
    type: 'qwen',
    apiKey: process.env.QWEN_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: process.env.OPENAI_MODEL || 'qwen3.5-plus',
  };
}

export interface AIModel {
  id: string;
  name: string;
}

export interface AIProvider {
  id: string;
  name: string;
  apiEndpoint: string;
  apiKey: string;
  models: AIModel[];
}

export interface SuperpowerConfig {
  providers: AIProvider[];
  selectedProvider: string | null;
  selectedModel: string | null;
}

export function isValidSuperpowerConfig(data: unknown): data is SuperpowerConfig {
  if (!data || typeof data !== 'object') return false;
  const cfg = data as Record<string, unknown>;
  if (!Array.isArray(cfg.providers)) return false;
  if (cfg.selectedProvider !== null && typeof cfg.selectedProvider !== 'string') return false;
  if (cfg.selectedModel !== null && typeof cfg.selectedModel !== 'string') return false;
  return cfg.providers.every(
    (p: unknown) => p && typeof p === 'object' &&
      typeof (p as Record<string, unknown>).id === 'string' &&
      typeof (p as Record<string, unknown>).apiKey === 'string'
  );
}

export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return '****';
  return key.slice(0, 3) + '****' + key.slice(-4);
}

export async function getProviderConfigFromUser(userId: string): Promise<ProviderConfig> {
  const fallback = getDefaultProviderConfig();

  if (!userId) {
    return fallback;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.apiKeys) {
      return fallback;
    }

    const config = user.apiKeys as unknown as SuperpowerConfig;

    if (!isValidSuperpowerConfig(config) || !config.selectedProvider || !config.providers?.length) {
      return fallback;
    }

    const selectedProvider = config.providers.find(
      (p) => p.id === config.selectedProvider
    );

    if (!selectedProvider) {
      return fallback;
    }

    const providerConfig: ProviderConfig = {
      type: mapProviderIdToType(selectedProvider.id),
      apiKey: selectedProvider.apiKey,
    };

    if (selectedProvider.apiEndpoint) {
      providerConfig.baseUrl = selectedProvider.apiEndpoint;
    }

    if (config.selectedModel) {
      providerConfig.model = config.selectedModel;
    }

    return providerConfig;
  } catch (err) {
    console.warn('[getProviderConfigFromUser] Failed to load provider config from DB, using fallback:', err);
    return fallback;
  }
}
