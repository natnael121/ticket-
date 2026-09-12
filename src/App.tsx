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
  const [currentView, setCurrentView] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hash);
      const tgStartParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;

      const eventId =
        params.get('event') ||
        params.get('eventId') ||
        hashParams.get('event') ||
        hashParams.get('eventId') ||
        (tgStartParam?.startsWith('event_') ? tgStartParam.replace('event_', '') : tgStartParam?.startsWith('evt_') ? tgStartParam : null);

      if (eventId) return 'public_event';
      const viewParam = params.get('view') || hashParams.get('view');
      if (viewParam) return viewParam;
    } catch {}
    return 'landing';
  });

  const [viewParams, setViewParams] = useState<Record<string, string>>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hash);
      const tgStartParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;

      const eventId =
        params.get('event') ||
        params.get('eventId') ||
        hashParams.get('event') ||
        hashParams.get('eventId') ||
        (tgStartParam?.startsWith('event_') ? tgStartParam.replace('event_', '') : tgStartParam?.startsWith('evt_') ? tgStartParam : null);

      if (eventId) return { eventId };
    } catch {}
    return {};
  });

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
