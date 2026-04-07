import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

interface AIModel {
  id: string;
  name: string;
}

interface AIProvider {
  id: string;
  name: string;
  apiEndpoint: string;
  apiKey: string;
  models: AIModel[];
}

interface Settings {
  aiProviders: AIProvider[];
  selectedProvider: string;
  selectedModel: string;
  theme: 'light' | 'dark';
  fontSize: number;
  tabSize: number;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  addProvider: () => void;
  removeProvider: (id: string) => void;
  updateProvider: (id: string, updates: Partial<AIProvider>) => void;
  addModel: (providerId: string) => void;
  removeModel: (providerId: string, modelId: string) => void;
  updateModel: (providerId: string, modelId: string, updates: Partial<AIModel>) => void;
  setSelectedProvider: (id: string) => void;
  setSelectedModel: (id: string) => void;
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
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const loadSettings = async () => {
      if (window.electronAPI?.settings) {
        try {
          const data = await window.electronAPI.settings.getAll();
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
        } catch {}
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
      }

      return newSettings;
    });
  }, []);

  const addProvider = useCallback(() => {
    const newId = `provider-${Date.now()}`;
    setSettings(prev => {
      const newProviders = [
        ...prev.aiProviders,
        {
          id: newId,
          name: 'New Provider',
          apiEndpoint: 'https://api.example.com/v1',
          apiKey: '',
          models: [],
        },
      ];
      const newSettings = { ...prev, aiProviders: newProviders, selectedProvider: newId };

      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('ai_providers', newProviders);
        window.electronAPI.settings.set('selected_provider', newId);
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
      }

      return { ...prev, selectedProvider: id, selectedModel: newModel };
    });
  }, []);

  const setSelectedModel = useCallback((id: string) => {
    setSettings(prev => {
      if (window.electronAPI?.settings) {
        window.electronAPI.settings.set('selected_model', id);
      }
      return { ...prev, selectedModel: id };
    });
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
        updateSettings,
        addProvider,
        removeProvider,
        updateProvider,
        addModel,
        removeModel,
        updateModel,
        setSelectedProvider,
        setSelectedModel,
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