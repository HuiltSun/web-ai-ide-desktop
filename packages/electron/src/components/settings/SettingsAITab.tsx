import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { PlusIcon, TrashIcon, ChevronDownIcon } from '../Icons';
import { providerPresets, createProviderFromPreset } from '../../config/providerPresets';

export function SettingsAITab() {
  const { settings, t, isUserLoggedIn, setSelectedProvider, setSelectedModel, addProvider, removeProvider, updateProvider, addModel, removeModel } = useSettings();
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

  const handleSave = () => {
    // Settings auto-save via context
  };

  const selectedProvider = settings.aiProviders.find(p => p.id === settings.selectedProvider);

  return (
    <div className="space-y-6">
      {!isUserLoggedIn && (
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
      {isUserLoggedIn && (
        <>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">{t.settings.ai.providers}</h3>
          <div className="relative">
            <button
              onClick={() => setShowPresetDropdown(!showPresetDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-accent)] bg-[var(--color-accent-subtle)] rounded-lg hover:bg-[var(--color-accent)]/20 transition-colors"
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
        </>
      )}

      {isUserLoggedIn && selectedProvider && (
        <div className="space-y-4 p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                {t.settings.ai.providerName}
              </label>
              <input
                type="text"
                value={selectedProvider.name}
                onChange={e => updateProvider(selectedProvider.id, { name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
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
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
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
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">{t.settings.ai.models}</h4>
              <button
                onClick={() => addModel(selectedProvider.id)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent-subtle)] rounded-md hover:bg-[var(--color-accent)]/20 transition-colors"
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
                      className={`flex-1 p-2 text-left rounded-md border transition-all ${
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
                        className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
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

      {isUserLoggedIn && (
        <button
          onClick={handleSave}
          className="w-full py-2.5 rounded-lg font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          {t.settings.actions.save}
        </button>
      )}
    </div>
  );
}