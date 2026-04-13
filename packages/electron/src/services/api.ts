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

  /** WebSocket `?token=` 等与 REST 共用，勿在日志中打印 */
  getAuthToken(): string | null {
    return authToken;
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

  async duplicateProject(sourceProjectId: string, newName: string, userId: string): Promise<ProjectWithSession> {
    try {
      const newProjectPath = `./projects/${newName.toLowerCase().replace(/\s+/g, '-')}`;
      const newProjectWithSession = await this.createProject(newName, newProjectPath, userId);

      const files = await this.getProjectFiles(sourceProjectId);
      await this.duplicateFiles(sourceProjectId, newProjectWithSession.project.id, files);

      return newProjectWithSession;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`复制项目失败: ${error.message}`);
      }
      throw new Error('复制项目失败: 未知错误');
    }
  },

  async duplicateFiles(sourceProjectId: string, targetProjectId: string, files: FileNode[]): Promise<void> {
    for (const file of files) {
      await this.duplicateFileNode(sourceProjectId, targetProjectId, file);
    }
  },

  async duplicateFileNode(sourceProjectId: string, targetProjectId: string, node: FileNode): Promise<void> {
    if (node.isDirectory && node.children) {
      for (const child of node.children) {
        await this.duplicateFileNode(sourceProjectId, targetProjectId, child);
      }
    } else {
      const relativePath = node.path.replace(sourceProjectId, '').replace(/^\//, '');
      const content = await this.readFile(sourceProjectId, relativePath);
      await this.writeFile(targetProjectId, relativePath, content);
    }
  },
};