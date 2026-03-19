export type ToolResult = {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
};

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, {
    type: 'string' | 'number' | 'boolean';
    description: string;
    required: boolean;
    default?: string;
  }>;
  handler: (params: Record<string, unknown>) => Promise<ToolResult>;
};

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }
}

export const toolRegistry = new ToolRegistry();

// Sandbox execution utilities
export async function executeInSandbox(
  command: string,
  args: string[] = [],
  timeout = 30000
): Promise<ToolResult> {
  try {
    // In a real implementation, this would use a proper sandbox
    // For now, we simulate execution with a timeout
    const result = await new Promise<ToolResult>((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          output: '',
          error: 'Sandbox execution not available in browser environment',
          exitCode: 1,
        });
      }, 100);
    });
    return result;
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      exitCode: 1,
    };
  }
}

// Register built-in tools
toolRegistry.register({
  name: 'execute_command',
  description: 'Execute a command in a sandboxed environment',
  parameters: {
    command: {
      type: 'string',
      description: 'The command to execute',
      required: true,
    },
    args: {
      type: 'string',
      description: 'Command arguments as JSON array',
      required: false,
      default: '[]',
    },
    timeout: {
      type: 'number',
      description: 'Timeout in milliseconds',
      required: false,
      default: '30000',
    },
  },
  handler: async (params) => {
    const command = params.command as string;
    const args = params.args ? JSON.parse(params.args as string) : [];
    const timeout = params.timeout ? parseInt(params.timeout as string) : 30000;
    return executeInSandbox(command, args, timeout);
  },
});

toolRegistry.register({
  name: 'get_environment',
  description: 'Get current environment information',
  parameters: {},
  handler: async () => {
    return {
      success: true,
      output: JSON.stringify({
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
        timestamp: new Date().toISOString(),
      }),
      exitCode: 0,
    };
  },
});