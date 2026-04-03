import { useState } from 'react';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SparklesIcon, CodeIcon } from './components/Icons';
import type { Project } from './types';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleCreateProject = (name: string) => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
  };

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  return (
    <Layout
      header={<Header projectId={selectedProject?.name || null} onRefreshClick={() => setProjects([...projects])} />}
      sidebar={
        <Sidebar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
        />
      }
    >
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <SparklesIcon className="text-white" size={36} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
              <CodeIcon className="text-white" size={12} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Welcome to Web AI IDE
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your intelligent coding companion. Select a project from the sidebar or create a new one to start building.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium">Connected</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-medium">AI Ready</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;