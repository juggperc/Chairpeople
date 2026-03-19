import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ConversationProps {
  children: React.ReactNode;
  className?: string;
}

export function Conversation({ children, className }: ConversationProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Scroll the sentinel element into view whenever children change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [children]);

  return (
    <ScrollArea className={cn('flex-1', className)}>
      <div className="p-4 space-y-4">
        {children}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}