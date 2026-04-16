import { useEffect, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { usePTY } from '../../hooks/usePTY';
import { useSettings } from '../../contexts/SettingsContext';
import { TerminalRenderer } from './TerminalRenderer';

interface TerminalTab {
  id: string;
  name: string;
  terminal: Terminal;
  fitAddon: FitAddon;
  isConnected: boolean;
}

interface TerminalContentProps {
  tab: TerminalTab;
  isActive: boolean;
  isDark: boolean;
  isLoggedIn: boolean;
  onConnectionChange: (connected: boolean) => void;
}

const hasConnectedMap = new WeakMap<Terminal, boolean>();

export function TerminalContent({
  tab,
  isActive,
  isDark,
  isLoggedIn,
  onConnectionChange,
}: TerminalContentProps) {
  const { t } = useSettings();
  const { isConnected, isConnecting, error, connect, create, write, resize, onOutput } = usePTY({
    cols: 80,
    rows: 24,
  });

  const handleData = useCallback(
    (data: string) => {
      write(tab.id, data);
    },
    [write, tab.id]
  );

  useEffect(() => {
    onConnectionChange(isConnected);
  }, [isConnected, onConnectionChange]);

  useEffect(() => {
    if (!isLoggedIn) return;

    if (!hasConnectedMap.has(tab.terminal)) {
      hasConnectedMap.set(tab.terminal, true);
      // 创建 PTY 会话
      create(tab.id, 80, 24);
      connect();
    }
  }, [tab.id, tab.terminal, isLoggedIn, connect, create]);

  return (
    <div className="h-full terminal-xterm relative">
      <TerminalRenderer
        terminal={tab.terminal}
        fitAddon={tab.fitAddon}
        isActive={isActive}
        isDark={isDark}
        isLoggedIn={isLoggedIn}
        onData={handleData}
        onResize={resize}
        onOutput={(callback) => onOutput((_id, data) => callback(_id, data))}
      />

      {!isLoggedIn && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3 text-center max-w-sm px-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{t.terminal.loginRequired}</h4>
              <p className="text-xs text-[var(--color-text-tertiary)]">{t.terminal.loginRequiredHint}</p>
            </div>
          </div>
        </div>
      )}

      {isConnecting && isLoggedIn && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
            <div className="w-4 h-4 border-2 border-[var(--color-text-tertiary)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t.terminal.connecting}</span>
          </div>
        </div>
      )}

      {error && isLoggedIn && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <p className="text-[var(--color-error)] text-sm mb-2">{error}</p>
            <button
              onClick={connect}
              className="px-3 py-1.5 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] rounded text-sm text-[var(--color-text-secondary)] transition-colors"
            >
              {t.terminal.retry}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
