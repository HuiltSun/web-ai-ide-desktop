import { useChat } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ToolCallCard } from './ToolCallCard';

interface ChatProps {
  sessionId: string | null;
}

export function Chat({ sessionId }: ChatProps) {
  const {
    messages,
    streamingContent,
    pendingToolCall,
    isConnected,
    sendMessage,
    approveTool,
    rejectTool,
  } = useChat(sessionId);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingContent && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">Welcome to AI Chat</p>
            <p className="text-sm">Ask me anything about your code!</p>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}

        {streamingContent && (
          <ChatMessage message={{ role: 'assistant', content: streamingContent + '...' }} />
        )}

        {pendingToolCall && (
          <ToolCallCard
            toolCall={pendingToolCall}
            onApprove={() => approveTool(pendingToolCall.id)}
            onReject={() => rejectTool(pendingToolCall.id)}
          />
        )}
      </div>

      <ChatInput onSend={sendMessage} disabled={!isConnected} />

      {!isConnected && (
        <div className="text-center text-xs text-gray-400 py-1 bg-gray-50">
          Disconnected. Reconnecting...
        </div>
      )}
    </div>
  );
}
