import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import log from 'electron-log';
import Store from 'electron-store';

log.initialize();
log.info('Application starting...');

interface AIProvider {
  name: string;
  apiKey: string;
  models: string[];
}

interface StoreSchema {
  ai_providers: Record<string, AIProvider>;
  selected_model: string;
  fontSize: number;
  tabSize: number;
}

const store = new Store<StoreSchema>({
  defaults: {
    ai_providers: {
      openai: { name: 'OpenAI', apiKey: '', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
      anthropic: { name: 'Anthropic', apiKey: '', models: ['claude-3-5-sonnet', 'claude-3-opus'] },
      qwen: { name: 'Qwen', apiKey: '', models: ['qwen-coder-plus', 'qwen3-coder'] },
    },
    selected_model: 'gpt-4o',
    fontSize: 14,
    tabSize: 2,
  },
});

let mainWindow: BrowserWindow | null = null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  log.info('Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Web AI IDE',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    log.info('Window ready to show');
    mainWindow?.show();
  });

  if (VITE_DEV_SERVER_URL) {
    log.info(`Loading dev server: ${VITE_DEV_SERVER_URL}`);
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    log.info(`Loading production file: ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  log.info('App ready');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.handle('settings:get', (_event, key: string) => {
  try {
    log.info(`Getting setting: ${key}`);
    return store.get(key);
  } catch (error) {
    log.error(`Failed to get setting ${key}:`, error);
    return undefined;
  }
});

ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
  try {
    log.info(`Setting: ${key}`);
    store.set(key, value);
    return true;
  } catch (error) {
    log.error(`Failed to set setting ${key}:`, error);
    return false;
  }
});

ipcMain.handle('settings:getAll', () => {
  try {
    log.info('Getting all settings');
    return {
      ai_providers: store.get('ai_providers'),
      selected_model: store.get('selected_model'),
      fontSize: store.get('fontSize'),
      tabSize: store.get('tabSize'),
    };
  } catch (error) {
    log.error('Failed to get all settings:', error);
    return {
      ai_providers: {
        openai: { name: 'OpenAI', apiKey: '', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
        anthropic: { name: 'Anthropic', apiKey: '', models: ['claude-3-5-sonnet', 'claude-3-opus'] },
        qwen: { name: 'Qwen', apiKey: '', models: ['qwen-coder-plus', 'qwen3-coder'] },
      },
      selected_model: 'gpt-4o',
      fontSize: 14,
      tabSize: 2,
    };
  }
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
