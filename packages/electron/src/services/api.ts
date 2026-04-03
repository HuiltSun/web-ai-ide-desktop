export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

const API_BASE = '/api';

export const api = {
  async getProjectFiles(projectId: string): Promise<FileNode[]> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files`);
    if (!response.ok) throw new Error('Failed to fetch files');
    return response.json();
  },

  async readFile(projectId: string, path: string): Promise<string> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${path}`);
    if (!response.ok) throw new Error('Failed to read file');
    return response.text();
  },

  async writeFile(projectId: string, path: string, content: string): Promise<void> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: content,
    });
    if (!response.ok) throw new Error('Failed to write file');
  },

  async deleteFile(projectId: string, path: string): Promise<void> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${path}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete file');
  },

  async createProject(name: string, path: string, userId: string) {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, path, userId }),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  },

  async listProjects() {
    const response = await fetch(`${API_BASE}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },
};
