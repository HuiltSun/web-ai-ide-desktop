import { Tool } from './registry.js';

export interface ShellToolArgs {
  command: string;
  timeout?: number;
}

export function createShellTool(): Tool {
  return {
    name: 'shell',
    description: 'Execute shell commands',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
        timeout: { type: 'number', description: 'Timeout in milliseconds', default: 30000 },
      },
      required: ['command'],
    },
    requiresApproval: true,
    execute: async (args: Record<string, unknown>) => {
      const { command, timeout = 30000 } = args as ShellToolArgs;

      return new Promise((resolve) => {
        const { exec } = require('child_process');
        const startTime = Date.now();

        const proc = exec(command, { timeout }, (error: Error | null, stdout: string, stderr: string) => {
          const duration = Date.now() - startTime;

          if (error) {
            resolve(`Error: ${error.message}\nDuration: ${duration}ms\nStderr: ${stderr}`);
          } else {
            resolve(`Output:\n${stdout}\nDuration: ${duration}ms`);
          }
        });

        proc.on('error', (err: Error) => {
          resolve(`Process error: ${err.message}`);
        });
      });
    },
  };
}
