import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { PlusIcon, TrashIcon } from './Icons';

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
    { id: 'general' as const, label: 'General' },
    { id: 'models' as const, label: 'Models' },
    { id: 'api' as const, label: 'API Keys' },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Theme</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="theme"
                    checked={settings.theme === 'dark'}
                    onChange={() => updateSettings({ theme: 'dark' })}
                    className="text-blue-500"
                  />
                  <span>Dark</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="theme"
                    checked={settings.theme === 'light'}
                    onChange={() => updateSettings({ theme: 'light' })}
                    className="text-blue-500"
                  />
                  <span>Light</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Font Size</h3>
              <select
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {[12, 14, 16, 18, 20].map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Tab Size</h3>
              <select
                value={settings.tabSize}
                onChange={(e) => updateSettings({ tabSize: Number(e.target.value) })}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">AI Providers</h3>
                <button
                  onClick={addProvider}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <PlusIcon size={14} />
                  Add Provider
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {settings.aiProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={`p-4 rounded-lg border transition-all ${
                      settings.selectedProvider === provider.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => setSelectedProvider(provider.id)}
                        className="text-sm font-medium text-gray-900"
                      >
                        {provider.name}
                      </button>
                      {settings.aiProviders.length > 1 && (
                        <button
                          onClick={() => removeProvider(provider.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon size={14} />
                        </button>
                      )}
                    </div>

                    {settings.selectedProvider === provider.id && (
                      <div className="space-y-3 pl-3 border-l-2 border-blue-200">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Provider Name
                          </label>
                          <input
                            type="text"
                            value={provider.name}
                            onChange={(e) => updateProvider(provider.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            API Endpoint
                          </label>
                          <input
                            type="text"
                            value={provider.apiEndpoint}
                            onChange={(e) => updateProvider(provider.id, { apiEndpoint: e.target.value })}
                            placeholder="https://api.example.com/v1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={provider.apiKey}
                            onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                            placeholder="sk-..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
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
                <h3 className="text-lg font-medium">Models</h3>
                <button
                  onClick={() => addModel(settings.selectedProvider)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <PlusIcon size={14} />
                  Add Model
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedProviderModels.map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 rounded-lg border transition-all ${
                      settings.selectedModel === model.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setSelectedModel(model.id)}
                        className="text-sm font-medium text-gray-900"
                      >
                        {model.name}
                      </button>
                      {selectedProviderModels.length > 1 && (
                        <button
                          onClick={() => removeModel(settings.selectedProvider, model.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon size={12} />
                        </button>
                      )}
                    </div>

                    {settings.selectedModel === model.id && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <input
                          type="text"
                          value={model.name}
                          onChange={(e) => updateModel(settings.selectedProvider, model.id, { name: e.target.value })}
                          placeholder="Model Display Name"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-1"
                        />
                        <input
                          type="text"
                          value={model.id}
                          onChange={(e) => updateModel(settings.selectedProvider, model.id, { id: e.target.value })}
                          placeholder="model-id (e.g., gpt-4o)"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedProviderModels.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No models configured. Click "Add Model" to add one.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">API Keys</h3>
            <p className="text-sm text-gray-500">
              Configure API keys in the Models tab above. Keys are stored locally.
            </p>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-500 text-sm">🔑</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Local Storage</div>
                  <div className="text-xs text-gray-500">
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