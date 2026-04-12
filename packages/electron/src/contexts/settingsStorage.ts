import type { Settings } from './settingsTypes';
import type { AIProvider } from '../types';
import type { Language } from '../i18n/translations';
import type { UIStyle, ThemeMode } from './settingsTypes';

export function saveSettingsToStorage(settings: Settings): void {
  if (window.electronAPI?.settings) {
    window.electronAPI.settings.set('ai_providers', settings.aiProviders);
    window.electronAPI.settings.set('selected_provider', settings.selectedProvider);
    window.electronAPI.settings.set('selected_model', settings.selectedModel);
    window.electronAPI.settings.set('fontSize', settings.fontSize);
    window.electronAPI.settings.set('tabSize', settings.tabSize);
    window.electronAPI.settings.set('language', settings.language);
  } else {
    localStorage.setItem('ai_providers', JSON.stringify(settings.aiProviders));
    localStorage.setItem('selected_provider', settings.selectedProvider);
    localStorage.setItem('selected_model', settings.selectedModel);
    localStorage.setItem('fontSize', String(settings.fontSize));
    localStorage.setItem('tabSize', String(settings.tabSize));
    localStorage.setItem('language', settings.language);
  }
}

export function saveProviderToStorage(providers: AIProvider[], selectedProvider: string, selectedModel: string): void {
  if (window.electronAPI?.settings) {
    window.electronAPI.settings.set('ai_providers', providers);
    window.electronAPI.settings.set('selected_provider', selectedProvider);
    window.electronAPI.settings.set('selected_model', selectedModel);
  } else {
    localStorage.setItem('ai_providers', JSON.stringify(providers));
    localStorage.setItem('selected_provider', selectedProvider);
    localStorage.setItem('selected_model', selectedModel);
  }
}

export function saveModelToStorage(modelId: string): void {
  if (window.electronAPI?.settings) {
    window.electronAPI.settings.set('selected_model', modelId);
  } else {
    localStorage.setItem('selected_model', modelId);
  }
}

export function saveLanguageToStorage(language: Language): void {
  if (window.electronAPI?.settings) {
    window.electronAPI.settings.set('language', language);
  } else {
    localStorage.setItem('language', language);
  }
}

export function saveUIStyleToStorage(uiStyle: UIStyle): void {
  if (window.electronAPI?.settings) {
    window.electronAPI.settings.set('ui_style', uiStyle);
  } else {
    localStorage.setItem('ui_style', uiStyle);
  }
}

export function saveThemeModeToStorage(themeMode: ThemeMode): void {
  if (window.electronAPI?.settings) {
    window.electronAPI.settings.set('theme_mode', themeMode);
  } else {
    localStorage.setItem('theme_mode', themeMode);
  }
}

export interface LoadedUISettings {
  uiStyle: UIStyle | null;
  themeMode: ThemeMode | null;
  aiProviders: AIProvider[] | null;
  selectedProvider: string | null;
  selectedModel: string | null;
  fontSize: number | null;
  tabSize: number | null;
  language: Language | null;
}

export function loadSettingsFromStorage(): LoadedUISettings {
  const result: LoadedUISettings = {
    uiStyle: null,
    themeMode: null,
    aiProviders: null,
    selectedProvider: null,
    selectedModel: null,
    fontSize: null,
    tabSize: null,
    language: null,
  };

  if (window.electronAPI?.settings) {
    return result;
  }

  const savedUIStyle = localStorage.getItem('ui_style');
  if (savedUIStyle === 'ios' || savedUIStyle === 'legacy') {
    result.uiStyle = savedUIStyle as UIStyle;
  }

  const savedMode = localStorage.getItem('theme_mode');
  if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
    result.themeMode = savedMode as ThemeMode;
  }

  const savedProviders = localStorage.getItem('ai_providers');
  if (savedProviders) {
    try {
      const parsed = JSON.parse(savedProviders);
      if (Array.isArray(parsed)) {
        result.aiProviders = parsed;
      }
    } catch {
      // ignore parse errors
    }
  }

  result.selectedProvider = localStorage.getItem('selected_provider');
  result.selectedModel = localStorage.getItem('selected_model');
  result.fontSize = localStorage.getItem('fontSize') as unknown as number | null;
  result.tabSize = localStorage.getItem('tabSize') as unknown as number | null;

  const savedLanguage = localStorage.getItem('language') as Language | null;
  if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh')) {
    result.language = savedLanguage;
  }

  return result;
}