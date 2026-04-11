import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { usePTY } from '../hooks/usePTY';
import { TerminalIcon } from './Icons';
import '@xterm/xterm/css/xterm.css';

interface PTYTerminalProps {
  onClose?: () => void;
}

export function PTYTerminal({ onClose }: PTYTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const dimensionsRef = useRef({ cols: 80, rows: 24 });

  const { isConnected, isConnecting, error, connect, write, resize, onOutput } = usePTY({
    cols: dimensionsRef.current.cols,
    rows: dimensionsRef.current.rows,
  });

  const handleData = useCallback(
    (data: string) => {
      write(data);
    },
    [write]
  );

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#264f78',
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
      },
      scrollback: 10000,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const handleResize = () => {
      if (fitAddonRef.current && isConnected) {
        fitAddonRef.current.fit();
        resize(terminal.cols, terminal.rows);
      }
    };

    window.addEventListener('resize', handleResize);

    const unsubscribe = onOutput((data) => {
      terminal.write(data);
    });

    terminal.onData(handleData);

    connect();

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
      terminal.dispose();
      terminalInstanceRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isConnected && fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
        resize(terminalInstanceRef.current?.cols || 80, terminalInstanceRef.current?.rows || 24);
      }, 100);
    }
  }, [isConnected, resize]);

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)] border-t border-[var(--color-border)]">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} className="text-emerald-500" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            OpenClaude CLI
          </span>
          {isConnecting && (
            <span className="text-xs text-yellow-500">Connecting...</span>
          )}
          {isConnected && (
            <span className="flex items-center gap-1 text-xs text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          )}
          {error && (
            <span className="text-xs text-red-500">Error: {error}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Close terminal"
        >
          ×
        </button>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 p-2 overflow-hidden"
        style={{ background: '#1e1e1e' }}
      />
    </div>
  );
}