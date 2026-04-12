import { createContext, useContext, useReducer, useCallback, useEffect, useState, ReactNode } from 'react';
import { getTranslation } from '../i18n/translations';
import type { Translations } from '../i18n/translations';
import {
  type Settings,
  type SettingsContextValue,
  type UIStyle,
  type ThemeMode,
  defaultSettings,
} from './settingsTypes';
import { settingsReducer } from './settingsReducer';
import { applyUIStyle, applyThemeMode, createThemeChangeListener } from './settingsTheme';
import { loadSettingsFromStorage } from './settingsStorage';

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, defaultSettings);
  const [t, setT] = useState<Translations>(getTranslation(defaultSettings.language));

  useEffect(() => {
    setT(getTranslation(settings.language));
  }, [settings.language]);

  useEffect(() => {
    const cleanup = createThemeChangeListener(
      settings.themeMode,
      settings.uiStyle,
      () => applyThemeMode(settings.themeMode, settings.uiStyle)
    );
    return cleanup;
  }, [settings.themeMode, settings.uiStyle]);

  useEffect(() => {
    const loadSettings = async () => {
      let loadedUIStyle: UIStyle | null = null;
      let loadedThemeMode: ThemeMode | null = null;

      if (window.electronAPI?.settings) {
        try {
          const data = await window.electronAPI.settings.getAll() as Record<string, unknown>;

          if (typeof data.ui_style === 'string' && (data.ui_style === 'ios' || data.ui_style === 'legacy')) {
            loadedUIStyle = data.ui_style as UIStyle;
          }
          if (typeof data.theme_mode === 'string' && ['light', 'dark', 'system'].includes(data.theme_mode)) {
            loadedThemeMode = data.theme_mode as ThemeMode;
          }

          const payload: Partial<Settings> = {};
          if (Array.isArray(data.ai_providers)) payload.aiProviders = data.ai_providers as Settings['aiProviders'];
          if (typeof data.selected_provider === 'string') payload.selectedProvider = data.selected_provider;
          if (typeof data.selected_model === 'string') payload.selectedModel = data.selected_model;
          if (typeof data.fontSize === 'number') payload.fontSize = data.fontSize;
          if (typeof data.tabSize === 'number') payload.tabSize = data.tabSize;
          if (typeof data.language === 'string' && ['en', 'zh'].includes(data.language)) {
            payload.language = data.language as Settings['language'];
          }

          if (Object.keys(payload).length > 0) {
            dispatch({ type: 'LOAD_SETTINGS', payload });
          }
        } catch (err) {
          console.error('Failed to load settings from electron:', err);
        }
      } else {
        const loaded = loadSettingsFromStorage();

        if (loaded.aiProviders) dispatch({ type: 'LOAD_SETTINGS', payload: { aiProviders: loaded.aiProviders } });
        if (loaded.selectedProvider) dispatch({ type: 'LOAD_SETTINGS', payload: { selectedProvider: loaded.selectedProvider } });
        if (loaded.selectedModel) dispatch({ type: 'LOAD_SETTINGS', payload: { selectedModel: loaded.selectedModel } });
        if (loaded.fontSize) dispatch({ type: 'LOAD_SETTINGS', payload: { fontSize: loaded.fontSize } });
        if (loaded.tabSize) dispatch({ type: 'LOAD_SETTINGS', payload: { tabSize: loaded.tabSize } });
        if (loaded.language) {
          dispatch({ type: 'LOAD_SETTINGS', payload: { language: loaded.language } });
          setT(getTranslation(loaded.language));
        }
        if (loaded.uiStyle) loadedUIStyle = loaded.uiStyle;
        if (loaded.themeMode) loadedThemeMode = loaded.themeMode;
      }

      const initialUIStyle = loadedUIStyle || 'ios';
      const initialThemeMode = loadedThemeMode || 'dark';

      applyUIStyle(initialUIStyle);
      applyThemeMode(initialThemeMode, initialUIStyle);

      if (loadedUIStyle) dispatch({ type: 'SET_UI_STYLE', payload: loadedUIStyle });
      if (loadedThemeMode) dispatch({ type: 'SET_THEME_MODE', payload: loadedThemeMode });
    };
    loadSettings();
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
  }, []);

  const addProvider = useCallback((provider?: Settings['aiProviders'][0]) => {
    dispatch({ type: 'ADD_PROVIDER', payload: provider });
  }, []);

  const removeProvider = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_PROVIDER', payload: id });
  }, []);

  const updateProvider = useCallback((id: string, updates: Partial<Settings['aiProviders'][0]>) => {
    dispatch({ type: 'UPDATE_PROVIDER', payload: { id, updates } });
  }, []);

  const addModel = useCallback((providerId: string) => {
    dispatch({ type: 'ADD_MODEL', payload: providerId });
  }, []);

  const removeModel = useCallback((providerId: string, modelId: string) => {
    dispatch({ type: 'REMOVE_MODEL', payload: { providerId, modelId } });
  }, []);

  const updateModel = useCallback((providerId: string, modelId: string, updates: Partial<Settings['aiProviders'][0]['models'][0]>) => {
    dispatch({ type: 'UPDATE_MODEL', payload: { providerId, modelId, updates } });
  }, []);

  const setSelectedProvider = useCallback((id: string) => {
    dispatch({ type: 'SET_SELECTED_PROVIDER', payload: id });
  }, []);

  const setSelectedModel = useCallback((id: string) => {
    dispatch({ type: 'SET_SELECTED_MODEL', payload: id });
  }, []);

  const setLanguage = useCallback((lang: Settings['language']) => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
    setT(getTranslation(lang));
  }, []);

  const setUIStyle = useCallback((style: UIStyle) => {
    dispatch({ type: 'SET_UI_STYLE', payload: style });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    dispatch({ type: 'SET_THEME_MODE', payload: mode });
  }, []);

  const getSelectedProvider = useCallback(() => {
    return settings.aiProviders.find(p => p.id === settings.selectedProvider);
  }, [settings.aiProviders, settings.selectedProvider]);

  const getSelectedModel = useCallback(() => {
    const provider = settings.aiProviders.find(p => p.id === settings.selectedProvider);
    return provider?.models.find(m => m.id === settings.selectedModel);
  }, [settings.aiProviders, settings.selectedProvider, settings.selectedModel]);

  const value: SettingsContextValue = {
    settings,
    t,
    isUserLoggedIn: false,
    setIsUserLoggedIn: () => {},
    updateSettings,
    addProvider,
    removeProvider,
    updateProvider,
    addModel,
    removeModel,
    updateModel,
    setSelectedProvider,
    setSelectedModel,
    setLanguage,
    setUIStyle,
    setThemeMode,
    getSelectedProvider,
    getSelectedModel,
  };

  return (
    <SettingsContext.Provider value={value}>
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