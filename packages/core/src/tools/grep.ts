import { Tool } from './registry.js';
import { readFile } from 'fs/promises';

export interface GrepArgs {
  pattern: string;
  path?: string;
  filePattern?: string;
}

export function createGrepTool(): Tool {
  return {
    name: 'grep',
    description: 'Search file contents by regex',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regex pattern to search' },
        path: { type: 'string', description: 'Directory to search in', default: '.' },
        filePattern: { type: 'string', description: 'File pattern to match', default: '*' },
      },
      required: ['pattern'],
    },
    requiresApproval: false,
    execute: async (args: Record<string, unknown>) => {
      const { pattern, path = '.', filePattern = '*' } = args as GrepArgs;

      try {
        const regex = new RegExp(pattern, 'g');
        const { glob } = await import('glob');
        const files = await glob(filePattern, { cwd: path });

        const results: string[] = [];

        for (const file of files) {
          try {
            const content = await readFile(`${path}/${file}`, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
              if (regex.test(line)) {
                results.push(`${file}:${index + 1}: ${line}`);
              }
            });
          } catch {
            // Skip files that can't be read
          }
        }

        if (results.length === 0) {
          return `No matches found for: ${pattern}`;
        }

        return `Found ${results.length} match(es):\n${results.slice(0, 100).join('\n')}`;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error searching files: ${error.message}`;
        }
        return 'Unknown error searching files';
      }
    },
  };
}
