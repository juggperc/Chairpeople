import * as React from 'react';
import { useCompanyStore } from '@/stores/company';
import { useChatStore } from '@/stores/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users } from 'lucide-react';
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
  const { messagesByConversation, addMessage } = useChatStore();
  const messages = messagesByConversation[conversationId] || [];

  const [input, setInput] = React.useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addMessage(conversationId, {
      companyId,
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

          {messages.map((msg) => {
            const isUser = msg.senderType === 'user';
            const employee = activeCompany.structure.employees.find((e) => e.id === msg.senderId);
            const initials = isUser ? 'CEO' : (employee ? getInitials(employee.name) : '??');

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
          placeholder="Type a message to the group..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" size="icon" disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}