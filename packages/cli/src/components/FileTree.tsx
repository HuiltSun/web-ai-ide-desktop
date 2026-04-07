import { FileNode } from '../services/api';
import { FolderIcon, FileIcon, ChevronRightIcon, ChevronDownIcon } from './Icons';

interface FileTreeProps {
  files: FileNode[];
  level?: number;
  onSelect: (path: string) => void;
  onContextMenu?: (e: React.MouseEvent, path: string) => void;
  selectedPath?: string;
}

const extColorMap: Record<string, string> = {
  ts: 'text-blue-400',
  tsx: 'text-blue-400',
  js: 'text-yellow-400',
  jsx: 'text-yellow-400',
  json: 'text-emerald-400',
  md: 'text-slate-400',
  css: 'text-pink-400',
  html: 'text-orange-400',
  py: 'text-emerald-400',
  rs: 'text-orange-400',
  go: 'text-cyan-400',
};

export function FileTree({ files, level = 0, onSelect, onContextMenu, selectedPath }: FileTreeProps) {
  return (
    <div className="text-sm">
      {files.map((file) => (
        <div key={file.path}>
          <div
            className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-lg transition-all duration-150 group ${
              selectedPath === file.path
                ? 'bg-indigo-500/15 text-indigo-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[var(--color-bg-elevated)]'
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => onSelect(file.path)}
            onContextMenu={(e) => onContextMenu?.(e, file.path)}
          >
            {file.isDirectory ? (
              <>
                <ChevronRightIcon size={12} className="text-slate-600" />
                <FolderIcon size={14} className={selectedPath === file.path ? 'text-indigo-400' : 'text-amber-400'} />
              </>
            ) : (
              <>
                <span className="w-3" />
                <FileIcon size={14} className={extColorMap[file.name.split('.').pop() || ''] || 'text-slate-500'} />
              </>
            )}
            <span className="truncate text-xs">{file.name}</span>
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
