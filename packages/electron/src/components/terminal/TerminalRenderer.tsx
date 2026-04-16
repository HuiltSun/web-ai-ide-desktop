import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalRendererProps {
  terminal: Terminal;
  fitAddon: FitAddon;
  isActive: boolean;
  isDark: boolean;
  isLoggedIn: boolean;
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
  onOutput: (callback: (id: string, data: string) => void) => () => void;
}

export function TerminalRenderer({
  terminal,
  fitAddon,
  isActive,
  isDark,
  isLoggedIn,
  onData,
  onResize,
  onOutput,
}: TerminalRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || !isLoggedIn || initializedRef.current) return;

    initializedRef.current = true;
    terminal.open(containerRef.current);
    terminal.loadAddon(new WebLinksAddon());
    terminal.loadAddon(fitAddon);

    const dataDisposable = terminal.onData(onData);
    const resizeDisposable = terminal.onResize(({ cols, rows }) => {
      onResize(cols, rows);
    });
    const unsubscribe = onOutput((_id, data) => {
      terminal.write(data);
    });

    setTimeout(() => {
      fitAddon.fit();
    }, 50);

    return () => {
      dataDisposable.dispose();
      resizeDisposable.dispose();
      unsubscribe();
    };
  }, [terminal, fitAddon, isLoggedIn, onData, onResize, onOutput]);

  useEffect(() => {
    if (isActive && fitAddon) {
      setTimeout(() => {
        fitAddon.fit();
      }, 0);
    }
  }, [isActive, fitAddon]);

  useEffect(() => {
    const handleResize = () => {
      if (isActive && fitAddon) {
        fitAddon.fit();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, fitAddon]);

  return (
    <div
      ref={containerRef}
      className="h-full"
      style={{ background: isDark ? 'var(--color-bg-primary)' : '#ffffff' }}
    />
  );
}
