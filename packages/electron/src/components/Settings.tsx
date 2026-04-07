import { useState, useEffect } from 'react';
import {
  SettingsIcon,
  CloseIcon,
  KeyIcon,
  SparklesIcon,
  DatabaseIcon,
  CodeIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
} from './Icons';
import type { AIProvider, AIModel } from '../types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('ai');
  const [providers, setProviders] = useState<AIProvider[]>([
    {
      id: 'openai',
      name: 'OpenAI',
      apiEndpoint: 'https://api.openai.com/v1',
      apiKey: '',
      models: [{ id: 'gpt-4o', name: 'GPT-4o' }],
    },
  ]);
  const [selectedProviderId, setSelectedProviderId] = useState('openai');
  const [selectedModelId, setSelectedModelId] = useState('gpt-4o');
  const [saved, setSaved] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState(2);

  useEffect(() => {
    const loadSettings = async () => {
      if (window.electronAPI?.settings) {
        try {
          const data = await window.electronAPI.settings.getAll() as {
            ai_providers?: AIProvider[];
            selected_provider?: string;
            selected_model?: string;
            fontSize?: number;
            tabSize?: number;
          };
          if (data.ai_providers) setProviders(data.ai_providers);
          if (data.selected_provider) setSelectedProviderId(data.selected_provider);
          if (data.selected_model) setSelectedModelId(data.selected_model);
          if (data.fontSize) setFontSize(data.fontSize);
          if (data.tabSize) setTabSize(data.tabSize);
        } catch {}
      } else {
        const savedProviders = localStorage.getItem('ai_providers');
        const savedProvider = localStorage.getItem('selected_provider');
        const savedModel = localStorage.getItem('selected_model');
        const savedFontSize = localStorage.getItem('fontSize');
        const savedTabSize = localStorage.getItem('tabSize');
        if (savedProviders) {
          try {
            setProviders(JSON.parse(savedProviders));
          } catch {}
        }
        if (savedProvider) setSelectedProviderId(savedProvider);
        if (savedModel) setSelectedModelId(savedModel);
        if (savedFontSize) setFontSize(Number(savedFontSize));
        if (savedTabSize) setTabSize(Number(savedTabSize));
      }
    };
    loadSettings();
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!window.electronAPI?.settings) {
      localStorage.setItem('ai_providers', JSON.stringify(providers));
      localStorage.setItem('selected_provider', selectedProviderId);
      localStorage.setItem('selected_model', selectedModelId);
      localStorage.setItem('fontSize', String(fontSize));
      localStorage.setItem('tabSize', String(tabSize));
    } else {
      window.electronAPI.settings.set('ai_providers', providers);
      window.electronAPI.settings.set('selected_provider', selectedProviderId);
      window.electronAPI.settings.set('selected_model', selectedModelId);
      window.electronAPI.settings.set('fontSize', fontSize);
      window.electronAPI.settings.set('tabSize', tabSize);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  const selectedProviderModels = selectedProvider?.models || [];

  const addProvider = () => {
    const newId = `provider-${Date.now()}`;
    setProviders([
      ...providers,
      {
        id: newId,
        name: 'New Provider',
        apiEndpoint: 'https://api.example.com/v1',
        apiKey: '',
        models: [],
      },
    ]);
    setSelectedProviderId(newId);
  };

  const removeProvider = (id: string) => {
    if (providers.length <= 1) return;
    const newProviders = providers.filter((p) => p.id !== id);
    setProviders(newProviders);
    if (selectedProviderId === id) {
      setSelectedProviderId(newProviders[0].id);
    }
  };

  const updateProvider = (id: string, updates: Partial<AIProvider>) => {
    setProviders(providers.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const addModel = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;
    const newModelId = `model-${Date.now()}`;
    updateProvider(providerId, {
      models: [...provider.models, { id: newModelId, name: 'New Model' }],
    });
  };

  const removeModel = (providerId: string, modelId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider || provider.models.length <= 1) return;
    updateProvider(providerId, {
      models: provider.models.filter((m) => m.id !== modelId),
    });
    if (selectedModelId === modelId) {
      const remaining = provider.models.filter((m) => m.id !== modelId);
      setSelectedModelId(remaining[0]?.id || '');
    }
  };

  const updateModel = (providerId: string, modelId: string, updates: Partial<AIModel>) => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;
    updateProvider(providerId, {
      models: provider.models.map((m) => (m.id === modelId ? { ...m, ...updates } : m)),
    });
  };

  const tabs = [
    { id: 'ai', label: 'AI Providers', icon: SparklesIcon },
    { id: 'api', label: 'API Keys', icon: KeyIcon },
    { id: 'database', label: 'Database', icon: DatabaseIcon },
    { id: 'editor', label: 'Editor', icon: CodeIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-[80vh] bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <SettingsIcon className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <p className="text-xs text-slate-400">Configure your AI IDE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="flex h-[calc(100%-72px)]">
          <div className="w-48 p-4 border-r border-white/5">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">AI Providers</h3>
                    <button
                      onClick={addProvider}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                    >
                      <PlusIcon size={14} />
                      Add Provider
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    {providers.map((provider) => (
                      <div
                        key={provider.id}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedProviderId === provider.id
                            ? 'bg-indigo-500/10 border-indigo-500/30'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => setSelectedProviderId(provider.id)}
                            className="text-sm font-medium text-white"
                          >
                            {provider.name}
                          </button>
                          {providers.length > 1 && (
                            <button
                              onClick={() => removeProvider(provider.id)}
                              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <TrashIcon size={14} />
                            </button>
                          )}
                        </div>

                        {selectedProviderId === provider.id && (
                          <div className="space-y-3 pl-2 border-l-2 border-indigo-500/20">
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                Provider Name
                              </label>
                              <input
                                type="text"
                                value={provider.name}
                                onChange={(e) => updateProvider(provider.id, { name: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                API Endpoint
                              </label>
                              <input
                                type="text"
                                value={provider.apiEndpoint}
                                onChange={(e) => updateProvider(provider.id, { apiEndpoint: e.target.value })}
                                placeholder="https://api.example.com/v1"
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                API Key
                              </label>
                              <input
                                type="password"
                                value={provider.apiKey}
                                onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                                placeholder="sk-..."
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Models</h3>
                    <button
                      onClick={() => addModel(selectedProviderId)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                    >
                      <PlusIcon size={14} />
                      Add Model
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {selectedProviderModels.map((model) => (
                      <div
                        key={model.id}
                        className={`p-3 rounded-xl border transition-all ${
                          selectedModelId === model.id
                            ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => setSelectedModelId(model.id)}
                            className="text-sm font-medium text-white"
                          >
                            {model.name}
                          </button>
                          {selectedProviderModels.length > 1 && (
                            <button
                              onClick={() => removeModel(selectedProviderId, model.id)}
                              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <TrashIcon size={12} />
                            </button>
                          )}
                        </div>

                        {selectedModelId === model.id && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <input
                              type="text"
                              value={model.name}
                              onChange={(e) => updateModel(selectedProviderId, model.id, { name: e.target.value })}
                              placeholder="Model Display Name"
                              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 mb-1"
                            />
                            <input
                              type="text"
                              value={model.id}
                              onChange={(e) => updateModel(selectedProviderId, model.id, { id: e.target.value })}
                              placeholder="model-id (e.g., gpt-4o)"
                              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedProviderModels.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No models configured. Click "Add Model" to add one.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">API Keys</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Configure API keys in the AI Providers tab above. Keys are stored locally.
                  </p>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <KeyIcon size={16} className="text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Local Storage</div>
                        <div className="text-xs text-slate-400">
                          {providers.length} provider(s), keys stored in browser localStorage
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Database Connection</h3>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm text-emerald-400 font-medium">Connected</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-400">
                      <div>Host: localhost:5432</div>
                      <div>Database: webaiide</div>
                      <div>Status: Ready</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Editor Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Font Size
                      </label>
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-slate-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239ca3af\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                      >
                        <option value="12" className="bg-slate-700">12px</option>
                        <option value="14" className="bg-slate-700">14px</option>
                        <option value="16" className="bg-slate-700">16px</option>
                        <option value="18" className="bg-slate-700">18px</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tab Size
                      </label>
                      <select
                        value={tabSize}
                        onChange={(e) => setTabSize(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-slate-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239ca3af\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                      >
                        <option value="2" className="bg-slate-700">2 spaces</option>
                        <option value="4" className="bg-slate-700">4 spaces</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-4 bg-black/20 border-t border-white/5">
          <div className="flex items-center justify-between">
            {saved && (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckIcon size={16} />
                <span className="text-sm">Settings saved</span>
              </div>
            )}
            <div className="flex-1" />
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/5 text-slate-300 text-sm font-medium rounded-xl hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
