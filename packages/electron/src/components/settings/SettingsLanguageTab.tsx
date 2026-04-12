import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { GlobeIcon } from '../Icons';
import type { Language } from '../../i18n/translations';

export function SettingsLanguageTab() {
  const { settings, t, setLanguage } = useSettings();
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