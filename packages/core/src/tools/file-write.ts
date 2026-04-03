import { Tool } from './registry.js';
import { writeFile } from 'fs/promises';
import { dirname } from 'path';
import { mkdir } from 'fs/promises';

export interface WriteFileArgs {
  path: string;
  content: string;
}

export function createWriteFileTool(): Tool {
  return {
    name: 'write_file',
    description: 'Create or overwrite a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'File content' },
      },
      required: ['path', 'content'],
    },
    requiresApproval: true,
    execute: async (args: Record<string, unknown>) => {
      const { path, content } = args as WriteFileArgs;

      try {
        const dir = dirname(path);
        await mkdir(dir, { recursive: true });
        await writeFile(path, content, 'utf-8');
        return `File written successfully: ${path}`;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error writing file: ${error.message}`;
        }
        return 'Unknown error writing file';
      }
    },
  };
}
