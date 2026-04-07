import { EditorFile } from './Editor';
import { FileIcon, CloseIcon } from './Icons';

interface EditorTabsProps {
  files: EditorFile[];
  activeFile: string;
  onSelect: (path: string) => void;
}

export function EditorTabs({ files, activeFile, onSelect }: EditorTabsProps) {
  return (
    <div className="flex bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] overflow-x-auto">
      {files.map((file) => (
        <button
          key={file.path}
          onClick={() => onSelect(file.path)}
          className={`px-4 py-2.5 text-sm whitespace-nowrap flex items-center gap-2 border-r border-[var(--color-border)] transition-all duration-200 ${
            file.path === activeFile
              ? 'bg-[var(--color-bg-secondary)] text-white border-b-2 border-b-indigo-500'
              : 'text-slate-500 hover:text-slate-300 hover:bg-[var(--color-bg-elevated)]'
          }`}
        >
          <FileIcon size={14} className={file.path === activeFile ? 'text-indigo-400' : 'text-slate-600'} />
          <span>{file.path.split('/').pop() || file.path}</span>
          <CloseIcon size={12} className="ml-1 opacity-0 group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}
