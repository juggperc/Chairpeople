import { useState, useCallback } from 'react';
import { useSettingsStore } from '@/stores/settings';
import { useChatStore } from '@/stores/chat';
import { useCompanyStore } from '@/stores/company';
import { toolRegistry, executeInSandbox } from '@/lib/tools';

const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Orchestrator - a visionary AI architect who helps users build AI-powered companies from scratch.

Your role is to understand the user's desired company structure and transform it into a detailed, executable blueprint.

## What you can create:

**Company Structure:**
- Departments (Engineering, HR, PR, Finance, etc.)
- Employees with distinct roles, personalities, and specialties
- Reporting hierarchies (hierarchical, flat, matrix, etc.)
- Interaction rules between employees

**Employee Attributes:**
- Name, role, and department
- Personality traits (e.g., "detail-oriented", "charismatic", "data-driven")
- Specialties (technical skills, soft skills)
- Memory instructions (how this employee should remember context)
- Custom interaction rules

**Skills & Tools:**
You can create executable skills that allow agents to perform actions:
- Skills can have tools that execute commands in a sandbox
- Tools take parameters and return results

## Output Format:

When the user asks to create or modify a company structure, respond with a JSON block:

\`\`\`json
{
  "action": "create_company" | "update_company" | "add_employee" | "update_employee" | "remove_employee" | "add_rule" | "remove_rule" | "create_skill",
  "data": {
    // Structure varies by action - see below
  }
}
\`\`\`

**create_company:**
{
  "name": "Company Name",
  "description": "What this company does",
  "departments": [
    { "name": "Engineering", "description": "Tech team" }
  ],
  "employees": [
    {
      "name": "Alice Chen",
      "role": "CTO",
      "department": "Engineering",
      "personality": "Visionary, technical, decisive",
      "specialties": ["System Architecture", "Team Leadership", "Strategic Planning"],
      "reportingTo": null,
      "interactionRules": ["can_dm_all", "reports_to_board"]
    }
  ],
  "interactionRules": [
    { "from": "employee_id", "to": "employee_id", "type": "report", "allowed": true }
  ]
}

**add_employee:**
{
  "name": "Bob Smith",
  "role": "Senior Engineer",
  "department": "Engineering",
  "personality": "Analytical, collaborative, methodical",
  "specialties": ["Backend Development", "Code Review", "Mentoring"],
  "reportingTo": "manager_employee_id",
  "interactionRules": ["can_dm_team"]
}

**create_skill:**
{
  "name": "skill_name",
  "description": "What this skill does",
  "instructions": "When to use this skill and how to invoke it",
  "tools": [
    {
      "name": "tool_name",
      "description": "What this tool does",
      "parameters": {
        "param1": { "type": "string", "description": "param description", "required": true }
      }
    }
  ]
}

## Guidelines:

1. Ask clarifying questions if the user's request is vague (e.g., "What kind of company culture?" "Hierarchical or flat structure?")
2. Suggest realistic company structures based on the user's goals
3. Assign diverse personalities and specialties to make employees feel distinct
4. You can create unconventional structures (e.g., Politburo-style, cooperative, anarchic) based on user requests
5. All employees should have clear purposes and interactions defined
6. Once structure is set, user can modify it at any time without affecting running operations

## Skills & Connectors:

You can design custom skills and connectors when the user requests access to external tools:
- Skills define what an employee CAN do with executable tools
- Connectors link to external services (Notion, wallets, APIs)
- Tools execute in a sandboxed environment for safety

Respond in a conversational way, explaining what you're building. Use the JSON blocks for actual changes.`;

export function useOrchestrator() {
  const { activeProvider, providers } = useSettingsStore();
  const { addOrchestrationMessage, updateOrchestrationMessage, clearOrchestrationMessages } = useChatStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [error, setError] = useState<Error | null>(null);

  const providerConfig = providers.find(p => p.type === activeProvider);

  const handleCreateSkill = useCallback(async (skillData: {
    name: string;
    description: string;
    instructions: string;
    tools?: Array<{
      name: string;
      description: string;
      parameters: Record<string, { type: string; description: string; required?: boolean }>;
    }>;
  }) => {
    const { activeCompanyId } = useCompanyStore.getState();
    if (!activeCompanyId) return;

    // Persist to backend
    try {
      await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Math.random().toString(36).substring(7),
          companyId: activeCompanyId,
          name: skillData.name,
          description: skillData.description,
          instructions: skillData.instructions,
          provider: activeProvider,
          tools: skillData.tools,
          createdBy: 'orchestrator'
        })
      });
    } catch (err) {
      console.error('Failed to save skill to backend:', err);
    }

    // Register tools with the tool registry
    skillData.tools?.forEach(tool => {
      if (!toolRegistry.has(tool.name)) {
        toolRegistry.register({
          name: tool.name,
          description: tool.description,
          parameters: Object.fromEntries(
            Object.entries(tool.parameters).map(([key, val]) => [
              key,
              {
                type: val.type as 'string' | 'number' | 'boolean',
                description: val.description,
                required: val.required ?? false,
              },
            ])
          ),
          handler: async (params) => {
            // Default handler for AI-generated skills uses the sandbox
            return executeInSandbox(tool.name, [JSON.stringify(params)]);
          },
        });
      }
    });
  }, [activeProvider]);

  const sendPrompt = useCallback(async (userInput: string) => {
    if (!providerConfig?.apiKey) {
      setError(new Error('API key not configured. Please add your API key in Settings.'));
      return;
    }

    // Capture existing messages BEFORE adding the new user message to store
    // to avoid sending the user message twice
    const existingMessages = useChatStore.getState().orchestrationMessages.map(m => ({
      role: m.senderType === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }));

    addOrchestrationMessage({
      companyId: '',
      conversationId: 'orchestration',
      senderId: 'user',
      senderType: 'user',
      senderName: 'You',
      content: userInput,
    });

    setInput('');
    setIsLoading(true);
    setStreamingResponse('');
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...existingMessages,
            { role: 'user', content: userInput }
          ],
          system: ORCHESTRATOR_SYSTEM_PROMPT,
          provider: activeProvider,
          model: providerConfig.defaultModel,
          apiKey: providerConfig.apiKey,
          baseUrl: providerConfig.baseUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      // Add initial empty assistant message to store
      const assistantMsgId = addOrchestrationMessage({
        companyId: '',
        conversationId: 'orchestration',
        senderId: 'orchestrator',
        senderType: 'orchestrator',
        senderName: 'Orchestrator',
        content: '',
      });

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setStreamingResponse(fullResponse);
        
        // Update the store with the latest content
        updateOrchestrationMessage(assistantMsgId, fullResponse);
      }

      // Check if response contains skill creation
      const jsonMatch = fullResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.action === 'create_skill' && parsed.data) {
            handleCreateSkill(parsed.data);
          }
        } catch {
          // Not valid JSON
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setStreamingResponse('');
    }
  }, [providerConfig, addOrchestrationMessage, updateOrchestrationMessage, handleCreateSkill, activeProvider]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  return {
    messages: [], // messages now come from store
    input,
    handleInputChange,
    sendMessage: sendPrompt,
    isLoading,
    streamingResponse,
    error,
    clearMessages: clearOrchestrationMessages,
  };
}