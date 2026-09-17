import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTelegram } from '../contexts/TelegramContext';
import { firestoreService } from '../services/firestoreService';
import { EVENT_CATEGORIES, EventCategory } from '../types';
import {
  Ticket, Building2, ShieldCheck, Calendar,
  ChevronRight, Send, UserCheck, MapPin, Search, X, Sparkles, Filter
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const { user, role, isSuperAdmin, telegramAuth, switchUserRole } = useAuth();
  const { tgUser, triggerHaptic } = useTelegram();
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [manualUsername, setManualUsername] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [, setTick] = useState(0);

  useEffect(() => {
    return firestoreService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const allPublishedEvents = firestoreService.getState().events.filter((e) => e.status === 'published');

  // Detect if current user already has an organization
  const userOrg = user?.organizationId
    ? firestoreService.getOrganization(user.organizationId) || null
    : null;

  // Compute category event counts
  const categoryCounts: Record<string, number> = {
    all: allPublishedEvents.length
  };
  EVENT_CATEGORIES.forEach((cat) => {
    if (cat.id !== 'all') {
      categoryCounts[cat.id] = allPublishedEvents.filter((e) => (e.category || 'general') === cat.id).length;
    }
  });

  // Filter events by selected category and search query
  const filteredEvents = allPublishedEvents.filter((evt) => {
    const matchesCategory =
      selectedCategory === 'all' || (evt.category || 'general') === selectedCategory;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      evt.name.toLowerCase().includes(query) ||
      evt.venue.toLowerCase().includes(query) ||
      (evt.organizationName || '').toLowerCase().includes(query) ||
      (evt.description || '').toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const handleTelegramAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUsername.trim()) return;
    triggerHaptic('success');
    const cleaned = manualUsername.trim().replace(/^@/, '');
    const isNum = /^\d+$/.test(cleaned);
    telegramAuth({
      id: isNum ? Number(cleaned) : Date.now(),
      first_name: cleaned,
      username: cleaned,
      role: 'customer'
    });
    setShowLoginSheet(false);
  };

  const getCategoryInfo = (catId?: string): EventCategory => {
    const found = EVENT_CATEGORIES.find((c) => c.id === (catId || 'general'));
    return found || EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1];
  };

  // Compute starting price for an event
  const getStartingPrice = (eventId: string) => {
    const ticketTypes = firestoreService.getTicketTypes(eventId);
    if (ticketTypes.length === 0) return null;
    const prices = ticketTypes.map((t) => t.price);
    const minPrice = Math.min(...prices);
    return minPrice === 0 ? 'FREE' : `From ${minPrice.toLocaleString()} ETB`;
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
          {/* My Tickets Wallet */}
          <div className="tg-cell" onClick={() => { triggerHaptic('impact'); onNavigate('my_tickets'); }}>
            <div className="tg-cell__icon" style={{ background: 'rgba(245,166,35,0.15)' }}>
              <Ticket style={{ width: 22, height: 22, color: 'var(--tg-amber)' }} />
            </div>
            <div className="tg-cell__body">
              <div className="tg-cell__title">My Tickets</div>
              <div className="tg-cell__subtitle">View active QR passes & receipts</div>
            </div>
            <ChevronRight className="tg-cell__arrow" style={{ width: 17, height: 17 }} />
          </div>

          {/* Organizer Dashboard — ONLY show if user has an approved organization */}
          {userOrg?.status === 'approved' && (
            <div className="tg-cell" onClick={() => { triggerHaptic('impact'); switchUserRole('organizer', userOrg.id); onNavigate('organizer_dashboard'); }}>
              <div className="tg-cell__icon" style={{ background: 'rgba(77,205,94,0.15)' }}>
                <Building2 style={{ width: 22, height: 22, color: 'var(--tg-green)' }} />
              </div>
              <div className="tg-cell__body">
                <div className="tg-cell__title">Organizer Dashboard</div>
                <div className="tg-cell__subtitle">{userOrg.name} · Manage events & tickets</div>
              </div>
              <ChevronRight className="tg-cell__arrow" style={{ width: 17, height: 17 }} />
            </div>
          )}

          {/* Pending / Rejected Org Application Status */}
          {userOrg && userOrg.status === 'pending' && (
            <div className="tg-cell" onClick={() => { triggerHaptic('impact'); onNavigate('organizer_register'); }}>
              <div className="tg-cell__icon" style={{ background: 'rgba(245,166,35,0.15)' }}>
                <Building2 style={{ width: 22, height: 22, color: 'var(--tg-amber)' }} />
              </div>
              <div className="tg-cell__body">
                <div className="tg-cell__title">{userOrg.name}</div>
                <div className="tg-cell__subtitle">⏳ Application Pending Admin Approval</div>
              </div>
              <span className="tg-pill tg-pill--amber" style={{ fontSize: 10 }}>Pending</span>
            </div>
          )}

          {/* Super Admin Panel - ONLY visible to Super Admins */}
          {isSuperAdmin && (
            <div
              className="tg-cell"
              onClick={() => {
                triggerHaptic('impact');
                onNavigate('super_admin_dashboard');
              }}
            >
              <div className="tg-cell__icon" style={{ background: 'rgba(155,89,182,0.15)' }}>
                <ShieldCheck style={{ width: 22, height: 22, color: 'var(--tg-purple)' }} />
              </div>
              <div className="tg-cell__body">
                <div className="tg-cell__title">Super Admin Panel</div>
                <div className="tg-cell__subtitle">Approve organizations & platform settings</div>
              </div>
              <ChevronRight className="tg-cell__arrow" style={{ width: 17, height: 17 }} />
            </div>
          )}
        </div>

        <div className="spacer-8" />

        {/* ── Search & Categories Header ────────────────────────────── */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="tg-section__header" style={{ marginBottom: 0 }}>
              Available Tickets ({filteredEvents.length})
            </span>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search style={{ position: 'absolute', left: 12, top: 12, width: 16, height: 16, color: 'var(--tg-hint)' }} />
            <input
              type="text"
              className="tg-input"
              style={{ paddingLeft: 36, paddingRight: searchQuery ? 36 : 14, fontSize: 13, height: 40 }}
              placeholder="Search by event name, venue, organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: 'var(--tg-hint)', cursor: 'pointer', padding: 2 }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>

          {/* Category Filter Pills (Scrollable Bar) */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {EVENT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('impact');
                    setSelectedCategory(cat.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isSelected ? `1.5px solid ${cat.color}` : '1px solid var(--tg-divider)',
                    background: isSelected ? cat.bg : 'var(--tg-bg)',
                    color: isSelected ? cat.color : 'var(--tg-text2)'
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 99,
                      background: isSelected ? cat.color : 'rgba(255,255,255,0.08)',
                      color: isSelected ? '#fff' : 'var(--tg-hint)'
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Events Grid / List ──────────────────────────────────────── */}
        {filteredEvents.length === 0 ? (
          <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--tg-radius)', background: 'rgba(36,129,204,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Calendar style={{ width: 28, height: 28, color: 'var(--tg-accent)' }} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--tg-text)', marginBottom: 8 }}>
              {searchQuery || selectedCategory !== 'all' ? 'No Matching Events Found' : 'No Events Available Yet'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.5, marginBottom: 20 }}>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try clearing your search query or selecting a different event category.'
                : 'Register your organization to publish the first event on the platform.'}
            </p>
            {searchQuery || selectedCategory !== 'all' ? (
              <button
                className="tg-btn tg-btn--secondary"
                style={{ maxWidth: 200, margin: '0 auto' }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </button>
            ) : (
              <button className="tg-btn tg-btn--primary" style={{ maxWidth: 220, margin: '0 auto' }} onClick={() => onNavigate('organizer_register')}>
                Register & Create Event
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredEvents.map((evt) => {
              const catInfo = getCategoryInfo(evt.category);
              const priceText = getStartingPrice(evt.id);

              return (
                <div
                  key={evt.id}
                  className="tg-event-card"
                  onClick={() => onNavigate('public_event', { eventId: evt.id })}
                  style={{
                    background: 'var(--tg-bg)',
                    borderRadius: 'var(--tg-radius-lg)',
                    overflow: 'hidden',
                    border: '1px solid var(--tg-divider)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  {evt.bannerUrl && (
                    <div style={{ height: 165, overflow: 'hidden', position: 'relative' }}>
                      <img src={evt.bannerUrl} alt={evt.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,22,33,0.95) 0%, rgba(14,22,33,0.2) 60%, transparent 100%)' }} />

                      {/* Top Badges: Category & Organizer */}
                      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: catInfo.bg,
                            color: catInfo.color,
                            border: `1px solid ${catInfo.color}`,
                            padding: '3px 10px',
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            backdropFilter: 'blur(8px)'
                          }}
                        >
                          {catInfo.icon} {catInfo.name}
                        </span>

                        <span
                          style={{
                            background: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            padding: '3px 10px',
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 600,
                            backdropFilter: 'blur(8px)'
                          }}
                        >
                          {evt.organizationName}
                        </span>
                      </div>

                      {/* Event Title */}
                      <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', lineHeight: 1.25, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                          {evt.name}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '12px 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--tg-hint)' }}>
                        <Calendar style={{ width: 14, height: 14, color: 'var(--tg-accent)' }} /> {evt.date} · {evt.startTime}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--tg-hint)' }}>
                        <MapPin style={{ width: 14, height: 14, color: 'var(--tg-red)' }} /> {evt.venue}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      {priceText && (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: priceText === 'FREE' ? 'var(--tg-green)' : 'var(--tg-text)',
                            fontFamily: 'monospace'
                          }}
                        >
                          {priceText}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--tg-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          background: 'rgba(36,129,204,0.12)',
                          padding: '4px 10px',
                          borderRadius: 'var(--tg-radius-sm)'
                        }}
                      >
                        Buy Ticket <ChevronRight style={{ width: 14, height: 14 }} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Organizer Registration Footer Link (subtle) ─────────────── */}
        {!userOrg && (
          <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
            <button
              onClick={() => { triggerHaptic('impact'); onNavigate('organizer_register'); }}
              style={{ background: 'none', border: 'none', color: 'var(--tg-hint)', fontSize: 13, textDecoration: 'underline', cursor: 'pointer' }}
            >
              Are you an event organizer? Register here →
            </button>
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
                  <label className="tg-label">Telegram Username or User ID</label>
                  <input
                    className="tg-input"
                    type="text"
                    required
                    value={manualUsername}
                    onChange={(e) => setManualUsername(e.target.value)}
                    placeholder="e.g. 123456789 or @username"
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
