import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { AIProvider, AIModel } from '../types';
import { Language, getTranslation, Translations } from '../i18n/translations';

interface Settings {
  aiProviders: AIProvider[];
  selectedProvider: string;
  selectedModel: string;
  theme: 'light' | 'dark';
  fontSize: number;
  tabSize: number;
  language: Language;
}

interface SettingsContextValue {
  settings: Settings;
  t: Translations;
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
  getSelectedProvider: () => AIProvider | undefined;
  getSelectedModel: () => AIModel | undefined;
}

const defaultSettings: Settings = {
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
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  language: 'en',
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [t, setT] = useState<Translations>(getTranslation(defaultSettings.language));

  useEffect(() => {
    setT(getTranslation(settings.language));
  }, [settings.language]);

  useEffect(() => {
    const loadSettings = async () => {
      if (window.electronAPI?.settings) {
        try {
          const data = await window.electronAPI.settings.getAll() as {
            ai_providers?: AIProvider[] | Record<string, AIProvider>;
            selected_provider?: string;
            selected_model?: string;
            fontSize?: number;
            tabSize?: number;
            language?: Language;
          };
          if (data.ai_providers) {
            const providers = Array.isArray(data.ai_providers)
              ? data.ai_providers
              : Object.values(data.ai_providers as Record<string, AIProvider>);
            setSettings(prev => ({ ...prev, aiProviders: providers }));
          }
          if (data.selected_provider) setSettings(prev => ({ ...prev, selectedProvider: data.selected_provider as string }));
          if (data.selected_model) setSettings(prev => ({ ...prev, selectedModel: data.selected_model as string }));
          if (data.fontSize) setSettings(prev => ({ ...prev, fontSize: data.fontSize as number }));
          if (data.tabSize) setSettings(prev => ({ ...prev, tabSize: data.tabSize as number }));
          if (data.language) {
            const lang = data.language as Language;
            setSettings(prev => ({ ...prev, language: lang }));
            setT(getTranslation(lang));
          }
        } catch (err) {
          console.error('Failed to load settings from electron:', err);
        }
      } else {
        const savedProviders = localStorage.getItem('ai_providers');
        const savedProvider = localStorage.getItem('selected_provider');
        const savedModel = localStorage.getItem('selected_model');
        const savedFontSize = localStorage.getItem('fontSize');
        const savedTabSize = localStorage.getItem('tabSize');
        const savedLanguage = localStorage.getItem('language') as Language | null;
        if (savedProviders) {
          try {
            const parsed = JSON.parse(savedProviders);
            if (Array.isArray(parsed)) {
              setSettings(prev => ({ ...prev, aiProviders: parsed }));
            }
          } catch (err) {
            console.error('Failed to parse saved providers:', err);
          }
        }
        if (savedProvider) setSettings(prev => ({ ...prev, selectedProvider: savedProvider }));
        if (savedModel) setSettings(prev => ({ ...prev, selectedModel: savedModel }));
        if (savedFontSize) setSettings(prev => ({ ...prev, fontSize: Number(savedFontSize) }));
        if (savedTabSize) setSettings(prev => ({ ...prev, tabSize: Number(savedTabSize) }));
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh')) {
          setSettings(prev => ({ ...prev, language: savedLanguage }));
          setT(getTranslation(savedLanguage));
        }
      }
    };
    loadSettings();
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };

      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('ai_providers', newSettings.aiProviders);
        window.electronAPI.settings.set('selected_provider', newSettings.selectedProvider);
        window.electronAPI.settings.set('selected_model', newSettings.selectedModel);
        window.electronAPI.settings.set('fontSize', newSettings.fontSize);
        window.electronAPI.settings.set('tabSize', newSettings.tabSize);
        window.electronAPI.settings.set('language', newSettings.language);
      } else {
        localStorage.setItem('ai_providers', JSON.stringify(newSettings.aiProviders));
        localStorage.setItem('selected_provider', newSettings.selectedProvider);
        localStorage.setItem('selected_model', newSettings.selectedModel);
        localStorage.setItem('fontSize', String(newSettings.fontSize));
        localStorage.setItem('tabSize', String(newSettings.tabSize));
        localStorage.setItem('language', newSettings.language);
      }

      return newSettings;
    });
  }, []);

  const addProvider = useCallback((provider?: AIProvider) => {
    const newId = `provider-${Date.now()}`;
    const newProvider = provider || {
      id: newId,
      name: 'New Provider',
      apiEndpoint: 'https://api.example.com/v1',
      apiKey: '',
      models: [],
    };
    if (!provider) {
      newProvider.id = newId;
    }
    setSettings(prev => {
      const newProviders = [
        ...prev.aiProviders,
        newProvider,
      ];
      const newSettings = { ...prev, aiProviders: newProviders, selectedProvider: newProvider.id };

      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('ai_providers', newProviders);
        window.electronAPI.settings.set('selected_provider', newProvider.id);
      } else {
        localStorage.setItem('ai_providers', JSON.stringify(newProviders));
        localStorage.setItem('selected_provider', newProvider.id);
      }

      return newSettings;
    });
  }, []);

  const removeProvider = useCallback((id: string) => {
    setSettings(prev => {
      if (prev.aiProviders.length <= 1) return prev;
      const newProviders = prev.aiProviders.filter(p => p.id !== id);
      const newSelectedProvider = prev.selectedProvider === id ? newProviders[0].id : prev.selectedProvider;
      const newSelectedModel = prev.selectedProvider === id ? newProviders[0].models[0]?.id || '' : prev.selectedModel;

      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('ai_providers', newProviders);
        window.electronAPI.settings.set('selected_provider', newSelectedProvider);
        window.electronAPI.settings.set('selected_model', newSelectedModel);
      } else {
        localStorage.setItem('ai_providers', JSON.stringify(newProviders));
        localStorage.setItem('selected_provider', newSelectedProvider);
        localStorage.setItem('selected_model', newSelectedModel);
      }

      return {
        ...prev,
        aiProviders: newProviders,
        selectedProvider: newSelectedProvider,
        selectedModel: newSelectedModel,
      };
    });
  }, []);

  const updateProvider = useCallback((id: string, updates: Partial<AIProvider>) => {
    setSettings(prev => {
      const newProviders = prev.aiProviders.map(p => p.id === id ? { ...p, ...updates } : p);

      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('ai_providers', newProviders);
      } else {
        localStorage.setItem('ai_providers', JSON.stringify(newProviders));
      }

      return { ...prev, aiProviders: newProviders };
    });
  }, []);

  const addModel = useCallback((providerId: string) => {
    const newModelId = `model-${Date.now()}`;
    setSettings(prev => {
      const newProviders = prev.aiProviders.map(p => {
        if (p.id !== providerId) return p;
        return { ...p, models: [...p.models, { id: newModelId, name: 'New Model' }] };
      });
      const newSettings = { ...prev, aiProviders: newProviders, selectedModel: newModelId };

      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('ai_providers', newProviders);
        window.electronAPI.settings.set('selected_model', newModelId);
      } else {
        localStorage.setItem('ai_providers', JSON.stringify(newProviders));
        localStorage.setItem('selected_model', newModelId);
      }

      return newSettings;
    });
  }, []);

  const removeModel = useCallback((providerId: string, modelId: string) => {
    setSettings(prev => {
      const provider = prev.aiProviders.find(p => p.id === providerId);
      if (!provider || provider.models.length <= 1) return prev;

      const newProviders = prev.aiProviders.map(p => {
        if (p.id !== providerId) return p;
        return { ...p, models: p.models.filter(m => m.id !== modelId) };
      });

      const newSelectedModel = prev.selectedModel === modelId
        ? newProviders.find(p => p.id === providerId)?.models[0]?.id || ''
        : prev.selectedModel;

      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('ai_providers', newProviders);
        window.electronAPI.settings.set('selected_model', newSelectedModel);
      } else {
        localStorage.setItem('ai_providers', JSON.stringify(newProviders));
        localStorage.setItem('selected_model', newSelectedModel);
      }

      return { ...prev, aiProviders: newProviders, selectedModel: newSelectedModel };
    });
  }, []);

  const updateModel = useCallback((providerId: string, modelId: string, updates: Partial<AIModel>) => {
    setSettings(prev => {
      const newProviders = prev.aiProviders.map(p => {
        if (p.id !== providerId) return p;
        return { ...p, models: p.models.map(m => m.id === modelId ? { ...m, ...updates } : m) };
      });

      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('ai_providers', newProviders);
      } else {
        localStorage.setItem('ai_providers', JSON.stringify(newProviders));
      }

      return { ...prev, aiProviders: newProviders };
    });
  }, []);

  const setSelectedProvider = useCallback((id: string) => {
    setSettings(prev => {
      const provider = prev.aiProviders.find(p => p.id === id);
      const newModel = provider?.models[0]?.id || prev.selectedModel;

      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('selected_provider', id);
        window.electronAPI.settings.set('selected_model', newModel);
      } else {
        localStorage.setItem('selected_provider', id);
        localStorage.setItem('selected_model', newModel);
      }

      return { ...prev, selectedProvider: id, selectedModel: newModel };
    });
  }, []);

  const setSelectedModel = useCallback((id: string) => {
    setSettings(prev => {
      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('selected_model', id);
      } else {
        localStorage.setItem('selected_model', id);
      }
      return { ...prev, selectedModel: id };
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setSettings(prev => {
      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('language', lang);
      } else {
        localStorage.setItem('language', lang);
      }
      return { ...prev, language: lang };
    });
    setT(getTranslation(lang));
  }, []);

  const getSelectedProvider = useCallback(() => {
    return settings.aiProviders.find(p => p.id === settings.selectedProvider);
  }, [settings.aiProviders, settings.selectedProvider]);

  const getSelectedModel = useCallback(() => {
    const provider = settings.aiProviders.find(p => p.id === settings.selectedProvider);
    return provider?.models.find(m => m.id === settings.selectedModel);
  }, [settings.aiProviders, settings.selectedProvider, settings.selectedModel]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        t,
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
        getSelectedProvider,
        getSelectedModel,
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
