import { ToolCall } from '../types';

interface ToolCallCardProps {
  toolCall: ToolCall;
  onApprove: () => void;
  onReject: () => void;
}

export function ToolCallCard({ toolCall, onApprove, onReject }: ToolCallCardProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded">
          Tool Call
        </span>
        <span className="font-mono text-sm">{toolCall.name}</span>
      </div>
      <div className="bg-white rounded p-2 mb-3 font-mono text-sm overflow-x-auto">
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(toolCall.arguments, null, 2)}
        </pre>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          Approve
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
