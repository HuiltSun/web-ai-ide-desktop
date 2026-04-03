import { useState, useCallback } from 'react';
import { api, FileNode } from '../services/api';

export function useFileSystem(projectId: string | null) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.getProjectFiles(projectId);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createFile = useCallback(
    async (path: string, content: string = '') => {
      if (!projectId) return;
      await api.writeFile(projectId, path, content);
      await loadFiles();
    },
    [projectId, loadFiles]
  );

  const deleteFile = useCallback(
    async (path: string) => {
      if (!projectId) return;
      await api.deleteFile(projectId, path);
      await loadFiles();
    },
    [projectId, loadFiles]
  );

  const readFile = useCallback(
    async (path: string): Promise<string> => {
      if (!projectId) return '';
      return api.readFile(projectId, path);
    },
    [projectId]
  );

  return { files, loading, loadFiles, createFile, deleteFile, readFile };
}
