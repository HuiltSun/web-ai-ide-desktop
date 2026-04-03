import { useState, useEffect } from 'react';
import {
  SettingsIcon,
  CloseIcon,
  KeyIcon,
  SparklesIcon,
  DatabaseIcon,
  CodeIcon,
  CheckIcon,
} from './Icons';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AIProvider {
  name: string;
  apiKey: string;
  models: string[];
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('ai');
  const [providers, setProviders] = useState<Record<string, AIProvider>>({
    openai: { name: 'OpenAI', apiKey: '', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
    anthropic: { name: 'Anthropic', apiKey: '', models: ['claude-3-5-sonnet', 'claude-3-opus'] },
    qwen: { name: 'Qwen', apiKey: '', models: ['qwen-coder-plus', 'qwen3-coder'] },
  });
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (window.electronAPI?.settings) {
        try {
          const data = await window.electronAPI.settings.getAll();
          if (data.ai_providers) setProviders(data.ai_providers);
          if (data.selected_model) setSelectedModel(data.selected_model);
        } catch {}
      } else {
        const savedProviders = localStorage.getItem('ai_providers');
        const savedModel = localStorage.getItem('selected_model');
        if (savedProviders) {
          try {
            setProviders(JSON.parse(savedProviders));
          } catch {}
        }
        if (savedModel) setSelectedModel(savedModel);
      }
    };
    loadSettings();
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!window.electronAPI?.settings) {
      localStorage.setItem('ai_providers', JSON.stringify(providers));
      localStorage.setItem('selected_model', selectedModel);
    } else {
      window.electronAPI.settings.set('ai_providers', providers);
      window.electronAPI.settings.set('selected_model', selectedModel);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
                  <h3 className="text-sm font-semibold text-white mb-4">Select AI Model</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(providers).map(([key, provider]) => (
                      provider.models.map((model) => (
                        <button
                          key={`${key}-${model}`}
                          onClick={() => setSelectedModel(model)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selectedModel === model
                              ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/50'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="text-sm font-medium text-white">{model}</div>
                          <div className="text-xs text-slate-400">{provider.name}</div>
                        </button>
                      ))
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">API Keys</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    API keys are stored locally and never sent to our servers.
                  </p>
                  <div className="space-y-4">
                    {Object.entries(providers).map(([key, provider]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {provider.name} API Key
                        </label>
                        <input
                          type="password"
                          value={provider.apiKey}
                          onChange={(e) => setProviders({
                            ...providers,
                            [key]: { ...provider, apiKey: e.target.value }
                          })}
                          placeholder="sk-..."
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                    ))}
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
                      <select className="w-full px-4 py-2.5 bg-slate-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239ca3af\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}>
                        <option value="12" className="bg-slate-700">12px</option>
                        <option value="14" selected className="bg-slate-700">14px</option>
                        <option value="16" className="bg-slate-700">16px</option>
                        <option value="18" className="bg-slate-700">18px</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tab Size
                      </label>
                      <select className="w-full px-4 py-2.5 bg-slate-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239ca3af\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}>
                        <option value="2" selected className="bg-slate-700">2 spaces</option>
                        <option value="4" className="bg-slate-700">4 spaces</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-sm font-medium text-slate-300">Word Wrap</div>
                        <div className="text-xs text-slate-500">Wrap long lines</div>
                      </div>
                      <button className="w-12 h-6 rounded-full bg-indigo-500 relative">
                        <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow" />
                      </button>
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