import { useState, useCallback } from 'react';
import type { TerminalLine } from '../components/Terminal';

export function useTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      type: 'output',
      content: 'Web AI IDE Terminal\nType a command and press Enter to execute.\n',
      timestamp: new Date(),
    },
  ]);

  const executeCommand = useCallback((command: string) => {
    setLines((prev) => [
      ...prev,
      { type: 'command', content: command, timestamp: new Date() },
    ]);
  }, []);

  const addOutput = useCallback((content: string, type: 'output' | 'error' = 'output') => {
    setLines((prev) => [
      ...prev,
      { type, content, timestamp: new Date() },
    ]);
  }, []);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  return { lines, executeCommand, addOutput, clear };
}
