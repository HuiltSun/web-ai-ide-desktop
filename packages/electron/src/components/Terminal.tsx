import { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTerminal } from '../hooks/useTerminal.js';

interface TerminalProps {
  sessionId: string;
  onExit?: (sessionId: string, exitCode: number) => void;
}

const iosDarkTheme = {
  background: '#1C1C1E',
  foreground: '#FFFFFF',
  cursor: '#64D2FF',
  cursorAccent: '#1C1C1E',
  selectionBackground: 'rgba(100, 210, 255, 0.3)',
  black: '#000000',
  red: '#FF453A',
  green: '#30D158',
  yellow: '#FF9F0A',
  blue: '#64D2FF',
  magenta: '#BF5AF2',
  cyan: '#5AC8FA',
  white: '#FFFFFF',
  brightBlack: '#636366',
  brightRed: '#FF6B6B',
  brightGreen: '#4AE04A',
  brightYellow: '#FFB84D',
  brightBlue: '#85E0FF',
  brightMagenta: '#D27AFF',
  brightCyan: '#7FDBFF',
  brightWhite: '#FFFFFF',
};

export function Terminal({ sessionId, onExit }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const { resizeTerminal, writeToTerminal, onOutput } = useTerminal();

  const handleResize = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current) {
      fitAddonRef.current.fit();
      const { cols, rows } = xtermRef.current;
      resizeTerminal(sessionId, cols, rows);
    }
  }, [sessionId, resizeTerminal]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new XTerm({
      theme: iosDarkTheme,
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    xterm.onData((data) => {
      writeToTerminal(sessionId, data);
    });

    onOutput(sessionId, (data) => {
      xterm.write(data);
    });

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(terminalRef.current);

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, [sessionId, writeToTerminal, onOutput, handleResize]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full terminal-xterm"
      style={{ background: '#1C1C1E' }}
    />
  );
}
