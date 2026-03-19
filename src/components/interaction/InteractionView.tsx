import * as React from 'react';
import { useCompanyStore } from '@/stores/company';
import { Header } from '@/components/layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, UserCircle } from 'lucide-react';
import { CompanyFlowchart } from './CompanyFlowchart';
import { EmployeeDetail } from './EmployeeDetail';
import { GroupChat } from './GroupChat';
import { DirectMessage } from './DirectMessage';
import { cn } from '@/lib/utils';

export function InteractionView() {
  const activeCompany = useCompanyStore((s) => {
    const company = s.companies.find((c) => c.id === s.activeCompanyId);
    return company || null;
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);
  const [dmEmployeeId, setDmEmployeeId] = React.useState<string | null>(null);

  const handleNodeClick = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  };

  const handleStartDM = (employeeId: string) => {
    setDmEmployeeId(employeeId);
  };

  if (!activeCompany) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Interaction" subtitle="Select or create a company to interact with" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No company selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Interaction"
        subtitle={`${activeCompany.name} - ${activeCompany.structure.employees.length} employees`}
      />

      <Tabs defaultValue="flowchart" className="flex-1 flex flex-col">
        <div className="px-4 border-b">
          <TabsList>
            <TabsTrigger value="flowchart">
              <UserCircle className="h-4 w-4 mr-2" />
              Company Structure
            </TabsTrigger>
            <TabsTrigger value="group">
              <Users className="h-4 w-4 mr-2" />
              Group Chat
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="flowchart" className="flex-1 flex">
          <div className={cn('flex-1', selectedEmployeeId && 'mr-0')}>
            <CompanyFlowchart
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedEmployeeId}
              className="h-full"
            />
          </div>

          {selectedEmployeeId && (
            <EmployeeDetail
              employeeId={selectedEmployeeId}
              onClose={() => setSelectedEmployeeId(null)}
              onStartDM={handleStartDM}
            />
          )}

          {dmEmployeeId && (
            <DirectMessage
              employeeId={dmEmployeeId}
              onClose={() => setDmEmployeeId(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="group" className="flex-1 flex">
          <GroupChat companyId={activeCompany.id} className="flex-1" />
        </TabsContent>
      </Tabs>
    </div>
  );
}