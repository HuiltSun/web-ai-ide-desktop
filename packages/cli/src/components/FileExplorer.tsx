import { useState } from 'react';
import { FileNode } from '../services/api';
import { FileTree } from './FileTree';
import { PlusIcon, FolderIcon } from './Icons';

interface FileExplorerProps {
  files: FileNode[];
  selectedPath?: string;
  onFileSelect: (path: string) => void;
  onFileCreate: (path: string) => void;
  onFileDelete: (path: string) => void;
}

export function FileExplorer({
  files,
  selectedPath,
  onFileSelect,
  onFileCreate,
  onFileDelete,
}: FileExplorerProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: string;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path });
  };

  const handleCreateFile = () => {
    const name = prompt('Enter file name:');
    if (name) {
      onFileCreate(name);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-secondary)]">
      <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderIcon size={14} className="text-indigo-400" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Files
          </h3>
        </div>
        <button
          onClick={handleCreateFile}
          className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
          title="New File"
        >
          <PlusIcon size={14} className="text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {files.length > 0 ? (
          <FileTree
            files={files}
            onSelect={onFileSelect}
            onContextMenu={handleContextMenu}
            selectedPath={selectedPath}
          />
        ) : (
          <div className="text-xs text-slate-500 p-4 text-center">
            No files yet. Create one to get started.
          </div>
        )}
      </div>
      {contextMenu && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl shadow-xl py-1 z-50 backdrop-blur-xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                onFileDelete(contextMenu.path);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/10 text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
