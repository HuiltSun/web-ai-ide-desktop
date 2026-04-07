import { ToolCall } from '../types';
import { CheckIcon, CloseIcon, TerminalIcon } from './Icons';

interface ToolCallCardProps {
  toolCall: ToolCall;
  onApprove: () => void;
  onReject: () => void;
}

export function ToolCallCard({ toolCall, onApprove, onReject }: ToolCallCardProps) {
  return (
    <div className="bg-[var(--color-bg-tertiary)] border border-amber-500/20 rounded-2xl p-4 animate-slide-up">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <TerminalIcon className="text-amber-400" size={14} />
        </div>
        <div className="flex-1">
          <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">Tool Call Request</span>
          <p className="text-sm font-mono text-white">{toolCall.name}</p>
        </div>
      </div>

      <div className="bg-[var(--color-bg-secondary)] rounded-xl p-3 mb-4 overflow-x-auto border border-[var(--color-border)]">
        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap" style={{ fontFamily: 'var(--font-mono)' }}>
          {JSON.stringify(toolCall.arguments, null, 2)}
        </pre>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-200 text-sm font-medium"
        >
          <CheckIcon size={14} />
          Approve
        </button>
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 text-sm font-medium"
        >
          <CloseIcon size={14} />
          Reject
        </button>
      </div>
    </div>
  );
}
