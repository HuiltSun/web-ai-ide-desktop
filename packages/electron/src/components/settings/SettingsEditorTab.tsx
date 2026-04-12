import { useSettings } from '../../contexts/SettingsContext';
import { CodeIcon } from '../Icons';

export function SettingsEditorTab() {
  const { settings, t, updateSettings } = useSettings();

  return (
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
  );
}