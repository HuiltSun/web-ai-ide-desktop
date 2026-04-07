import type { Project, ProjectWithSession } from '../types';

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let authToken: string | null = null;

function handleApiError(response: Response, defaultMessage: string): never {
  if (response.status === 401) {
    throw new Error('认证失败，请重新登录');
  } else if (response.status === 403) {
    throw new Error('没有权限访问此资源');
  } else if (response.status === 404) {
    throw new Error('请求的资源不存在');
  } else if (response.status >= 500) {
    throw new Error('服务器错误，请稍后重试');
  }
  throw new Error(`${defaultMessage}: ${response.status} ${response.statusText}`);
}

export interface AuthHeaders extends Record<string, string> {}

export const api = {
  setAuthToken(token: string | null) {
    authToken = token;
  },

  getAuthHeaders(): AuthHeaders {
    if (!authToken) return {};
    return { Authorization: `Bearer ${authToken}` };
  },

  async getProjectFiles(projectId: string): Promise<FileNode[]> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) handleApiError(response, 'Failed to fetch files');
    return response.json();
  },

  async readFile(projectId: string, path: string): Promise<string> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${path}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) handleApiError(response, 'Failed to read file');
    return response.text();
  },

  async writeFile(projectId: string, path: string, content: string): Promise<void> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain', ...this.getAuthHeaders() },
      body: content,
    });
    if (!response.ok) handleApiError(response, 'Failed to write file');
  },

  async deleteFile(projectId: string, path: string): Promise<void> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${path}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) handleApiError(response, 'Failed to delete file');
  },

  async createProject(name: string, path: string, userId: string): Promise<ProjectWithSession> {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify({ name, path, userId }),
    });
    if (!response.ok) handleApiError(response, 'Failed to create project');
    return response.json();
  },

  async listProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE}/projects`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) handleApiError(response, 'Failed to fetch projects');
    return response.json();
  },

  async getProjectWithSession(projectId: string): Promise<ProjectWithSession> {
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) handleApiError(response, 'Failed to fetch project');
    return response.json();
  },

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) handleApiError(response, 'Failed to delete project');
  },
};