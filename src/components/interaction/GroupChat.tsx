import * as React from 'react';
import { useCompanyStore } from '@/stores/company';
import { useChatStore } from '@/stores/chat';
import { useSettingsStore } from '@/stores/settings';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupChatProps {
  companyId: string;
  className?: string;
}

export function GroupChat({ companyId, className }: GroupChatProps) {
  const activeCompany = useCompanyStore((s) => {
    const company = s.companies.find((c) => c.id === s.activeCompanyId);
    return company || null;
  });

  const conversationId = `group-${companyId}`;
  const messages = useChatStore((s) => s.messagesByConversation[conversationId] || []);
  const { addMessage, updateMessage } = useChatStore();
  const { providers, activeProvider } = useSettingsStore();

  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamingResponse, setStreamingResponse] = React.useState('');
  const [respondingEmployee, setRespondingEmployee] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  const providerConfig = providers.find(p => p.type === activeProvider);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeCompany || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    addMessage(conversationId, {
      companyId,
      conversationId,
      senderId: 'user',
      senderType: 'user',
      senderName: 'CEO',
      content: userMessage,
    });

    // Pick an employee to respond (round-robin or random)
    const employees = activeCompany.structure.employees;
    if (employees.length === 0 || !providerConfig?.apiKey) return;

    // Choose a random employee to respond
    const responder = employees[Math.floor(Math.random() * employees.length)];
    setRespondingEmployee(responder.name);
    setIsLoading(true);
    setStreamingResponse('');

    try {
      // Build system prompt for this employee
      const systemPrompt = `You are ${responder.name}, ${responder.role} in the ${responder.department} department.
Your personality: ${responder.personality || 'Professional and helpful'}
Your specialties: ${responder.specialties.join(', ') || 'General'}
You are in a group chat with the CEO and other employees. Respond naturally and in character.
Keep responses concise for group chat (2-4 sentences unless more detail is needed).`;

      // Capture existing messages
      const existingMessages = useChatStore.getState().messagesByConversation[conversationId]?.map(m => ({
        role: m.senderType === 'user' ? 'user' as const : 'assistant' as const,
        content: `[${m.senderName}]: ${m.content}`,
      })) || [];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: existingMessages,
          system: systemPrompt,
          provider: responder.provider || activeProvider,
          model: responder.modelId || providerConfig.defaultModel,
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

      // Add empty assistant message
      const assistantMsgId = addMessage(conversationId, {
        companyId,
        conversationId,
        senderId: responder.id,
        senderType: 'employee',
        senderName: responder.name,
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
        updateMessage(conversationId, assistantMsgId, fullResponse);
      }
    } catch (err) {
      console.error('Group chat error:', err);
      // Add error message
      addMessage(conversationId, {
        companyId,
        conversationId,
        senderId: 'system',
        senderType: 'employee',
        senderName: 'System',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}`,
      });
    } finally {
      setIsLoading(false);
      setStreamingResponse('');
      setRespondingEmployee(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!activeCompany) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <p className="text-muted-foreground">No company selected</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-2 p-4 border-b">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Group Chat</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {activeCompany.structure.employees.length + 1} participants
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.senderType === 'user';
            const employee = activeCompany.structure.employees.find((e) => e.id === msg.senderId);
            const initials = isUser ? 'CEO' : (employee ? getInitials(employee.name) : getInitials(msg.senderName));

            // Hide last employee message if currently streaming
            const isLastMessage = i === messages.length - 1;
            const isStreamingThis = isLastMessage && !isUser && isLoading && streamingResponse;
            if (isStreamingThis) return null;

            return (
              <div key={msg.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground text-xs' : 'bg-secondary text-secondary-foreground text-xs'}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{msg.senderName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                      isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && streamingResponse && respondingEmployee && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {getInitials(respondingEmployee)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{respondingEmployee}</span>
                </div>
                <div className="rounded-lg px-3 py-2 text-sm bg-muted whitespace-pre-wrap">
                  {streamingResponse}
                </div>
              </div>
            </div>
          )}

          {isLoading && !streamingResponse && respondingEmployee && (
            <div className="flex gap-3 animate-pulse">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {getInitials(respondingEmployee)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{respondingEmployee}</span>
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
                <div className="h-10 bg-muted rounded w-3/4" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as any);
            }
          }}
          placeholder="Type a message to the group..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}