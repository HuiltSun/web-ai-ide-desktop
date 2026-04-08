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
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
  onMenuEvent: (callback: (event: string) => void) => {
    const listener = (event: Electron.IpcRendererEvent, eventName: string) => {
      callback(eventName);
    };
    ipcRenderer.on('menu:new-project', listener);
    ipcRenderer.on('menu:open-project', listener);
    ipcRenderer.on('menu:save', listener);
    ipcRenderer.on('menu:save-as', listener);
    ipcRenderer.on('menu:about', listener);
    return () => {
      ipcRenderer.removeListener('menu:new-project', listener);
      ipcRenderer.removeListener('menu:open-project', listener);
      ipcRenderer.removeListener('menu:save', listener);
      ipcRenderer.removeListener('menu:save-as', listener);
      ipcRenderer.removeListener('menu:about', listener);
    };
  },
});