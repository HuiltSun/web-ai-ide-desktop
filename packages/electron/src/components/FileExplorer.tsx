import { useState } from 'react';
import { FileNode } from '../services/api';
import { FileTree } from './FileTree';
import { useSettings } from '../contexts/SettingsContext';

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
  const { t } = useSettings();
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
    const name = prompt(t.fileExplorer.enterFileName);
    if (name) {
      onFileCreate(name);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {t.fileExplorer.files}
        </h3>
        <button
          onClick={handleCreateFile}
          className="p-1 hover:bg-gray-100 rounded"
          title={t.fileExplorer.newFile}
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
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
          <div className="text-sm text-gray-500 p-2">
            {t.fileExplorer.noFiles}
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
            className="fixed bg-white border border-gray-200 rounded shadow-lg py-1 z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                onFileDelete(contextMenu.path);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
            >
              {t.fileExplorer.delete}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
