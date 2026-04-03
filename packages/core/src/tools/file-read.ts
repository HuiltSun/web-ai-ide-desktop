import { Tool } from './registry.js';
import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';

export interface ReadFileArgs {
  path: string;
}

export function createReadFileTool(): Tool {
  return {
    name: 'read_file',
    description: 'Read file contents',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
      },
      required: ['path'],
    },
    requiresApproval: false,
    execute: async (args: Record<string, unknown>) => {
      const { path } = args as ReadFileArgs;

      try {
        const content = await readFile(path, 'utf-8');
        return content;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error reading file: ${error.message}`;
        }
        return 'Unknown error reading file';
      }
    },
  };
}
