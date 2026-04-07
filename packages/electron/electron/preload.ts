import { contextBridge, ipcRenderer } from 'electron';

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

interface SettingsData {
  ai_providers: AIProvider[];
  selected_provider: string;
  selected_model: string;
  fontSize: number;
  tabSize: number;
}

contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
});