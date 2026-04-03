import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { SparklesIcon, CodeIcon, BotIcon } from './components/Icons';
import type { Project } from './types';
import { api } from './services/api';

const DEFAULT_USER_ID = 'default-user';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.listProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (name: string) => {
    try {
      const projectPath = `./projects/${name.toLowerCase().replace(/\s+/g, '-')}`;
      const newProject = await api.createProject(name, projectPath, DEFAULT_USER_ID);
      setProjects((prev) => [newProject, ...prev]);
      setSelectedProjectId(newProject.id);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center animate-pulse shadow-2xl shadow-indigo-500/50">
            <BotIcon className="text-white" size={32} />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2 text-slate-400">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Layout
      header={<Header projectId={selectedProject?.name || null} />}
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
      {selectedProjectId ? (
        <Chat sessionId={selectedProjectId} />
      ) : (
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
      )}
    </Layout>
  );
}

export default App;