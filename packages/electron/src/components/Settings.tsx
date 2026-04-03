import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export function Settings() {
  const { settings, updateSettings, setApiKey, availableModels } = useSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'api'>('general');

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
          </div>
        )}

        {activeTab === 'models' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Select Model</h3>
            <div className="space-y-2">
              {availableModels.map((model) => (
                <label
                  key={model.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                    settings.selectedModel === model.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={settings.selectedModel === model.id}
                    onChange={() => updateSettings({ selectedModel: model.id })}
                    className="text-blue-500"
                  />
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-gray-500">{model.description}</div>
                  </div>
                  <span className="ml-auto text-xs px-2 py-1 bg-gray-100 rounded">
                    {model.provider}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">API Keys</h3>
            <p className="text-sm text-gray-500">
              Your API keys are stored locally and never sent to our servers.
            </p>

            {['openai', 'anthropic', 'qwen'].map((provider) => (
              <div key={provider}>
                <label className="block text-sm font-medium mb-1 capitalize">
                  {provider === 'qwen' ? 'DashScope (Qwen)' : provider} API Key
                </label>
                <input
                  type="password"
                  value={settings.apiKeys[provider] || ''}
                  onChange={(e) => setApiKey(provider, e.target.value)}
                  placeholder={`Enter your ${provider} API key`}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
