'use client';

import { AppProvider, useAppContext } from '@/context/AppContext';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import OnboardingWizard from '@/components/OnboardingWizard';

function AppShell({ children }: { children: React.ReactNode }) {
  const { isFirstLaunch } = useAppContext();

  if (isFirstLaunch) {
    return <OnboardingWizard />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
