import { useSettings } from '../../contexts/SettingsContext';
import { SparklesIcon, SunIcon, MoonIcon, MonitorIcon, PaletteIcon } from '../Icons';

export function SettingsAppearanceTab() {
  const { settings, t, setUIStyle, setThemeMode } = useSettings();

  return (
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
  );
}