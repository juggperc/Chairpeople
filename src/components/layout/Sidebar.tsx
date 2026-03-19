import * as React from 'react';
import { useCompanyStore } from '@/stores/company';
import { useSettingsStore } from '@/stores/settings';
import {
  MessageSquare,
  GitBranch,
  Settings,
  Building2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type View = 'orchestration' | 'interaction' | 'settings';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { companies, activeCompanyId, setActiveCompany, createCompany } = useCompanyStore();
  const activeCompany = companies.find((c) => c.id === activeCompanyId);

  const navItems = [
    { id: 'orchestration' as const, icon: MessageSquare, label: 'Orchestration' },
    { id: 'interaction' as const, icon: GitBranch, label: 'Interaction' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col h-full w-64 border-r bg-card">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <img src="/chairpeople.png" alt="Chairpeople" className="h-8 w-8 object-contain" />
          Chairpeople
        </h1>
      </div>

      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">
                {activeCompany?.name || 'Select Company'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {companies.map((company) => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => setActiveCompany(company.id)}
                className={cn(
                  company.id === activeCompanyId && 'bg-accent'
                )}
              >
                {company.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => createCompany('New Company')}
              className="text-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Company
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 p-2">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              activeView === id
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground">
          {companies.length} company{companies.length !== 1 ? 'ies' : ''}
        </p>
      </div>
    </div>
  );
}