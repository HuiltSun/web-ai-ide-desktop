export interface Tool {
  name: string;
  description: string;
  inputSchema: object;
  requiresApproval: boolean;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  listToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  async executeTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.execute(args);
  }
}

export const toolRegistry = new ToolRegistry();

export { createShellTool } from './shell.js';
export { createReadFileTool } from './file-read.js';
export { createWriteFileTool } from './file-write.js';
export { createEditTool } from './edit.js';
export { createGlobTool } from './glob.js';
export { createGrepTool } from './grep.js';
