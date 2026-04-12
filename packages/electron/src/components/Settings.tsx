import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { CloseIcon, PlusIcon, TrashIcon, SparklesIcon, DatabaseIcon, CodeIcon, GlobeIcon, ChevronDownIcon, SunIcon, MoonIcon, MonitorIcon, PaletteIcon } from './Icons';
import { Language } from '../i18n/translations';
import { providerPresets, createProviderFromPreset } from '../config/providerPresets';

type Tab = 'ai' | 'database' | 'editor' | 'appearance' | 'language';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { settings, t, isLoggedIn, setSelectedProvider, setSelectedModel, addProvider, removeProvider, updateProvider, addModel, removeModel, setLanguage, updateSettings, setUIStyle, setThemeMode } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('ai');
  const [saved, setSaved] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  const handleAddProvider = (presetId: string) => {
    const preset = providerPresets.find(p => p.id === presetId);
    if (preset) {
      const newProvider = createProviderFromPreset(preset);
      addProvider(newProvider);
      setSelectedProvider(newProvider.id);
    }
    setShowPresetDropdown(false);
  };

  const tabs: { id: Tab; icon: React.ReactNode }[] = [
    { id: 'ai', icon: <SparklesIcon size={16} /> },
    { id: 'database', icon: <DatabaseIcon size={16} /> },
    { id: 'editor', icon: <CodeIcon size={16} /> },
    { id: 'appearance', icon: <PaletteIcon size={16} /> },
    { id: 'language', icon: <GlobeIcon size={16} /> },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedProvider = settings.aiProviders.find(p => p.id === settings.selectedProvider);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-[720px] max-h-[85vh] bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t.settings.title}</h2>
            <p className="text-sm text-[var(--color-text-tertiary)]">{t.settings.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-sm text-[var(--color-success)] animate-fade-in">{t.settings.actions.saved}</span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-[var(--color-border)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              {tab.icon}
              {t.settings.tabs[tab.id]}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {!isLoggedIn && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-amber-500 mb-1">{t.settings.ai.loginRequiredTitle}</h4>
                      <p className="text-sm text-amber-400/80">{t.settings.ai.loginRequiredMessage}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className={`space-y-4 ${!isLoggedIn ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">{t.settings.ai.providers}</h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-accent)] bg-[var(--color-accent-subtle)] rounded-lg hover:bg-[var(--color-accent)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!isLoggedIn}
                    >
                      <PlusIcon size={14} />
                      {t.settings.ai.addProvider}
                      <ChevronDownIcon size={14} />
                    </button>
                    {showPresetDropdown && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-xl z-10 overflow-hidden">
                        {providerPresets.filter(p => p.id !== 'custom').map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => handleAddProvider(preset.id)}
                            className="w-full px-3 py-2 text-sm text-left text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {settings.aiProviders.map(provider => (
                    <div
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        settings.selectedProvider === provider.id
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[var(--color-text-primary)]">{provider.name}</span>
                        {settings.aiProviders.length > 1 && (
                          <button
                            onClick={e => { e.stopPropagation(); removeProvider(provider.id); }}
                            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedProvider && (
                <div className={`space-y-4 p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] ${!isLoggedIn ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        {t.settings.ai.providerName}
                      </label>
                      <input
                        type="text"
                        value={selectedProvider.name}
                        onChange={e => updateProvider(selectedProvider.id, { name: e.target.value })}
                        disabled={!isLoggedIn}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        {t.settings.ai.apiEndpoint}
                      </label>
                      <input
                        type="text"
                        value={selectedProvider.apiEndpoint}
                        onChange={e => updateProvider(selectedProvider.id, { apiEndpoint: e.target.value })}
                        disabled={!isLoggedIn}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        {t.settings.ai.apiKey}
                      </label>
                      <input
                        type="password"
                        value={selectedProvider.apiKey}
                        onChange={e => updateProvider(selectedProvider.id, { apiKey: e.target.value })}
                        placeholder="sk-..."
                        disabled={!isLoggedIn}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="border-t border-[var(--color-border)] pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">{t.settings.ai.models}</h4>
                      <button
                        onClick={() => addModel(selectedProvider.id)}
                        disabled={!isLoggedIn}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent-subtle)] rounded-md hover:bg-[var(--color-accent)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusIcon size={12} />
                        {t.settings.ai.addModel}
                      </button>
                    </div>

                    {selectedProvider.models.length === 0 ? (
                      <p className="text-sm text-[var(--color-text-muted)]">{t.settings.ai.noModels}</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedProvider.models.map(model => (
                          <div key={model.id} className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedModel(model.id)}
                              disabled={!isLoggedIn}
                              className={`flex-1 p-2 text-left rounded-md border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                settings.selectedModel === model.id
                                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                                  : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover)]'
                              }`}
                            >
                              <div className="text-sm font-medium text-[var(--color-text-primary)]">{model.name}</div>
                              <div className="text-xs text-[var(--color-text-muted)]">{model.id}</div>
                            </button>
                            {selectedProvider.models.length > 1 && (
                              <button
                                onClick={() => removeModel(selectedProvider.id, model.id)}
                                disabled={!isLoggedIn}
                                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <TrashIcon size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={!isLoggedIn}
                className="w-full py-2.5 rounded-lg font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.settings.actions.save}
              </button>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              {!isLoggedIn && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-amber-500 mb-1">{t.settings.ai.loginRequiredTitle}</h4>
                      <p className="text-sm text-amber-400/80">{t.settings.database.loginRequiredMessage}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className={`p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] ${!isLoggedIn ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                  <DatabaseIcon size={20} className="text-[var(--color-accent)]" />
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t.settings.database.title}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-success)]">●</span>
                    <span className="text-[var(--color-text-secondary)]">{t.settings.database.connected}</span>
                  </div>
                  <div className="text-[var(--color-text-muted)]">{t.settings.database.host}</div>
                  <div className="text-[var(--color-text-muted)]">{t.settings.database.database}</div>
                  <div className="text-[var(--color-text-muted)]">{t.settings.database.status}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                <div className="flex items-center gap-3 mb-4">
                  <CodeIcon size={20} className="text-[var(--color-accent)]" />
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t.settings.editor.title}</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                      {t.settings.editor.fontSize}
                    </label>
                    <input
                      type="number"
                      value={settings.fontSize}
                      onChange={e => {
                        const fontSize = parseInt(e.target.value);
                        if (!isNaN(fontSize) && fontSize > 0) {
                          updateSettings({ fontSize });
                        }
                      }}
                      min={10}
                      max={24}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                      {t.settings.editor.tabSize}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSettings({ tabSize: 2 })}
                        className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                          settings.tabSize === 2
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-text-primary)]'
                            : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                        }`}
                      >
                        {t.settings.editor.spaces2}
                      </button>
                      <button
                        onClick={() => updateSettings({ tabSize: 4 })}
                        className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                          settings.tabSize === 4
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-text-primary)]'
                            : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                        }`}
                      >
                        {t.settings.editor.spaces4}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                <div className="flex items-center gap-3 mb-4">
                  <PaletteIcon size={20} className="text-[var(--color-accent)]" />
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t.settings.appearance?.uiStyleTitle || 'Interface Style'}</h3>
                </div>
                <p className="text-sm text-[var(--color-text-tertiary)] mb-4">{t.settings.appearance?.uiStyleDescription || 'Choose the visual style for the interface'}</p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setUIStyle('ios')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      settings.uiStyle === 'ios'
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <SparklesIcon size={18} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {t.settings.appearance?.iosStyle || 'iOS Style'}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {t.settings.appearance?.iosStyleDesc || 'iOS 17 aesthetic'}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setUIStyle('legacy')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      settings.uiStyle === 'legacy'
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <SparklesIcon size={18} className="text-indigo-400" />
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {t.settings.appearance?.legacyStyle || 'Legacy'}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {t.settings.appearance?.legacyStyleDesc || 'Dark theme'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {settings.uiStyle === 'ios' && (
                <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-3 mb-4">
                    <SunIcon size={20} className="text-[var(--color-accent)]" />
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                      {t.settings.appearance?.colorModeTitle || 'Color Mode'}
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
                    {t.settings.appearance?.colorModeDescription || 'Choose light or dark appearance'}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setThemeMode('light')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        settings.themeMode === 'light'
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                          <SunIcon size={16} className="text-amber-500" />
                        </div>
                        <span className="text-xs font-medium text-[var(--color-text-primary)]">
                          {t.settings.appearance?.light || 'Light'}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setThemeMode('dark')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        settings.themeMode === 'dark'
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                          <MoonIcon size={16} className="text-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-[var(--color-text-primary)]">
                          {t.settings.appearance?.dark || 'Dark'}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setThemeMode('system')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        settings.themeMode === 'system'
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-slate-800 border border-gray-200 flex items-center justify-center">
                          <MonitorIcon size={14} className="text-gray-600" />
                        </div>
                        <span className="text-xs font-medium text-[var(--color-text-primary)]">
                          {t.settings.appearance?.system || 'System'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                <div className="flex items-center gap-3 mb-4">
                  <GlobeIcon size={20} className="text-[var(--color-accent)]" />
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t.settings.language.title}</h3>
                </div>
                <p className="text-sm text-[var(--color-text-tertiary)] mb-4">{t.settings.language.description}</p>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                    {t.settings.language.selectLanguage}
                  </label>

                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full p-4 rounded-lg border transition-all ${
                      settings.language === 'en'
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-medium text-[var(--color-text-primary)]">{t.settings.language.english}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">English</div>
                      </div>
                      {settings.language === 'en' && (
                        <span className="text-[var(--color-accent)]">✓</span>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => handleLanguageChange('zh')}
                    className={`w-full p-4 rounded-lg border transition-all ${
                      settings.language === 'zh'
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-medium text-[var(--color-text-primary)]">{t.settings.language.chinese}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">中文</div>
                      </div>
                      {settings.language === 'zh' && (
                        <span className="text-[var(--color-accent)]">✓</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
