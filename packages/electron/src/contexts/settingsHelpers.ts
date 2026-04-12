import type { Settings, AIProvider, AIModel } from '../types';
import type { UIStyle, ThemeMode } from '../contexts/SettingsContext';
import type { Language } from '../i18n/translations';

type UIStyle = 'ios' | 'legacy';
type ThemeMode = 'light' | 'dark' | 'system';

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

export function applyUIStyle(style: UIStyle): void {
  const root = document.documentElement;
  if (style === 'ios') {
    root.classList.add('ios');
  } else {
    root.classList.remove('ios');
  }
}

export function applyThemeMode(mode: ThemeMode, uiStyle: UIStyle): void {
  const root = document.documentElement;
  if (uiStyle === 'legacy') return;

  let isDark: boolean;
  if (mode === 'system') {
    isDark = getSystemTheme() === 'dark';
  } else {
    isDark = mode === 'dark';
  }

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function saveSettings(settings: Settings): void {
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

export function saveProviderSettings(providers: AIProvider[], selectedProvider: string, selectedModel: string): void {
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

export function saveUISettings(uiStyle: UIStyle, themeMode: ThemeMode): void {
  if (window.electronAPI?.settings) {
    window.electronAPI.settings.set('ui_style', uiStyle);
    window.electronAPI.settings.set('theme_mode', themeMode);
  } else {
    localStorage.setItem('ui_style', uiStyle);
    localStorage.setItem('theme_mode', themeMode);
  }
}

export function saveLanguageSetting(language: Language): void {
  if (window.electronAPI?.settings) {
    window.electronAPI.settings.set('language', language);
  } else {
    localStorage.setItem('language', language);
  }
}

export function saveModelSetting(modelId: string): void {
  if (window.electronAPI?.settings) {
    window.electronAPI.settings.set('selected_model', modelId);
  } else {
    localStorage.setItem('selected_model', modelId);
  }
}