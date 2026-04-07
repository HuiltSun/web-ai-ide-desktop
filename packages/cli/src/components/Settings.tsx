import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { PlusIcon, TrashIcon, BotIcon, KeyIcon, SettingsIcon } from './Icons';

export function Settings() {
  const {
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
  } = useSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'api'>('models');

  const selectedProvider = settings.aiProviders.find(p => p.id === settings.selectedProvider);
  const selectedProviderModels = selectedProvider?.models || [];

  const tabs = [
    { id: 'general' as const, label: 'General', icon: SettingsIcon },
    { id: 'models' as const, label: 'Models', icon: BotIcon },
    { id: 'api' as const, label: 'API Keys', icon: KeyIcon },
  ];

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-secondary)]">
      <div className="border-b border-[var(--color-border)]">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Theme</h3>
              <div className="flex gap-3">
                {['dark', 'light'].map((theme) => (
                  <label
                    key={theme}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${
                      settings.theme === theme
                        ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400'
                        : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-slate-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      checked={settings.theme === theme}
                      onChange={() => updateSettings({ theme: theme as 'dark' | 'light' })}
                      className="hidden"
                    />
                    <span className="text-sm font-medium capitalize">{theme}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Font Size</h3>
              <select
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              >
                {[12, 14, 16, 18, 20].map((size) => (
                  <option key={size} value={size} className="bg-[var(--color-bg-elevated)]">
                    {size}px
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Tab Size</h3>
              <select
                value={settings.tabSize}
                onChange={(e) => updateSettings({ tabSize: Number(e.target.value) })}
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              >
                <option value={2} className="bg-[var(--color-bg-elevated)]">2 spaces</option>
                <option value={4} className="bg-[var(--color-bg-elevated)]">4 spaces</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">AI Providers</h3>
                <button
                  onClick={addProvider}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <PlusIcon size={12} />
                  Add Provider
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {settings.aiProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      settings.selectedProvider === provider.id
                        ? 'bg-indigo-500/5 border-indigo-500/30'
                        : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => setSelectedProvider(provider.id)}
                        className="text-sm font-semibold text-white"
                      >
                        {provider.name}
                      </button>
                      {settings.aiProviders.length > 1 && (
                        <button
                          onClick={() => removeProvider(provider.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <TrashIcon size={14} />
                        </button>
                      )}
                    </div>

                    {settings.selectedProvider === provider.id && (
                      <div className="space-y-3 pl-3 border-l-2 border-indigo-500/20">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Provider Name
                          </label>
                          <input
                            type="text"
                            value={provider.name}
                            onChange={(e) => updateProvider(provider.id, { name: e.target.value })}
                            className="w-full px-3 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            API Endpoint
                          </label>
                          <input
                            type="text"
                            value={provider.apiEndpoint}
                            onChange={(e) => updateProvider(provider.id, { apiEndpoint: e.target.value })}
                            placeholder="https://api.example.com/v1"
                            className="w-full px-3 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={provider.apiKey}
                            onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                            placeholder="sk-..."
                            className="w-full px-3 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
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
                  onClick={() => addModel(settings.selectedProvider)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <PlusIcon size={12} />
                  Add Model
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedProviderModels.map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 rounded-xl border transition-all ${
                      settings.selectedModel === model.id
                        ? 'bg-indigo-500/5 border-indigo-500/30'
                        : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setSelectedModel(model.id)}
                        className="text-sm font-medium text-white"
                      >
                        {model.name}
                      </button>
                      {selectedProviderModels.length > 1 && (
                        <button
                          onClick={() => removeModel(settings.selectedProvider, model.id)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <TrashIcon size={12} />
                        </button>
                      )}
                    </div>

                    {settings.selectedModel === model.id && (
                      <div className="mt-2 pt-2 border-t border-[var(--color-border)] space-y-2">
                        <input
                          type="text"
                          value={model.name}
                          onChange={(e) => updateModel(settings.selectedProvider, model.id, { name: e.target.value })}
                          placeholder="Model Display Name"
                          className="w-full px-2.5 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                        />
                        <input
                          type="text"
                          value={model.id}
                          onChange={(e) => updateModel(settings.selectedProvider, model.id, { id: e.target.value })}
                          placeholder="model-id (e.g., gpt-4o)"
                          className="w-full px-2.5 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
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
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">API Keys</h3>
            <p className="text-xs text-slate-500">
              Configure API keys in the Models tab above. Keys are stored locally.
            </p>

            <div className="p-4 bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <KeyIcon size={16} className="text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Local Storage</div>
                  <div className="text-xs text-slate-500">
                    {settings.aiProviders.length} provider(s), keys stored in browser localStorage
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
