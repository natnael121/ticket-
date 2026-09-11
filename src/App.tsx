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
import { useAuth } from './contexts/AuthContext';
import { FirestoreStatusBanner } from './components/common/FirestoreStatusBanner';

export function AppContent() {
  const { isSuperAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewParams, setViewParams] = useState<Record<string, string>>({});

  const handleNavigate = (view: string, params?: Record<string, string>) => {
    setCurrentView(view);
    if (params) setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const knownViews = [
    'landing', 'organizer_register', 'organizer_login',
    'organizer_dashboard', 'super_admin_dashboard',
    'public_event', 'my_tickets', 'scanner'
  ];
  const safeView = knownViews.includes(currentView) ? currentView : 'landing';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--tg-bg2)', color: 'var(--tg-text)' }}>
      <FirestoreStatusBanner />
      <main>
        {(safeView === 'landing') && <LandingView onNavigate={handleNavigate} />}
        {safeView === 'organizer_register' && <OrganizerRegistrationView onNavigate={handleNavigate} />}
        {safeView === 'organizer_login' && <OrganizerDashboardView onNavigate={handleNavigate} />}
        {safeView === 'organizer_dashboard' && <OrganizerDashboardView onNavigate={handleNavigate} />}
        {safeView === 'super_admin_dashboard' && (
          isSuperAdmin
            ? <SuperAdminDashboardView onNavigate={handleNavigate} />
            : <LandingView onNavigate={handleNavigate} />
        )}
        {safeView === 'public_event' && (
          <PublicEventView eventId={viewParams.eventId || ''} onNavigate={handleNavigate} />
        )}
        {safeView === 'my_tickets' && <MyTicketsView onNavigate={handleNavigate} />}
        {safeView === 'scanner' && <ScannerView onNavigate={handleNavigate} />}
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
