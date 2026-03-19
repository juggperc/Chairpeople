import { useCallback, useState } from 'react';
import type { Employee } from '@/types';
import { useSettingsStore } from '@/stores/settings';
import { useChatStore } from '@/stores/chat';
import { v4 as uuid } from 'uuid';

const getEmployeeSystemPrompt = (employee: Employee, skills: string[]): string => {
  const skillsText = skills.length > 0 
    ? `\n\n## Your Skills:\n${skills.map(s => `- ${s}`).join('\n')}` 
    : '';
  
  const personalityText = employee.personality 
    ? `\n\n## Your Personality:\n${employee.personality}` 
    : '';

  return `You are ${employee.name}, ${employee.role} in the ${employee.department} department.

## Your Background:
- Role: ${employee.role}
- Department: ${employee.department}
- Specialties: ${employee.specialties.join(', ')}${personalityText}${skillsText}

## Your Memory Instructions:
${employee.memoryInstructions || 'Remember everything important about your work and interactions.'}

## Interaction Rules:
${employee.interactionRules.map(r => `- ${r}`).join('\n') || 'Follow company hierarchy and communication protocols.'}

## Guidelines:
- Stay in character as this specific employee
- Use your specialties to provide relevant insights
- Remember your personality traits in how you communicate
- Be helpful but stay true to your role
- You work alongside other employees in the company
- The user is the ultimate CEO and can override any decision

When in group chats, acknowledge other participants. In DMs, be direct and focused.`;
};

export interface EmployeeAgentOptions {
  employee: Employee;
  companyId: string;
  skills?: string[];
  conversationId?: string;
  onMessage?: (message: { id: string; content: string; sender: string; senderType: 'user' | 'employee' }) => void;
}

export function useEmployeeAgent({ employee, companyId, skills = [], conversationId, onMessage }: EmployeeAgentOptions) {
  const { providers, activeProvider } = useSettingsStore();
  const { addMessage, updateMessage, getMessages } = useChatStore();
  const providerConfig = providers.find(p => p.type === (employee.provider || activeProvider));
  const systemPrompt = getEmployeeSystemPrompt(employee, skills);
  const convId = conversationId || `dm-${uuid()}`;

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [error, setError] = useState<Error | null>(null);

  const send = useCallback(async (userInput: string, senderName = 'You') => {
    if (!providerConfig?.apiKey) {
      setError(new Error('API key not configured. Please add your API key in Settings.'));
      return;
    }

    const providerType = employee.provider || activeProvider;

    // Capture existing messages BEFORE adding the new user message to store
    const existingMessages = getMessages(convId).map(m => ({
      role: m.senderType === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }));

    addMessage(convId, {
      companyId,
      conversationId: convId,
      senderId: 'user',
      senderType: 'user' as const,
      senderName,
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
          system: systemPrompt,
          provider: providerType,
          model: employee.modelId || providerConfig.defaultModel,
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
      const assistantMsgId = addMessage(convId, {
        companyId,
        conversationId: convId,
        senderId: employee.id,
        senderType: 'employee' as const,
        senderName: employee.name,
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
        
        // Update the store with latest content
        updateMessage(convId, assistantMsgId, fullResponse);
      }
      
      onMessage?.({
        id: uuid(), // Temp ID for callback
        content: fullResponse,
        sender: employee.name,
        senderType: 'employee',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setStreamingResponse('');
    }
  }, [providerConfig, systemPrompt, employee, companyId, convId, addMessage, updateMessage, getMessages, onMessage, activeProvider]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  return {
    messages: [], // messages now come from store
    input,
    handleInputChange,
    sendMessage: send,
    isLoading,
    streamingResponse,
    error,
  };
}

export class EmployeeAgent {
  private employee: Employee;
  private companyId: string;
  private skills: string[];
  private conversationId: string;
  private messageHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private systemPrompt: string;

  constructor(options: EmployeeAgentOptions) {
    this.employee = options.employee;
    this.companyId = options.companyId;
    this.skills = options.skills || [];
    this.conversationId = options.conversationId || `employee-${this.employee.id}`;
    this.systemPrompt = getEmployeeSystemPrompt(this.employee, this.skills);
  }

  getId(): string {
    return this.employee.id;
  }

  getName(): string {
    return this.employee.name;
  }

  getConversationId(): string {
    return this.conversationId;
  }

  getEmployee(): Employee {
    return this.employee;
  }

  addSkill(skill: string): void {
    if (!this.skills.includes(skill)) {
      this.skills.push(skill);
      this.systemPrompt = getEmployeeSystemPrompt(this.employee, this.skills);
    }
  }

  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  addToHistory(role: 'user' | 'assistant', content: string): void {
    this.messageHistory.push({ role, content });
  }

  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.messageHistory];
  }

  clearHistory(): void {
    this.messageHistory = [];
  }
}