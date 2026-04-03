import { EditorFile } from './Editor';

interface EditorTabsProps {
  files: EditorFile[];
  activeFile: string;
  onSelect: (path: string) => void;
}

export function EditorTabs({ files, activeFile, onSelect }: EditorTabsProps) {
  return (
    <div className="flex bg-gray-100 border-b border-gray-200 overflow-x-auto">
      {files.map((file) => (
        <button
          key={file.path}
          onClick={() => onSelect(file.path)}
          className={`px-4 py-2 text-sm border-r border-gray-200 whitespace-nowrap flex items-center gap-2 ${
            file.path === activeFile
              ? 'bg-white text-blue-600 border-b-2 border-b-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>{file.path.split('/').pop() || file.path}</span>
        </button>
      ))}
    </div>
  );
}
