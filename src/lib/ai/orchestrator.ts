import { useState, useCallback } from 'react';
import { streamText } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { useSettingsStore } from '@/stores/settings';
import { useChatStore } from '@/stores/chat';
import { useCompanyStore } from '@/stores/company';
import { toolRegistry } from '@/lib/tools';

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

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function useOrchestrator() {
  const { activeProvider, providers } = useSettingsStore();
  const { addOrchestrationMessage, clearOrchestrationMessages } = useChatStore();
  const { createCompany } = useCompanyStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const providerConfig = providers.find(p => p.type === activeProvider);

  // #region debug log
  fetch('http://127.0.0.1:7323/ingest/3ce41043-4313-4eef-a698-7be0280253e2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf546b'},body:JSON.stringify({sessionId:'bf546b',location:'orchestrator.ts:130',message:'Provider config state',data:{activeProvider,providersCount:providers.length,providerConfigHasApiKey:!!providerConfig?.apiKey,defaultModel:providerConfig?.defaultModel},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const handleCreateSkill = useCallback((skillData: {
    name: string;
    description: string;
    instructions: string;
    tools?: Array<{
      name: string;
      description: string;
      parameters: Record<string, { type: string; description: string; required?: boolean }>;
    }>;
  }) => {
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
          handler: async () => ({ success: true, output: 'Tool executed', exitCode: 0 }),
        });
      }
    });
  }, []);

  const sendPrompt = useCallback(async (userInput: string) => {
    if (!providerConfig?.apiKey) {
      setError(new Error('API key not configured. Please add your API key in Settings.'));
      return;
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: userInput,
    };

    addOrchestrationMessage({
      companyId: '',
      conversationId: 'orchestration',
      senderId: 'user',
      senderType: 'user',
      senderName: 'You',
      content: userInput,
    });

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // #region debug log
      fetch('http://127.0.0.1:7323/ingest/3ce41043-4313-4eef-a698-7be0280253e2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf546b'},body:JSON.stringify({sessionId:'bf546b',location:'orchestrator.ts:195',message:'Before streamText call',data:{activeProvider,defaultModel:providerConfig.defaultModel,baseUrl:providerConfig.baseUrl},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      let model;
      if (activeProvider === 'opencode') {
        const openai = createOpenAI({
          apiKey: providerConfig.apiKey || 'dummy',
          baseURL: providerConfig.baseUrl || 'https://opencode.ai/zen/v1',
        });
        model = openai(providerConfig.defaultModel || 'opencode');
      } else {
        model = openrouter(providerConfig.defaultModel || 'anthropic/claude-3.5-sonnet');
      }

      const result = await streamText({
        model,
        system: ORCHESTRATOR_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userInput }],
      });

      let fullResponse = '';
      const reader = result.fullStream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += value;
      }

      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: fullResponse,
      };

      setMessages(prev => [...prev, assistantMessage]);
      addOrchestrationMessage({
        companyId: '',
        conversationId: 'orchestration',
        senderId: 'orchestrator',
        senderType: 'orchestrator',
        senderName: 'Orchestrator',
        content: fullResponse,
      });

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
      // #region debug log
      fetch('http://127.0.0.1:7323/ingest/3ce41043-4313-4eef-a698-7be0280253e2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf546b'},body:JSON.stringify({sessionId:'bf546b',location:'orchestrator.ts:237',message:'Error caught in sendPrompt',data:{error:err instanceof Error ? err.message : String(err),name:err instanceof Error ? err.name : 'unknown'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [providerConfig, addOrchestrationMessage, handleCreateSkill, activeProvider]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    sendMessage: sendPrompt,
    isLoading,
    error,
    clearMessages: clearOrchestrationMessages,
  };
}