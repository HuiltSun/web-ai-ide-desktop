import { useState } from 'react';

interface SidebarProps {
  selectedProject: string | null;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: () => void;
}

export function Sidebar({ onCreateProject }: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState('');

  const handleCreate = () => {
    if (projectName.trim()) {
      onCreateProject();
      setProjectName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Projects
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-sm text-gray-500 p-2">
          No projects yet. Create one to get started.
        </div>
      </div>
      <div className="p-3 border-t border-gray-200">
        {isCreating ? (
          <div className="space-y-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            + New Project
          </button>
        )}
      </div>
    </div>
  );
}
