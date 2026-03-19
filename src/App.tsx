import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout';
import { OrchestrationView } from '@/components/orchestration';
import { InteractionView } from '@/components/interaction';
import { SettingsView } from '@/components/settings';

type View = 'orchestration' | 'interaction' | 'settings';

function App() {
  const [activeView, setActiveView] = React.useState<View>('orchestration');

  const renderView = () => {
    switch (activeView) {
      case 'orchestration':
        return <OrchestrationView key="orchestration" />;
      case 'interaction':
        return <InteractionView key="interaction" />;
      case 'settings':
        return <SettingsView key="settings" />;
      default:
        return <OrchestrationView key="orchestration" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </TooltipProvider>
  );
}

export { App };