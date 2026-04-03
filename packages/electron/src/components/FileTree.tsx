import { FileNode } from '../services/api';

interface FileTreeProps {
  files: FileNode[];
  level?: number;
  onSelect: (path: string) => void;
  onContextMenu?: (e: React.MouseEvent, path: string) => void;
  selectedPath?: string;
}

export function FileTree({ files, level = 0, onSelect, onContextMenu, selectedPath }: FileTreeProps) {
  return (
    <div className="text-sm">
      {files.map((file) => (
        <div key={file.path}>
          <div
            className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded hover:bg-gray-100 ${
              selectedPath === file.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => onSelect(file.path)}
            onContextMenu={(e) => onContextMenu?.(e, file.path)}
          >
            {file.isDirectory ? (
              <FolderIcon />
            ) : (
              <FileIcon name={file.name} />
            )}
            <span className="truncate">{file.name}</span>
          </div>
          {file.isDirectory && file.children && (
            <FileTree
              files={file.children}
              level={level + 1}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              selectedPath={selectedPath}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FolderIcon() {
  return (
    <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h10a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  const colorMap: Record<string, string> = {
    ts: 'text-blue-500',
    tsx: 'text-blue-500',
    js: 'text-yellow-500',
    jsx: 'text-yellow-500',
    json: 'text-gray-500',
    md: 'text-gray-500',
    css: 'text-pink-500',
    html: 'text-orange-500',
  };

  return (
    <svg className={`w-4 h-4 ${colorMap[ext || ''] || 'text-gray-400'} flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  );
}
