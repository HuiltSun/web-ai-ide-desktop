import { useState } from 'react';
import type { Project } from '../types';
import { FolderIcon, PlusIcon, TrashIcon, SparklesIcon } from './Icons';

interface SidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

export function Sidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState('');

  const handleCreate = () => {
    if (projectName.trim()) {
      onCreateProject(projectName.trim());
      setProjectName('');
      setIsCreating(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (onDeleteProject && confirm('Delete this project?')) {
      onDeleteProject(projectId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 text-slate-400">
          <SparklesIcon size={14} className="text-indigo-400" />
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Projects
          </h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center">
              <FolderIcon className="text-slate-500" size={24} />
            </div>
            <p className="text-xs text-slate-500">No projects yet</p>
            <p className="text-[10px] text-slate-600 mt-1">Create one to get started</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.id} className="group relative">
                <button
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    selectedProjectId === project.id
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FolderIcon size={16} className={selectedProjectId === project.id ? 'text-indigo-400' : ''} />
                  <span className="truncate font-medium">{project.name}</span>
                </button>
                {onDeleteProject && (
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    title="Delete project"
                  >
                    <TrashIcon size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-3 border-t border-white/5">
        {isCreating ? (
          <div className="space-y-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-3 py-2 bg-white/5 text-slate-400 text-sm font-medium rounded-xl hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
          >
            <PlusIcon size={16} />
            New Project
          </button>
        )}
      </div>
    </div>
  );
}