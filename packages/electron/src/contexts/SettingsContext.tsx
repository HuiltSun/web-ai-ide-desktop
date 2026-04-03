import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'qwen';
  apiKeyEnvVar: string;
  description?: string;
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    description: 'Most capable model for complex tasks',
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    description: 'Fast and cost-effective',
  },
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    description: 'Balanced performance and intelligence',
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    description: 'Most capable Claude model',
  },
  'qwen-coder-plus': {
    id: 'qwen-coder-plus',
    name: 'Qwen Coder Plus',
    provider: 'qwen',
    apiKeyEnvVar: 'DASHSCOPE_API_KEY',
    description: 'Optimized for code tasks',
  },
  'qwen3-coder': {
    id: 'qwen3-coder',
    name: 'Qwen3 Coder',
    provider: 'qwen',
    apiKeyEnvVar: 'DASHSCOPE_API_KEY',
    description: 'Latest open-source coder model',
  },
};

interface Settings {
  selectedModel: string;
  apiKeys: Record<string, string>;
  theme: 'light' | 'dark';
  fontSize: number;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  setApiKey: (provider: string, key: string) => void;
  getApiKey: (provider: string) => string | undefined;
  availableModels: ModelConfig[];
  selectedModelConfig: ModelConfig | undefined;
}

const defaultSettings: Settings = {
  selectedModel: 'gpt-4o',
  apiKeys: {},
  theme: 'dark',
  fontSize: 14,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const setApiKey = useCallback((provider: string, key: string) => {
    setSettings((prev) => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [provider]: key },
    }));
  }, []);

  const getApiKey = useCallback(
    (provider: string) => {
      return settings.apiKeys[provider];
    },
    [settings.apiKeys]
  );

  const availableModels = Object.values(MODEL_CONFIGS);
  const selectedModelConfig = MODEL_CONFIGS[settings.selectedModel];

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        setApiKey,
        getApiKey,
        availableModels,
        selectedModelConfig,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
