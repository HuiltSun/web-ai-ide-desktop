import { useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const { t } = useSettings();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        ref={dialogRef}
        className="relative w-full max-w-md mx-4 animate-scale-in"
      >
        <div className="glass-panel border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent" />

          <div className="px-8 py-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[#8b5cf6] flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
              Web AI IDE
            </h2>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-[var(--color-text-secondary)]">{t.about.version} 1.0.0</span>
            </div>

            <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>
              {t.welcome.loggedOut}
            </p>

            <div className="w-full space-y-3 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">{t.about.electron}</span>
                <span className="text-[var(--color-text-secondary)] font-mono">30.5.1</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">{t.about.react}</span>
                <span className="text-[var(--color-text-secondary)] font-mono">18.x</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">{t.about.typescript}</span>
                <span className="text-[var(--color-text-secondary)] font-mono">5.x</span>
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent mb-6" />

            <p className="text-xs text-[var(--color-text-muted)] mb-6">
              {t.about.copyright}
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-6 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {t.about.close}
            </button>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
