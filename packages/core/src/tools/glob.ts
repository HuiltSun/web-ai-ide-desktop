import { Tool } from './registry.js';
import { glob as globSync } from 'glob';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

export interface GlobArgs {
  pattern: string;
  path?: string;
}

export function createGlobTool(): Tool {
  return {
    name: 'glob',
    description: 'Find files by pattern',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern to match' },
        path: { type: 'string', description: 'Root path to search from', default: '.' },
      },
      required: ['pattern'],
    },
    requiresApproval: false,
    execute: async (args: Record<string, unknown>) => {
      const { pattern, path = '.' } = args as GlobArgs;

      try {
        const matches = await globSync(pattern, { cwd: path });
        if (matches.length === 0) {
          return `No files found matching pattern: ${pattern}`;
        }
        return `Found ${matches.length} file(s):\n${matches.join('\n')}`;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error finding files: ${error.message}`;
        }
        return 'Unknown error finding files';
      }
    },
  };
}
