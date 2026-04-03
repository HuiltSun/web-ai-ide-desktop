import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { Settings } from './components/Settings';
import { LoginModal } from './components/LoginModal';
import { SparklesIcon, CodeIcon, BotIcon } from './components/Icons';
import type { Project, ProjectWithSession } from './types';
import { api } from './services/api';

const DEFAULT_USER_ID = 'default-user';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
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

  const handleLogin = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setSelectedProjectId(null);
    setSelectedSessionId(null);
    await loadProjects();
  };

  const handleRegister = async (email: string, password: string, name?: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Registration failed');
    }

    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      throw new Error('Registration successful but login failed');
    }

    const data = await loginResponse.json();
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setSelectedProjectId(null);
    setSelectedSessionId(null);
    await loadProjects();
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setSelectedProjectId(null);
    setSelectedSessionId(null);
    setProjects([]);
    setLoginOpen(false);
  };

  const handleCreateProject = async (name: string) => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    const userId = user.id;
    try {
      const projectPath = `./projects/${name.toLowerCase().replace(/\s+/g, '-')}`;
      const newProjectWithSession: ProjectWithSession = await api.createProject(name, projectPath, userId);
      setProjects((prev) => [newProjectWithSession.project, ...prev]);
      setSelectedProjectId(newProjectWithSession.project.id);
      setSelectedSessionId(newProjectWithSession.session.id);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleSelectProject = async (projectId: string | null) => {
    setSelectedProjectId(projectId);
    if (projectId) {
      try {
        const projectWithSession = await api.getProjectWithSession(projectId);
        setSelectedSessionId(projectWithSession.session.id);
      } catch (error) {
        console.error('Failed to load project session:', error);
        setSelectedSessionId(null);
      }
    } else {
      setSelectedSessionId(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        setSelectedSessionId(null);
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
    <>
      <Layout
        header={
          <Header
            projectId={selectedProject?.name || null}
            onSettingsClick={() => setSettingsOpen(true)}
            onRefreshClick={loadProjects}
            onLoginClick={() => setLoginOpen(true)}
            userEmail={user?.email || null}
            onLogout={handleLogout}
          />
        }
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
        {selectedSessionId ? (
          <Chat sessionId={selectedSessionId} />
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
                {user
                  ? `Welcome back, ${user.email}. Select a project or create a new one.`
                  : 'Your intelligent coding companion. Sign in to sync your projects across devices.'}
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
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </>
  );
}

export default App;