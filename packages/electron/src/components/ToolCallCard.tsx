import { TerminalIcon, CheckIcon, CloseIcon } from './Icons';
import type { ToolCall } from '../types';

interface ToolCallCardProps {
  toolCall: ToolCall;
  onApprove: () => void;
  onReject: () => void;
}

export function ToolCallCard({ toolCall, onApprove, onReject }: ToolCallCardProps) {
  return (
    <div className="animate-in slide-in-from-bottom-2 duration-200">
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <TerminalIcon className="text-white" size={14} />
          </div>
          <div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
              Tool Request
            </span>
            <span className="ml-2 font-mono text-sm text-slate-300">{toolCall.name}</span>
          </div>
        </div>
        <div className="bg-black/30 rounded-xl p-3 mb-4 overflow-x-auto border border-white/5">
          <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
            {JSON.stringify(toolCall.arguments, null, 2)}
          </pre>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25"
          >
            <CheckIcon size={14} />
            Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-medium rounded-xl hover:from-red-600 hover:to-rose-600 transition-all shadow-lg shadow-red-500/25"
          >
            <CloseIcon size={14} />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}