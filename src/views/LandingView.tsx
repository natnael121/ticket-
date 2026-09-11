import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTelegram } from '../contexts/TelegramContext';
import { mockDataService } from '../services/mockDataService';
import {
  Ticket, Building2, QrCode, ShieldCheck, Calendar,
  ChevronRight, Users, Send, UserCheck, MapPin, Clock
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const { user, role, telegramAuth, switchUserRole } = useAuth();
  const { tgUser, triggerHaptic } = useTelegram();
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [manualUsername, setManualUsername] = useState('');

  const publishedEvents = mockDataService.getState().events.filter((e) => e.status === 'published');

  const handleTelegramAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUsername.trim()) return;
    triggerHaptic('success');
    telegramAuth({
      id: Date.now(),
      first_name: manualUsername.replace('@', ''),
      username: manualUsername.replace('@', ''),
      role: 'customer'
    });
    setShowLoginSheet(false);
  };

  return (
    <div className="tg-page">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="tg-header">
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--tg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ticket style={{ width: 18, height: 18, color: '#fff' }} />
        </div>
        <span className="tg-header__title">TicketEt</span>
        {user && (
          <div className="tg-avatar" style={{ width: 34, height: 34, fontSize: 14 }}>
            {user.fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="tg-content">

        {/* ── User Identity / Login Card ─────────────────────────────── */}
        {user ? (
          <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="tg-avatar" style={{ width: 52, height: 52, fontSize: 20, background: 'var(--tg-accent)' }}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--tg-text)' }}>{user.fullName}</div>
              <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginTop: 1 }}>
                {user.telegramUsername ? `@${user.telegramUsername}` : 'Telegram Account'}
              </div>
            </div>
            <span className={`tg-pill ${role === 'super_admin' ? 'tg-pill--purple' : role === 'organizer' ? 'tg-pill--blue' : 'tg-pill--green'}`}>
              {role.replace('_', ' ')}
            </span>
          </div>
        ) : (
          <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '20px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(36,129,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send style={{ width: 20, height: 20, color: 'var(--tg-accent)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--tg-text)' }}>Welcome to TicketEt</div>
                <div style={{ fontSize: 13, color: 'var(--tg-hint)' }}>Event Ticketing on Telegram</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--tg-hint)', marginBottom: 14, lineHeight: 1.5 }}>
              Log in with your Telegram account to buy tickets and access your digital ticket wallet.
            </p>
            <button
              className="tg-btn tg-btn--primary"
              onClick={() => { tgUser ? telegramAuth() : setShowLoginSheet(true); }}
            >
              <Send style={{ width: 18, height: 18 }} />
              Continue with Telegram
            </button>
          </div>
        )}

        {/* ── Quick Access Section ───────────────────────────────────── */}
        <div className="tg-section__header">Quick Access</div>
        <div className="tg-section">
          <div className="tg-cell" onClick={() => { triggerHaptic('impact'); onNavigate('organizer_register'); }}>
            <div className="tg-cell__icon" style={{ background: 'rgba(36,129,204,0.15)' }}>
              <Building2 style={{ width: 22, height: 22, color: 'var(--tg-accent)' }} />
            </div>
            <div className="tg-cell__body">
              <div className="tg-cell__title">Register as Organizer</div>
              <div className="tg-cell__subtitle">Submit company application</div>
            </div>
            <ChevronRight className="tg-cell__arrow" style={{ width: 17, height: 17 }} />
          </div>

          <div className="tg-cell" onClick={() => { triggerHaptic('impact'); if (role !== 'organizer') switchUserRole('organizer'); onNavigate('organizer_dashboard'); }}>
            <div className="tg-cell__icon" style={{ background: 'rgba(77,205,94,0.15)' }}>
              <Users style={{ width: 22, height: 22, color: 'var(--tg-green)' }} />
            </div>
            <div className="tg-cell__body">
              <div className="tg-cell__title">Organizer Dashboard</div>
              <div className="tg-cell__subtitle">Manage events & payments</div>
            </div>
            <ChevronRight className="tg-cell__arrow" style={{ width: 17, height: 17 }} />
          </div>

          <div className="tg-cell" onClick={() => { triggerHaptic('impact'); onNavigate('my_tickets'); }}>
            <div className="tg-cell__icon" style={{ background: 'rgba(245,166,35,0.15)' }}>
              <Ticket style={{ width: 22, height: 22, color: 'var(--tg-amber)' }} />
            </div>
            <div className="tg-cell__body">
              <div className="tg-cell__title">My Tickets</div>
              <div className="tg-cell__subtitle">View active QR passes</div>
            </div>
            <ChevronRight className="tg-cell__arrow" style={{ width: 17, height: 17 }} />
          </div>

          <div className="tg-cell" onClick={() => { triggerHaptic('impact'); if (role !== 'staff') switchUserRole('staff'); onNavigate('scanner'); }}>
            <div className="tg-cell__icon" style={{ background: 'rgba(155,89,182,0.15)' }}>
              <QrCode style={{ width: 22, height: 22, color: 'var(--tg-purple)' }} />
            </div>
            <div className="tg-cell__body">
              <div className="tg-cell__title">Scan Ticket</div>
              <div className="tg-cell__subtitle">Entrance QR check-in</div>
            </div>
            <ChevronRight className="tg-cell__arrow" style={{ width: 17, height: 17 }} />
          </div>

          <div className="tg-cell" onClick={() => { triggerHaptic('impact'); switchUserRole('super_admin'); onNavigate('super_admin_dashboard'); }}>
            <div className="tg-cell__icon" style={{ background: 'rgba(155,89,182,0.15)' }}>
              <ShieldCheck style={{ width: 22, height: 22, color: 'var(--tg-purple)' }} />
            </div>
            <div className="tg-cell__body">
              <div className="tg-cell__title">Super Admin Panel</div>
              <div className="tg-cell__subtitle">Approve organizations & review platform</div>
            </div>
            <ChevronRight className="tg-cell__arrow" style={{ width: 17, height: 17 }} />
          </div>
        </div>

        <div className="spacer-8" />

        {/* ── Events Feed ────────────────────────────────────────────── */}
        <div className="tg-section__header">
          Events ({publishedEvents.length})
        </div>

        {publishedEvents.length === 0 ? (
          <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--tg-radius)', background: 'rgba(36,129,204,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Calendar style={{ width: 28, height: 28, color: 'var(--tg-accent)' }} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--tg-text)', marginBottom: 8 }}>No Events Yet</div>
            <p style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.5, marginBottom: 20 }}>
              Register your organization and create the first event on the platform.
            </p>
            <button className="tg-btn tg-btn--primary" style={{ maxWidth: 220, margin: '0 auto' }} onClick={() => onNavigate('organizer_register')}>
              Register & Create Event
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {publishedEvents.map((evt) => (
              <div
                key={evt.id}
                className="tg-event-card"
                onClick={() => onNavigate('public_event', { eventId: evt.id })}
              >
                {evt.bannerUrl && (
                  <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                    <img src={evt.bannerUrl} alt={evt.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(23,33,43,0.95) 0%, transparent 60%)' }} />
                    <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                      <span className="tg-pill tg-pill--blue" style={{ marginBottom: 6 }}>{evt.organizationName}</span>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', lineHeight: 1.2 }}>{evt.name}</div>
                    </div>
                  </div>
                )}
                <div style={{ padding: '10px 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--tg-hint)' }}>
                      <Calendar style={{ width: 13, height: 13 }} /> {evt.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--tg-hint)' }}>
                      <MapPin style={{ width: 13, height: 13 }} /> {evt.venue}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tg-accent)', display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                    Get Tickets <ChevronRight style={{ width: 15, height: 15 }} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="spacer-16" />
      </div>

      {/* ── Telegram Login Bottom Sheet ────────────────────────────── */}
      {showLoginSheet && (
        <div className="tg-overlay" onClick={() => setShowLoginSheet(false)}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Send style={{ width: 18, height: 18, color: 'var(--tg-accent)' }} />
                Telegram Login
              </span>
              <button className="tg-sheet__close" onClick={() => setShowLoginSheet(false)}>✕</button>
            </div>

            <div style={{ padding: '12px 16px 0' }}>
              <p style={{ fontSize: 14, color: 'var(--tg-hint)', marginBottom: 20, lineHeight: 1.6 }}>
                Enter your Telegram username or display name to authenticate your session.
              </p>

              <form onSubmit={handleTelegramAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="tg-label">Telegram Username</label>
                  <input
                    className="tg-input"
                    type="text"
                    required
                    value={manualUsername}
                    onChange={(e) => setManualUsername(e.target.value)}
                    placeholder="@your_username"
                    autoFocus
                  />
                </div>
                <button type="submit" className="tg-btn tg-btn--primary">
                  <UserCheck style={{ width: 18, height: 18 }} />
                  Authenticate
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
