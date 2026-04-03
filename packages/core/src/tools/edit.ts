import { Tool } from './registry.js';
import { readFile, writeFile } from 'fs/promises';

export interface EditArgs {
  path: string;
  search: string;
  replace: string;
}

export function createEditTool(): Tool {
  return {
    name: 'edit',
    description: 'Make targeted string replacements in a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to edit' },
        search: { type: 'string', description: 'String to search for' },
        replace: { type: 'string', description: 'String to replace with' },
      },
      required: ['path', 'search', 'replace'],
    },
    requiresApproval: true,
    execute: async (args: Record<string, unknown>) => {
      const { path, search, replace } = args as EditArgs;

      try {
        const content = await readFile(path, 'utf-8');

        if (!content.includes(search)) {
          return `Error: Search string not found in file: ${path}`;
        }

        const newContent = content.replace(search, replace);
        await writeFile(path, newContent, 'utf-8');

        return `File edited successfully: ${path}`;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error editing file: ${error.message}`;
        }
        return 'Unknown error editing file';
      }
    },
  };
}
