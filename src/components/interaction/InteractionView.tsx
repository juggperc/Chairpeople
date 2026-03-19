import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompanyStore } from '@/stores/company';
import { Header } from '@/components/layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, UserCircle } from 'lucide-react';
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col h-full"
      >
        <Header title="Interaction" subtitle="Select or create a company to interact with" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No company selected</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
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
          <AnimatePresence mode="wait">
            <motion.div
              key="flowchart"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn('flex-1', selectedEmployeeId && 'mr-0')}
            >
              <CompanyFlowchart
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedEmployeeId}
                className="h-full"
              />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {selectedEmployeeId && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <EmployeeDetail
                  employeeId={selectedEmployeeId}
                  onClose={() => setSelectedEmployeeId(null)}
                  onStartDM={handleStartDM}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {dmEmployeeId && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <DirectMessage
                  employeeId={dmEmployeeId}
                  onClose={() => setDmEmployeeId(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="group" className="flex-1 flex">
          <motion.div
            key="group"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1"
          >
            <GroupChat companyId={activeCompany.id} className="flex-1" />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}