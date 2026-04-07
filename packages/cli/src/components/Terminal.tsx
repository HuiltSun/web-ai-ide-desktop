import { useState, useEffect, useRef, useCallback } from 'react';
import { TerminalIcon } from './Icons';

export interface TerminalLine {
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

interface TerminalProps {
  onCommand: (command: string) => void;
  lines: TerminalLine[];
}

export function Terminal({ onCommand, lines }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim()) {
        onCommand(input.trim());
        setInput('');
      }
    },
    [input, onCommand]
  );

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)] border-t border-[var(--color-border)]">
      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
        <TerminalIcon size={14} className="text-slate-500" />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Terminal</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm" ref={scrollRef}>
        {lines.map((line, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap leading-relaxed ${
              line.type === 'error' ? 'text-red-400' : line.type === 'command' ? 'text-indigo-400' : 'text-slate-300'
            }`}
          >
            {line.type === 'command' && <span className="text-emerald-400 mr-2">$</span>}
            {line.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-[var(--color-border)] p-3 flex items-center bg-[var(--color-bg-secondary)]">
        <span className="text-emerald-400 mr-2 font-mono text-sm">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent outline-none text-slate-200 font-mono text-sm placeholder-slate-600"
          placeholder="Enter command..."
          autoFocus
        />
      </form>
    </div>
  );
}
