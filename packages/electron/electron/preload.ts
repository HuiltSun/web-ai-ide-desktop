import { contextBridge, ipcRenderer } from 'electron';

interface AIProvider {
  name: string;
  apiKey: string;
  models: string[];
}

interface SettingsData {
  ai_providers: Record<string, AIProvider>;
  selected_model: string;
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
