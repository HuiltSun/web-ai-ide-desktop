import type { AIProvider, AIModel } from '../types';
import type { Language, Translations } from '../i18n/translations';

export type UIStyle = 'ios' | 'legacy';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  aiProviders: AIProvider[];
  selectedProvider: string;
  selectedModel: string;
  uiStyle: UIStyle;
  themeMode: ThemeMode;
  fontSize: number;
  tabSize: number;
  language: Language;
}

export interface SettingsContextValue {
  settings: Settings;
  t: Translations;
  isUserLoggedIn: boolean;
  setIsUserLoggedIn: (loggedIn: boolean) => void;
  updateSettings: (updates: Partial<Settings>) => void;
  addProvider: (provider?: AIProvider) => void;
  removeProvider: (id: string) => void;
  updateProvider: (id: string, updates: Partial<AIProvider>) => void;
  addModel: (providerId: string) => void;
  removeModel: (providerId: string, modelId: string) => void;
  updateModel: (providerId: string, modelId: string, updates: Partial<AIModel>) => void;
  setSelectedProvider: (id: string) => void;
  setSelectedModel: (id: string) => void;
  setLanguage: (lang: Language) => void;
  setUIStyle: (style: UIStyle) => void;
  setThemeMode: (mode: ThemeMode) => void;
  getSelectedProvider: () => AIProvider | undefined;
  getSelectedModel: () => AIModel | undefined;
}

export const defaultSettings: Settings = {
  aiProviders: [
    {
      id: 'openai',
      name: 'OpenAI',
      apiEndpoint: 'https://api.openai.com/v1',
      apiKey: '',
      models: [{ id: 'gpt-4o', name: 'GPT-4o' }],
    },
  ],
  selectedProvider: 'openai',
  selectedModel: 'gpt-4o',
  uiStyle: 'ios',
  themeMode: 'dark',
  fontSize: 14,
  tabSize: 2,
  language: 'en',
};