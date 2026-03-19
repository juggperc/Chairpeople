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

// Execution via backend proxy
export async function executeInSandbox(
  command: string,
  args: string[] = [],
  timeout = 30000
): Promise<ToolResult> {
  try {
    const response = await fetch('/api/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, args, timeout }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return {
        success: false,
        output: errData.output || '',
        error: errData.error || response.statusText,
        exitCode: errData.exitCode || 1,
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      exitCode: 1,
    };
  }
}

export async function webSearch(query: string): Promise<any> {
  try {
    const response = await fetch('/api/tools/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) throw new Error('Search failed');
    return await response.json();
  } catch (error) {
    console.error('Search tool error:', error);
    return { results: [] };
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
  name: 'web_search',
  description: 'Search the web for information',
  parameters: {
    query: {
      type: 'string',
      description: 'The search query',
      required: true,
    },
  },
  handler: async (params) => {
    const query = params.query as string;
    const result = await webSearch(query);
    return {
      success: true,
      output: JSON.stringify(result.results),
      exitCode: 0,
    };
  },
});
