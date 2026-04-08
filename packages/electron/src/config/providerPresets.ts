import type { AIProvider, AIModel } from '../types';
import providerPresetsData from './provider-presets.json';

export interface ProviderPreset {
  id: string;
  name: string;
  apiEndpoint: string;
  models: AIModel[];
}

export const providerPresets: ProviderPreset[] = providerPresetsData as ProviderPreset[];

export function createProviderFromPreset(preset: ProviderPreset, apiKey: string = ''): AIProvider {
  return {
    id: `${preset.id}-${Date.now()}`,
    name: preset.name,
    apiEndpoint: preset.apiEndpoint,
    apiKey,
    models: preset.models.map(m => ({ ...m })),
  };
}
