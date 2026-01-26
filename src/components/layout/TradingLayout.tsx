import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TradingSidebar } from './TradingSidebar';

interface TradingLayoutProps {
  children: ReactNode;
}

export function TradingLayout({ children }: TradingLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <TradingSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {/* Global sidebar trigger in top-left */}
            <div className="sticky top-0 z-50 p-2 bg-background/80 backdrop-blur-sm border-b border-border">
              <SidebarTrigger className="h-8 w-8" />
            </div>
            {children}
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
