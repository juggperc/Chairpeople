import * as React from 'react';
import { useCompanyStore } from '@/stores/company';
import { useChatStore } from '@/stores/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Mail, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types';
import { PromptInput } from '@/components/ai';

interface EmployeeDetailProps {
  employeeId: string;
  onClose: () => void;
  onStartDM?: (employeeId: string) => void;
}

export function EmployeeDetail({ employeeId, onClose, onStartDM }: EmployeeDetailProps) {
  const activeCompany = useCompanyStore((s) => {
    const company = s.companies.find((c) => c.id === s.activeCompanyId);
    return company || null;
  });
  const employee = activeCompany?.structure.employees.find((e) => e.id === employeeId);
  const { messagesByConversation, conversations } = useChatStore();
  
  const [localInput, setLocalInput] = React.useState('');
  const conversationId = `employee-${employeeId}`;
  const employeeMessages = messagesByConversation[conversationId] || [];

  if (!employee || !activeCompany) {
    return null;
  }

  const manager = employee.reportingTo
    ? activeCompany.structure.employees.find((e) => e.id === employee.reportingTo)
    : null;

  const directReports = activeCompany.structure.employees.filter(
    (e) => e.reportingTo === employee.id
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim()) return;

    const { addMessage } = useChatStore.getState();
    addMessage(conversationId, {
      companyId: activeCompany.id,
      conversationId,
      senderId: 'user',
      senderType: 'user',
      senderName: 'CEO',
      content: localInput.trim(),
    });

    setLocalInput('');
  };

  return (
    <div className="flex flex-col h-full w-80 border-l bg-card">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Employee Details</h3>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 text-2xl">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <h4 className="mt-3 text-lg font-semibold">{employee.name}</h4>
            <p className="text-sm text-muted-foreground">{employee.role}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {employee.department}
            </span>
          </div>

          <Separator />

          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">Specialties</h5>
            <div className="flex flex-wrap gap-1">
              {employee.specialties.map((specialty, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs"
                >
                  {specialty}
                </span>
              ))}
              {employee.specialties.length === 0 && (
                <p className="text-sm text-muted-foreground">No specialties defined</p>
              )}
            </div>
          </div>

          {employee.personality && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-muted-foreground">Personality</h5>
              <p className="text-sm">{employee.personality}</p>
            </div>
          )}

          {manager && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-muted-foreground">Reports To</h5>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(manager.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{manager.name}</p>
                  <p className="text-xs text-muted-foreground">{manager.role}</p>
                </div>
              </div>
            </div>
          )}

          {directReports.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-muted-foreground">Direct Reports</h5>
              <div className="space-y-2">
                {directReports.map((report) => (
                  <div key={report.id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(report.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">Chat with {employee.name.split(' ')[0]}</h5>
            <div className="space-y-2 max-h-48 overflow-auto">
              {employeeMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No messages yet. Start a conversation!
                </p>
              ) : (
                employeeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm',
                      msg.senderType === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <p className="font-medium text-xs mb-1">{msg.senderName}</p>
                    {msg.content}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}