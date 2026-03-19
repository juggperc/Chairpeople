import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ConversationProps {
  children: React.ReactNode;
  className?: string;
}

export function Conversation({ children, className }: ConversationProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [children]);

  return (
    <ScrollArea className={cn('flex-1', className)}>
      <div ref={scrollRef} className="p-4 space-y-4">
        {children}
      </div>
    </ScrollArea>
  );
}