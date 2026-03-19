import * as React from 'react';
import { useCompanyStore } from '@/stores/company';
import { useChatStore } from '@/stores/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types';

interface DirectMessageProps {
  employeeId: string;
  onClose: () => void;
}

export function DirectMessage({ employeeId, onClose }: DirectMessageProps) {
  const activeCompany = useCompanyStore((s) => {
    const company = s.companies.find((c) => c.id === s.activeCompanyId);
    return company || null;
  });

  const employee = activeCompany?.structure.employees.find((e) => e.id === employeeId);
  const conversationId = `dm-${employeeId}`;
  const { messagesByConversation, addMessage } = useChatStore();
  const messages = messagesByConversation[conversationId] || [];
  const [input, setInput] = React.useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeCompany) return;

    addMessage(conversationId, {
      companyId: activeCompany.id,
      conversationId,
      senderId: 'user',
      senderType: 'user',
      senderName: 'CEO',
      content: input.trim(),
    });

    setInput('');
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
    return null;
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

          {messages.map((msg) => {
            const isUser = msg.senderType === 'user';

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
                      'rounded-lg px-3 py-2 text-sm',
                      isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${employee.name.split(' ')[0]}...`}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" size="icon" disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}