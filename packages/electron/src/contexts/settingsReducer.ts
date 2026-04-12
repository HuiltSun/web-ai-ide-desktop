import type { Settings } from './settingsTypes';
import type { AIProvider, AIModel } from '../types';
import type { Language } from '../i18n/translations';
import {
  saveSettingsToStorage,
  saveProviderToStorage,
  saveModelToStorage,
  saveLanguageToStorage,
  saveUIStyleToStorage,
  saveThemeModeToStorage,
} from './settingsStorage';
import { applyUIStyle, applyThemeMode } from './settingsTheme';

export type SettingsAction =
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'ADD_PROVIDER'; payload?: AIProvider }
  | { type: 'REMOVE_PROVIDER'; payload: string }
  | { type: 'UPDATE_PROVIDER'; payload: { id: string; updates: Partial<AIProvider> } }
  | { type: 'ADD_MODEL'; payload: string }
  | { type: 'REMOVE_MODEL'; payload: { providerId: string; modelId: string } }
  | { type: 'UPDATE_MODEL'; payload: { providerId: string; modelId: string; updates: Partial<AIModel> } }
  | { type: 'SET_SELECTED_PROVIDER'; payload: string }
  | { type: 'SET_SELECTED_MODEL'; payload: string }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_UI_STYLE'; payload: Settings['uiStyle'] }
  | { type: 'SET_THEME_MODE'; payload: Settings['themeMode'] }
  | { type: 'LOAD_SETTINGS'; payload: Partial<Settings> };

export function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'UPDATE_SETTINGS': {
      const newSettings = { ...state, ...action.payload };
      saveSettingsToStorage(newSettings);
      return newSettings;
    }

    case 'ADD_PROVIDER': {
      const newId = `provider-${Date.now()}`;
      const newProvider = action.payload || {
        id: newId,
        name: 'New Provider',
        apiEndpoint: 'https://api.example.com/v1',
        apiKey: '',
        models: [],
      };
      if (!action.payload?.id) {
        newProvider.id = newId;
      }
      const newProviders = [...state.aiProviders, newProvider];
      saveProviderToStorage(newProviders, newProvider.id, state.selectedModel);
      return { ...state, aiProviders: newProviders, selectedProvider: newProvider.id };
    }

    case 'REMOVE_PROVIDER': {
      if (state.aiProviders.length <= 1) return state;
      const newProviders = state.aiProviders.filter(p => p.id !== action.payload);
      const newSelectedProvider = state.selectedProvider === action.payload
        ? newProviders[0].id
        : state.selectedProvider;
      const newSelectedModel = state.selectedProvider === action.payload
        ? newProviders[0].models[0]?.id || ''
        : state.selectedModel;
      saveProviderToStorage(newProviders, newSelectedProvider, newSelectedModel);
      return {
        ...state,
        aiProviders: newProviders,
        selectedProvider: newSelectedProvider,
        selectedModel: newSelectedModel,
      };
    }

    case 'UPDATE_PROVIDER': {
      const newProviders = state.aiProviders.map(p =>
        p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
      );
      saveProviderToStorage(newProviders, state.selectedProvider, state.selectedModel);
      return { ...state, aiProviders: newProviders };
    }

    case 'ADD_MODEL': {
      const newModelId = `model-${Date.now()}`;
      const newProviders = state.aiProviders.map(p => {
        if (p.id !== action.payload) return p;
        return { ...p, models: [...p.models, { id: newModelId, name: 'New Model' }] };
      });
      saveProviderToStorage(newProviders, state.selectedProvider, newModelId);
      return { ...state, aiProviders: newProviders, selectedModel: newModelId };
    }

    case 'REMOVE_MODEL': {
      const provider = state.aiProviders.find(p => p.id === action.payload.providerId);
      if (!provider || provider.models.length <= 1) return state;

      const newProviders = state.aiProviders.map(p => {
        if (p.id !== action.payload.providerId) return p;
        return { ...p, models: p.models.filter(m => m.id !== action.payload.modelId) };
      });

      const newSelectedModel = state.selectedModel === action.payload.modelId
        ? newProviders.find(p => p.id === action.payload.providerId)?.models[0]?.id || ''
        : state.selectedModel;

      saveProviderToStorage(newProviders, state.selectedProvider, newSelectedModel);
      return { ...state, aiProviders: newProviders, selectedModel: newSelectedModel };
    }

    case 'UPDATE_MODEL': {
      const newProviders = state.aiProviders.map(p => {
        if (p.id !== action.payload.providerId) return p;
        return {
          ...p,
          models: p.models.map(m =>
            m.id === action.payload.modelId ? { ...m, ...action.payload.updates } : m
          ),
        };
      });
      saveProviderToStorage(newProviders, state.selectedProvider, state.selectedModel);
      return { ...state, aiProviders: newProviders };
    }

    case 'SET_SELECTED_PROVIDER': {
      const provider = state.aiProviders.find(p => p.id === action.payload);
      const newModel = provider?.models[0]?.id || state.selectedModel;
      saveProviderToStorage(state.aiProviders, action.payload, newModel);
      return { ...state, selectedProvider: action.payload, selectedModel: newModel };
    }

    case 'SET_SELECTED_MODEL': {
      saveModelToStorage(action.payload);
      return { ...state, selectedModel: action.payload };
    }

    case 'SET_LANGUAGE': {
      saveLanguageToStorage(action.payload);
      return { ...state, language: action.payload };
    }

    case 'SET_UI_STYLE': {
      applyUIStyle(action.payload);
      applyThemeMode(state.themeMode, action.payload);
      saveUIStyleToStorage(action.payload);
      return { ...state, uiStyle: action.payload };
    }

    case 'SET_THEME_MODE': {
      applyThemeMode(action.payload, state.uiStyle);
      saveThemeModeToStorage(action.payload);
      return { ...state, themeMode: action.payload };
    }

    case 'LOAD_SETTINGS': {
      return { ...state, ...action.payload };
    }

    default:
      return state;
  }
}