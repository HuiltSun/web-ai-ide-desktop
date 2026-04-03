import { useCallback } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import { EditorTabs } from './EditorTabs';

export interface EditorFile {
  path: string;
  content: string;
  language: string;
}

export interface EditorProps {
  files: EditorFile[];
  activeFile: string;
  onFileSelect: (path: string) => void;
  onFileChange: (path: string, content: string) => void;
}

export function Editor({ files, activeFile, onFileSelect, onFileChange }: EditorProps) {
  const handleMount: OnMount = useCallback((_editor) => {
    // Editor mounted, can be used for future extensions
  }, []);

  const activeContent = files.find((f) => f.path === activeFile)?.content || '';
  const activeLanguage = files.find((f) => f.path === activeFile)?.language || 'plaintext';

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-l border-gray-200">
      {files.length > 0 && (
        <EditorTabs
          files={files}
          activeFile={activeFile}
          onSelect={onFileSelect}
        />
      )}
      <div className="flex-1">
        {activeFile ? (
          <MonacoEditor
            height="100%"
            language={activeLanguage}
            value={activeContent}
            onChange={(value) => onFileChange(activeFile, value || '')}
            onMount={handleMount}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
            theme="vs-dark"
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">Open a file to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
}
