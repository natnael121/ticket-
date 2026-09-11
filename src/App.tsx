import React, { useState } from 'react';
import { TelegramProvider } from './contexts/TelegramContext';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { LandingView } from './views/LandingView';
import { OrganizerRegistrationView } from './views/OrganizerRegistrationView';
import { SuperAdminDashboardView } from './views/SuperAdminDashboardView';
import { OrganizerDashboardView } from './views/OrganizerDashboardView';
import { PublicEventView } from './views/PublicEventView';
import { MyTicketsView } from './views/MyTicketsView';
import { ScannerView } from './views/ScannerView';

export function AppContent() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewParams, setViewParams] = useState<Record<string, string>>({});

  const handleNavigate = (view: string, params?: Record<string, string>) => {
    setCurrentView(view);
    if (params) setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--tg-bg2)', color: 'var(--tg-text)' }}>
      <main>
        {currentView === 'landing' && <LandingView onNavigate={handleNavigate} />}
        {currentView === 'organizer_register' && <OrganizerRegistrationView onNavigate={handleNavigate} />}
        {currentView === 'organizer_login' && <OrganizerDashboardView onNavigate={handleNavigate} />}
        {currentView === 'organizer_dashboard' && <OrganizerDashboardView onNavigate={handleNavigate} />}
        {currentView === 'super_admin_dashboard' && <SuperAdminDashboardView onNavigate={handleNavigate} />}
        {currentView === 'public_event' && (
          <PublicEventView eventId={viewParams.eventId || ''} onNavigate={handleNavigate} />
        )}
        {currentView === 'my_tickets' && <MyTicketsView onNavigate={handleNavigate} />}
        {currentView === 'scanner' && <ScannerView onNavigate={handleNavigate} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TelegramProvider>
      <AuthProvider>
        <OrganizationProvider>
          <AppContent />
        </OrganizationProvider>
      </AuthProvider>
    </TelegramProvider>
  );
}
