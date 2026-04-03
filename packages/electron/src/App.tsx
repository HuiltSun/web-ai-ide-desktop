import { useState } from 'react';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

function App() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const handleCreateProject = () => {
    const newProjectId = `project-${Date.now()}`;
    setSelectedProject(newProjectId);
  };

  return (
    <Layout
      header={<Header projectId={selectedProject} />}
      sidebar={
        <Sidebar
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
          onCreateProject={handleCreateProject}
        />
      }
    >
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <h2 className="text-xl font-semibold mb-2">Welcome to Web AI IDE</h2>
          <p>Select a project from the sidebar to start coding</p>
        </div>
      </div>
    </Layout>
  );
}

export default App;
