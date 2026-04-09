import { useState } from 'react';
import { Terminal } from './Terminal.js';
import { useTerminal } from '../hooks/useTerminal.js';
import { TerminalIcon, PlusIcon, CloseIcon } from './Icons.js';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (shell: string) => void;
}

function NewSessionModal({ isOpen, onClose, onCreate }: NewSessionModalProps) {
  const [shell, setShell] = useState(
    typeof navigator !== 'undefined' && navigator.platform?.toLowerCase().includes('win')
      ? 'powershell.exe'
      : 'bash'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 w-96 border border-[var(--color-border)]">
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
          New Terminal
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
              Shell
            </label>
            <input
              type="text"
              value={shell}
              onChange={(e) => setShell(e.target.value)}
              placeholder="bash, powershell.exe, ..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onCreate(shell);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export function TerminalTabs() {
  const {
    sessions,
    activeSessionId,
    createSession,
    killSession,
    setActiveSession,
  } = useTerminal();

  const [showNewModal, setShowNewModal] = useState(false);

  const handleCreate = async (shell: string) => {
    try {
      await createSession({ shellType: 'local', shell });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleClose = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Close this terminal?')) {
      try {
        await killSession(sessionId);
      } catch (error) {
        console.error('Failed to kill session:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                activeSessionId === session.id
                  ? 'bg-[var(--color-bg-primary)] text-[var(--color-accent)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              <TerminalIcon size={14} />
              <span className="max-w-32 truncate">{session.name}</span>
              <span
                onClick={(e) => handleClose(e, session.id)}
                className="ml-1 p-0.5 rounded hover:bg-[var(--color-error-subtle)] hover:text-[var(--color-error)]"
              >
                <CloseIcon size={12} />
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <PlusIcon size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeSessionId ? (
          <Terminal sessionId={activeSessionId} />
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--color-text-muted)]">
            <div className="text-center">
              <TerminalIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p>No active terminal</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
              >
                Create Terminal
              </button>
            </div>
          </div>
        )}
      </div>

      <NewSessionModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
