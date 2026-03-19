import * as React from 'react';
import { useCompanyStore } from '@/stores/company';
import { useChatStore } from '@/stores/chat';
import { useEmployeeAgent } from '@/lib/ai/employee';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types';

interface DirectMessageProps {
  employeeId: string;
  onClose: () => void;
}

// Placeholder employee to satisfy hook rules (hooks can't be called conditionally)
const PLACEHOLDER_EMPLOYEE: Employee = {
  id: '',
  companyId: '',
  name: 'Unknown',
  role: '',
  department: '',
  personality: '',
  specialties: [],
  memoryInstructions: '',
  reportingTo: null,
  interactionRules: [],
  createdAt: '',
  updatedAt: '',
};

export function DirectMessage({ employeeId, onClose }: DirectMessageProps) {
  const activeCompany = useCompanyStore((s) => {
    const company = s.companies.find((c) => c.id === s.activeCompanyId);
    return company || null;
  });

  const employee = activeCompany?.structure.employees.find((e) => e.id === employeeId);
  const conversationId = `dm-${employeeId}`;
  const messages = useChatStore((s) => s.messagesByConversation[conversationId] || []);
  
  const { input, handleInputChange, sendMessage, isLoading, streamingResponse } = useEmployeeAgent({
    employee: employee || PLACEHOLDER_EMPLOYEE,
    companyId: activeCompany?.id || '',
    conversationId,
  });

  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeCompany || !employee) return;
    sendMessage(input, 'CEO');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!employee || !activeCompany) {
    return (
      <div className="flex flex-col h-full w-80 border-l bg-card items-center justify-center">
        <p className="text-sm text-muted-foreground">Employee not found</p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-80 border-l bg-card">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{employee.name}</h3>
            <p className="text-xs text-muted-foreground">{employee.role}</p>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Start a private conversation with {employee.name.split(' ')[0]}
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.senderType === 'user';
            
            // Avoid duplicate rendering while streaming
            const isLastMessage = i === messages.length - 1;
            const isStreamingThis = isLastMessage && msg.senderId === employee.id && isLoading;
            if (isStreamingThis && streamingResponse) return null;

            return (
              <div key={msg.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground text-xs' : 'bg-secondary text-secondary-foreground text-xs'}>
                    {isUser ? 'CEO' : getInitials(employee.name)}
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
          
          {isLoading && streamingResponse && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{employee.name}</span>
                </div>
                <div className="rounded-lg px-3 py-2 text-sm bg-muted whitespace-pre-wrap">
                  {streamingResponse}
                </div>
              </div>
            </div>
          )}

          {isLoading && !streamingResponse && (
            <div className="flex gap-3 animate-pulse">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-10 bg-muted rounded w-3/4" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as any);
            }
          }}
          placeholder={`Message ${employee.name.split(' ')[0]}...`}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-10"
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}