import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { CodeIcon, PaletteIcon, GlobeIcon, SunIcon, MoonIcon, MonitorIcon } from '../Icons';
import type { Language } from '../../i18n/translations';

export function SettingsGeneralTab() {
  const { settings, t, updateSettings, setUIStyle, setThemeMode, setLanguage } = useSettings();
  const [, setSaved] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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

      <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
        <div className="flex items-center gap-3 mb-4">
          <PaletteIcon size={20} className="text-[var(--color-accent)]" />
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t.settings.appearance.uiStyleTitle}</h3>
        </div>
        <p className="text-sm text-[var(--color-text-tertiary)] mb-4">{t.settings.appearance.uiStyleDescription}</p>

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
                <PaletteIcon size={18} className="text-white" />
              </div>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {t.settings.appearance.iosStyle}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {t.settings.appearance.iosStyleDesc}
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
                <PaletteIcon size={18} className="text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {t.settings.appearance.legacyStyle}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {t.settings.appearance.legacyStyleDesc}
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
              {t.settings.appearance.colorModeTitle}
            </h3>
          </div>
          <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
            {t.settings.appearance.colorModeDescription}
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
                  {t.settings.appearance.light}
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
                  {t.settings.appearance.dark}
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
                  {t.settings.appearance.system}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

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
  );
}