import * as React from 'react';
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
        return <OrchestrationView />;
      case 'interaction':
        return <InteractionView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OrchestrationView />;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-hidden">{renderView()}</main>
      </div>
    </TooltipProvider>
  );
}

export { App };