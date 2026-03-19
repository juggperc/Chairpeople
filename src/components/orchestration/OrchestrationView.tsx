import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrchestrator } from '@/lib/ai/orchestrator';
import { useChatStore } from '@/stores/chat';
import { useCompanyStore } from '@/stores/company';
import { Conversation, Message, PromptInput, SuggestionPills, Loader } from '@/components/ai';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import { CompanyEditor } from './CompanyEditor';

const INITIAL_SUGGESTIONS = [
  'Build me a tech startup with a flat hierarchy',
  'Create a traditional corporate hierarchy with a CEO and departments',
  'Set up a creative agency with cross-functional teams',
  'Build a company inspired by a Politburo structure',
  'Create an anarchist collective where everyone is equal',
];

export function OrchestrationView() {
  const { messages, input, handleInputChange, sendMessage, isLoading } = useOrchestrator();
  const { orchestrationMessages } = useChatStore();
  const { createCompany } = useCompanyStore();
  const [showEditor, setShowEditor] = React.useState(false);
  const [pendingStructure, setPendingStructure] = React.useState<string | null>(null);

  const handleSuggestionSelect = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
    }
  };

  const handleAcceptStructure = () => {
    if (pendingStructure) {
      try {
        const parsed = JSON.parse(pendingStructure);
        if (parsed.action === 'create_company' && parsed.data) {
          const { name, description, departments, employees, interactionRules } = parsed.data;
          const company = createCompany(name, description || '');

          departments?.forEach((dept: { name: string; description?: string }) => {
            useCompanyStore.getState().addDepartment(company.id, {
              name: dept.name,
              description: dept.description || '',
            });
          });

          employees?.forEach((emp: Record<string, unknown>) => {
            const specialties = Array.isArray(emp.specialties)
              ? emp.specialties as string[]
              : typeof emp.specialties === 'string'
                ? [emp.specialties]
                : [];
            const interactionRules = Array.isArray(emp.interactionRules)
              ? emp.interactionRules as string[]
              : [];
            useCompanyStore.getState().addEmployee(company.id, {
              name: emp.name as string,
              role: emp.role as string,
              department: emp.department as string,
              personality: (emp.personality as string) || '',
              specialties,
              memoryInstructions: (emp.memoryInstructions as string) || '',
              reportingTo: (emp.reportingTo as string) || null,
              interactionRules,
            });
          });

          interactionRules?.forEach((rule: Record<string, unknown>) => {
            useCompanyStore.getState().addInteractionRule(company.id, {
              from: rule.from as string,
              to: rule.to as string,
              type: rule.type as 'report' | 'dm' | 'group' | 'broadcast',
              allowed: rule.allowed !== false,
            });
          });

          setPendingStructure(null);
          setShowEditor(false);
        }
      } catch (err) {
        console.error('Failed to parse structure:', err);
      }
    }
  };

  React.useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        const jsonMatch = lastMessage.content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.action === 'create_company' || parsed.action === 'update_company') {
              setPendingStructure(jsonMatch[1]);
            }
          } catch {
            // Not a JSON block we care about
          }
        }
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Orchestration"
        subtitle="Design your AI company with the orchestrator"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowEditor(true)}>
            <Building2 className="h-4 w-4 mr-2" />
            Edit Structure
          </Button>
        }
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <Conversation className="flex-1">
          <AnimatePresence mode="wait">
            {orchestrationMessages.length === 0 && messages.length === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-full space-y-6 text-center p-8"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="space-y-2"
                >
                  <img src="/chairpeople.png" alt="Chairpeople" className="h-24 w-auto mx-auto" />
                  <p className="text-muted-foreground max-w-md">
                    Describe the company you want to build. You can create any structure
                    - from traditional hierarchies to creative collectives.
                  </p>
                </motion.div>
                <SuggestionPills
                  suggestions={INITIAL_SUGGESTIONS}
                  onSelect={handleSuggestionSelect}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {orchestrationMessages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Message
                  role={msg.senderType === 'user' ? 'user' : 'assistant'}
                  senderName={msg.senderName}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Message
                  role={msg.role}
                  senderName={msg.role === 'user' ? 'You' : 'Orchestrator'}
                  content={msg.content}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages.length === orchestrationMessages.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center py-4"
            >
              <Loader />
            </motion.div>
          )}
        </Conversation>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-t p-4 bg-background"
        >
          <PromptInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder="Describe the company you want to build..."
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {pendingStructure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
            >
              <h3 className="text-lg font-semibold mb-4">Company Structure Preview</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify(JSON.parse(pendingStructure), null, 2)}
              </pre>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setPendingStructure(null)}>
                  Cancel
                </Button>
                <Button onClick={handleAcceptStructure}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Create Company
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showEditor && <CompanyEditor onClose={() => setShowEditor(false)} />}
    </div>
  );
}