import * as React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = 'Type your message...',
  className,
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoading && value.trim()) {
      onSubmit(e);
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-h-[44px] max-h-[200px] resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading && value.trim()) {
              const form = e.currentTarget.form;
              if (form) {
                form.requestSubmit();
              }
            }
          }
        }}
      />
      <Button
        type="submit"
        size="icon"
        disabled={isLoading || !value.trim()}
        className="h-[44px] w-[44px]"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}