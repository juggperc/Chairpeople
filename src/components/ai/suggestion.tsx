import * as React from 'react';
import { cn } from '@/lib/utils';

interface SuggestionProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
}

export function SuggestionPills({ suggestions, onSelect, className }: SuggestionProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}