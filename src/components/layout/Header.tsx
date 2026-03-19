import * as React from 'react';
import { useCompanyStore } from '@/stores/company';
import { Loader2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, isLoading, actions }: HeaderProps) {
  const activeCompany = useCompanyStore((s) => s.companies.find((c) => c.id === s.activeCompanyId));

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {title}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {activeCompany && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {activeCompany.name}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}