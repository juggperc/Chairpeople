import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompanyStore } from '@/stores/company';
import {
  MessageSquare,
  GitBranch,
  Settings,
  Building2,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type View = 'orchestration' | 'interaction' | 'settings';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { companies, activeCompanyId, setActiveCompany, createCompany, deleteCompany } = useCompanyStore();
  const activeCompany = companies.find((c) => c.id === activeCompanyId);

  const [showNewCompanyDialog, setShowNewCompanyDialog] = React.useState(false);
  const [newCompanyName, setNewCompanyName] = React.useState('');
  const [showManageDialog, setShowManageDialog] = React.useState(false);

  const navItems = [
    { id: 'orchestration' as const, icon: MessageSquare, label: 'Orchestration' },
    { id: 'interaction' as const, icon: GitBranch, label: 'Interaction' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  const handleCreateCompany = () => {
    if (newCompanyName.trim()) {
      createCompany(newCompanyName.trim());
      setNewCompanyName('');
      setShowNewCompanyDialog(false);
    }
  };

  const handleDeleteCompany = (id: string) => {
    if (confirm('Delete this company?')) {
      deleteCompany(id);
    }
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full w-64 border-r bg-card"
    >
      <div className="p-4 border-b flex justify-center">
        <img src="/chairpeople.png" alt="Chairpeople" className="h-16 w-auto object-contain" />
      </div>

      <div className="p-3 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => setShowManageDialog(true)}
        >
          <Building2 className="h-4 w-4" />
          <span className="truncate flex-1 text-left">
            {activeCompany?.name || 'Select Company'}
          </span>
        </Button>

        <Button
          variant="default"
          className="w-full justify-start gap-2"
          onClick={() => setShowNewCompanyDialog(true)}
        >
          <Plus className="h-4 w-4" />
          New Company
        </Button>
      </div>

      <nav className="flex-1 p-2">
        <AnimatePresence>
          {navItems.map(({ id, icon: Icon, label }, index) => (
            <motion.button
              key={id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onViewChange(id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-1',
                activeView === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </motion.button>
          ))}
        </AnimatePresence>
      </nav>

      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground">
          {companies.length} company{companies.length !== 1 ? 'ies' : ''}
        </p>
      </div>

      <Dialog open={showNewCompanyDialog} onOpenChange={setShowNewCompanyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Company Name</Label>
            <Input
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="My AI Company"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCompany()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCompanyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCompany} disabled={!newCompanyName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Companies</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 max-h-64 overflow-auto">
            {companies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No companies yet. Create one to get started!
              </p>
            ) : (
              companies.map((company) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                    company.id === activeCompanyId
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent'
                  )}
                  onClick={() => {
                    setActiveCompany(company.id);
                    setShowManageDialog(false);
                  }}
                >
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {company.structure.employees.length} employees
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCompany(company.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </motion.div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setShowManageDialog(false);
              setShowNewCompanyDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}