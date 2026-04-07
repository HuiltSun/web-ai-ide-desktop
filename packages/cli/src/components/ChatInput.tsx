import { useState } from 'react';
import { SendIcon, SparklesIcon } from './Icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-[var(--color-border)] p-4 bg-[var(--color-bg-tertiary)]">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
          isFocused
            ? 'bg-[var(--color-bg-elevated)] border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
            : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
        }`}
      >
        <SparklesIcon className={`transition-colors duration-300 ${isFocused ? 'text-indigo-400' : 'text-slate-500'}`} size={18} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none disabled:text-slate-500"
          style={{ fontFamily: 'var(--font-sans)' }}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className={`p-2 rounded-xl transition-all duration-300 ${
            input.trim() && !disabled
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700'
              : 'bg-[var(--color-bg-elevated)] text-slate-500'
          } disabled:cursor-not-allowed`}
        >
          <SendIcon size={16} />
        </button>
      </div>
    </form>
  );
}
