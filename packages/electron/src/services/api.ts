import type { Project, ProjectWithSession } from '../types';

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let authToken: string | null = null;

export const api = {
  setAuthToken(token: string | null) {
    authToken = token;
  },

  getAuthHeaders(): HeadersInit {
    if (!authToken) return {};
    return { Authorization: `Bearer ${authToken}` };
  },

  async getProjectFiles(projectId: string): Promise<FileNode[]> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch files');
    return response.json();
  },

  async readFile(projectId: string, path: string): Promise<string> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${path}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to read file');
    return response.text();
  },

  async writeFile(projectId: string, path: string, content: string): Promise<void> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain', ...this.getAuthHeaders() },
      body: content,
    });
    if (!response.ok) throw new Error('Failed to write file');
  },

  async deleteFile(projectId: string, path: string): Promise<void> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${path}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete file');
  },

  async createProject(name: string, path: string, userId: string): Promise<ProjectWithSession> {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify({ name, path, userId }),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  },

  async listProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE}/projects`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  async getProjectWithSession(projectId: string): Promise<ProjectWithSession> {
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch project');
    return response.json();
  },

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete project');
  },
};