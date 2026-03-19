import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MessageProps {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  senderName?: string;
  timestamp?: string;
  className?: string;
}

export function Message({ role, content, senderName, timestamp, className }: MessageProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  return (
    <div className={cn('flex gap-3', className)}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className={isSystem ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}>
            {isSystem ? 'SYS' : 'AI'}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('flex-1 space-y-2', isUser && 'items-end')}>
        {senderName && (
          <div className={cn('flex items-center gap-2', isUser && 'flex-row-reverse')}>
            <span className="text-sm font-medium">{senderName}</span>
            {timestamp && (
              <span className="text-xs text-muted-foreground">
                {new Date(timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm whitespace-pre-wrap',
            isUser && 'bg-primary text-primary-foreground',
            isSystem && 'bg-muted text-muted-foreground italic',
            !isUser && !isSystem && 'bg-muted'
          )}
        >
          {content}
        </div>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}