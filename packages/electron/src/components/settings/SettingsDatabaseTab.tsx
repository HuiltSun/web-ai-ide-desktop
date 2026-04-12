import { useSettings } from '../../contexts/SettingsContext';
import { DatabaseIcon } from '../Icons';

export function SettingsDatabaseTab() {
  const { t, isUserLoggedIn } = useSettings();

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
              <p className="text-sm text-amber-400/80">{t.settings.database.loginRequiredMessage}</p>
            </div>
          </div>
        </div>
      )}
      <div className={`p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] ${!isUserLoggedIn ? 'opacity-50 pointer-events-none' : ''}`}>
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
  );
}