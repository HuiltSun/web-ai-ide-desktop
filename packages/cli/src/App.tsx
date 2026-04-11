import { useState } from 'react';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PTYTerminal } from './components/PTYTerminal';
import { SparklesIcon, CodeIcon, ZapIcon, LayersIcon } from './components/Icons';
import type { Project } from './types';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [terminalHeight, setTerminalHeight] = useState(320);

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
      terminal={terminalOpen ? <PTYTerminal onClose={() => setTerminalOpen(false)} /> : null}
      sidebarWidth={sidebarWidth}
      terminalHeight={terminalHeight}
      onSidebarWidthChange={setSidebarWidth}
      onTerminalHeightChange={setTerminalHeight}
    >
      <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl animate-float" />
          <div className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl animate-float stagger-2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl animate-pulse-glow" />
        </div>

        <div className="relative text-center max-w-xl z-10">
          <div className="relative inline-block mb-8 animate-fade-in">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-pulse-glow">
              <SparklesIcon className="text-white" size={44} />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg animate-float">
              <CodeIcon className="text-white" size={16} />
            </div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md animate-float stagger-3">
              <ZapIcon className="text-white" size={12} />
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight animate-slide-up stagger-1" style={{ fontFamily: 'var(--font-sans)' }}>
            Welcome to <span className="text-gradient">Web AI IDE</span>
          </h2>

          <p className="text-slate-400 text-base leading-relaxed mb-10 animate-slide-up stagger-2 max-w-md mx-auto">
            Your intelligent coding companion. Select a project from the sidebar or create a new one to start building something extraordinary.
          </p>

          <div className="flex items-center justify-center gap-8 animate-slide-up stagger-3">
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-400/50 transition-all duration-300" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider">Status</span>
                <p className="text-sm font-medium text-white">Connected</p>
              </div>
            </div>

            <div className="w-px h-10 bg-slate-800" />

            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-indigo-400 group-hover:shadow-lg group-hover:shadow-indigo-400/50 transition-all duration-300" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-indigo-400/80 uppercase tracking-wider">AI</span>
                <p className="text-sm font-medium text-white">Ready</p>
              </div>
            </div>

            <div className="w-px h-10 bg-slate-800" />

            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition-all duration-300">
                <LayersIcon className="text-purple-400" size={14} />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-purple-400/80 uppercase tracking-wider">Mode</span>
                <p className="text-sm font-medium text-white">Smart</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-3 animate-slide-up stagger-4">
            <div className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 text-xs font-medium">
              <span className="text-indigo-400">⌘</span> + <span className="text-indigo-400">K</span> Quick Actions
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 text-xs font-medium">
              <span className="text-purple-400">⌥</span> + <span className="text-purple-400">Enter</span> AI Complete
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
