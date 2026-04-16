import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { FitAddon } from '@xterm/addon-fit';
import { usePTY } from '../hooks/usePTY';
import { useSettings } from '../contexts/SettingsContext';
import { TerminalIcon, PlusIcon, CloseIcon, MaximizeIcon, MinimizeIcon } from './Icons';
import '@xterm/xterm/css/xterm.css';

interface TerminalPanelProps {
  onClose?: () => void;
  onToggleMaximize?: () => void;
  isMaximized?: boolean;
}

interface TerminalTab {
  id: string;
  name: string;
  terminal: Terminal;
  fitAddon: FitAddon;
  isConnected: boolean;
}

let tabCounter = 0;

function getTerminalTheme(isDark: boolean, uiStyle: 'ios' | 'legacy') {
  if (isDark) {
    const bg = uiStyle === 'ios' ? '#1C1C1E' : '#0a0a0d';
    return {
      background: bg,
      foreground: '#d4d4d4',
      cursor: '#ffffff',
      cursorAccent: 'transparent',
      selectionBackground: '#264f78',
      selectionForeground: '#ffffff',
      black: '#1e1e1e',
      red: '#f44747',
      green: '#6a9955',
      yellow: '#dcdcaa',
      blue: '#569cd6',
      magenta: '#c586c0',
      cyan: '#4ec9b0',
      white: '#d4d4d4',
      brightBlack: '#808080',
      brightRed: '#f44747',
      brightGreen: '#6a9955',
      brightYellow: '#dcdcaa',
      brightBlue: '#569cd6',
      brightMagenta: '#c586c0',
      brightCyan: '#4ec9b0',
      brightWhite: '#ffffff',
    };
  }
  return {
    background: '#ffffff',
    foreground: '#1e1e1e',
    cursor: '#000000',
    cursorAccent: '#ffffff',
    selectionBackground: '#add6ff',
    selectionForeground: '#000000',
    black: '#000000',
    red: '#cd3131',
    green: '#00bc00',
    yellow: '#949800',
    blue: '#0451a5',
    magenta: '#bc05bc',
    cyan: '#0598bc',
    white: '#555555',
    brightBlack: '#666666',
    brightRed: '#cd3131',
    brightGreen: '#14ce14',
    brightYellow: '#b5ba00',
    brightBlue: '#0451a5',
    brightMagenta: '#bc05bc',
    brightCyan: '#0598bc',
    brightWhite: '#a5a5a5',
  };
}

export function TerminalPanel({ onClose, onToggleMaximize, isMaximized }: TerminalPanelProps) {
  const { t, settings, isUserLoggedIn } = useSettings();
  const isDark = settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const addTab = useCallback(() => {
    const id = `tab-${++tabCounter}`;
    const name = `${t.terminal.terminal} ${tabs.length + 1}`;

    const terminal = new Terminal({
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      cols: 80,
      rows: 24,
      theme: getTerminalTheme(isDark, settings.uiStyle),
      scrollback: 10000,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    const tab: TerminalTab = {
      id,
      name,
      terminal,
      fitAddon,
      isConnected: false,
    };

    setTabs(prev => [...prev, tab]);
    setActiveTabId(id);
  }, [tabs.length, t.terminal.terminal, isDark, settings.uiStyle]);

  const removeTab = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id);
      const next = prev.filter(t => t.id !== id);

      if (id === activeTabId && next.length > 0) {
        setActiveTabId(next[Math.min(idx, next.length - 1)].id);
      } else if (next.length === 0) {
        setActiveTabId(null);
      }

      const found = prev.find(t => t.id === id);
      found?.terminal.dispose();

      return next;
    });
  }, [activeTabId]);

  useEffect(() => {
    if (tabs.length === 0) {
      addTab();
    }
  }, [tabs.length, addTab]);

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      <div className="flex items-center justify-between h-9 px-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-2 px-3 h-7 rounded-md cursor-pointer transition-colors ${
                tab.id === activeTabId
                  ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              <TerminalIcon size={12} className={tab.isConnected ? 'text-emerald-500' : ''} />
              <span className="text-xs font-medium whitespace-nowrap">{tab.name}</span>
              {tab.isConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
              <button
                onClick={(e) => removeTab(tab.id, e)}
                className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded hover:bg-[var(--color-bg-hover)] transition-opacity text-[var(--color-text-muted)]"
              >
                <CloseIcon size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={addTab}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            title={t.terminal.newTerminal}
          >
            <PlusIcon size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            title={isCollapsed ? t.terminal.expand : t.terminal.collapse}
          >
            <MinimizeIcon size={14} />
          </button>
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              title={isMaximized ? t.terminal.restore : t.terminal.maximize}
            >
              <MaximizeIcon size={14} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              title={t.terminal.closeTerminal}
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-hidden">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`h-full ${tab.id === activeTabId ? 'block' : 'hidden'}`}
            >
              <TerminalContent
                tab={tab}
                isActive={tab.id === activeTabId}
                isDark={isDark}
                isLoggedIn={isUserLoggedIn}
                onConnectionChange={(connected) => {
                  setTabs(prev => prev.map(t =>
                    t.id === tab.id ? { ...t, isConnected: connected } : t
                  ));
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TerminalContentProps {
  tab: TerminalTab;
  isActive: boolean;
  isDark: boolean;
  isLoggedIn: boolean;
  onConnectionChange: (connected: boolean) => void;
}

function TerminalContent({ tab, isActive, isDark, isLoggedIn, onConnectionChange }: TerminalContentProps) {
  const { t } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(false);
  const { isConnected, isConnecting, error, connect, write, resize, onOutput } = usePTY({
    cols: 80,
    rows: 24,
  });

  const handleData = useCallback(
    (data: string) => {
      write(data);
    },
    [write]
  );

  useEffect(() => {
    onConnectionChange(isConnected);
  }, [isConnected, onConnectionChange]);

  useEffect(() => {
    if (!containerRef.current || isMountedRef.current || !isLoggedIn) return;

    const { terminal, fitAddon } = tab;

    terminal.open(containerRef.current);

    const dataDisposable = terminal.onData(handleData);

    const resizeDisposable = terminal.onResize(({ cols, rows }) => {
      resize(cols, rows);
    });

    const unsubscribe = onOutput((data) => {
      terminal.write(data);
    });

    connect();

    isMountedRef.current = true;

    setTimeout(() => {
      fitAddon.fit();
    }, 50);

    return () => {
      dataDisposable.dispose();
      resizeDisposable.dispose();
      unsubscribe();
      isMountedRef.current = false;
    };
  }, [tab, handleData, onOutput, connect, resize, isLoggedIn]);

  useEffect(() => {
    if (isActive && tab.fitAddon) {
      setTimeout(() => {
        tab.fitAddon.fit();
      }, 0);
    }
  }, [isActive, tab.fitAddon]);

  useEffect(() => {
    const handleResize = () => {
      if (isActive && tab.fitAddon) {
        tab.fitAddon.fit();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, tab.fitAddon]);

  return (
    <div className="h-full terminal-xterm relative" style={{ background: isDark ? 'var(--color-bg-primary)' : '#ffffff' }}>
      <div ref={containerRef} className="h-full" />
      {!isLoggedIn && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: isDark ? 'rgba(10,10,13,0.85)' : 'rgba(255,255,255,0.85)' }}>
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
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: isDark ? 'rgba(10,10,13,0.8)' : 'rgba(255,255,255,0.8)' }}>
          <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
            <div className="w-4 h-4 border-2 border-[var(--color-text-tertiary)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t.terminal.connecting}</span>
          </div>
        </div>
      )}
      {error && isLoggedIn && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: isDark ? 'rgba(10,10,13,0.8)' : 'rgba(255,255,255,0.8)' }}>
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
