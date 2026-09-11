import React, { useState } from 'react';
import { mockDataService } from '../services/mockDataService';
import { useAuth } from '../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, MapPin, ChevronLeft } from 'lucide-react';

interface Props {
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

export const MyTicketsView: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'valid' | 'used'>('all');

  const customerTickets = mockDataService.getCustomerTickets(user?.phone || user?.email);
  const filteredTickets = customerTickets.filter((t) => {
    if (filter === 'valid') return t.status === 'valid';
    if (filter === 'used') return t.status === 'used';
    return true;
  });

  return (
    <div className="tg-page">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="tg-header">
        <button className="tg-header__back" onClick={() => onNavigate('landing')}>
          <ChevronLeft style={{ width: 20, height: 20 }} />
        </button>
        <span className="tg-header__title">My Tickets</span>
        <span className="tg-pill tg-pill--amber">{customerTickets.length} Passes</span>
      </div>

      <div className="tg-content">
        {/* ── Filter Tabs ──────────────────────────────────────────── */}
        <div className="tg-tabs" style={{ padding: '0 0 12px' }}>
          {(['all', 'valid', 'used'] as const).map((f) => (
            <button key={f} className={`tg-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${customerTickets.length})` : f === 'valid' ? 'Valid' : 'Used'}
            </button>
          ))}
        </div>

        {/* ── Ticket List ──────────────────────────────────────────── */}
        {filteredTickets.length === 0 ? (
          <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 'var(--tg-radius)', background: 'rgba(245,166,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Ticket style={{ width: 30, height: 30, color: 'var(--tg-amber)' }} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--tg-text)' }}>No Tickets Found</div>
            <p style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.6, marginTop: 8, marginBottom: 20 }}>
              Browse events and buy tickets to see them here.
            </p>
            <button className="tg-btn tg-btn--primary" style={{ maxWidth: 180, margin: '0 auto' }} onClick={() => onNavigate('landing')}>
              Browse Events
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'var(--tg-bg)',
                  borderRadius: 'var(--tg-radius-lg)',
                  overflow: 'hidden',
                  border: t.status === 'valid' ? '1.5px solid rgba(77,205,94,0.3)' : '1.5px solid var(--tg-divider)',
                  opacity: t.status === 'used' ? 0.7 : 1
                }}
              >
                {/* Ticket Top: Event Info */}
                <div style={{ padding: '16px', borderBottom: '2px dashed var(--tg-divider)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                    <div>
                      <span className={`tg-pill ${t.status === 'valid' ? 'tg-pill--green' : 'tg-pill--purple'}`}>
                        {t.status === 'valid' ? '✓ Valid Ticket' : '✓ Used'}
                      </span>
                    </div>
                    {t.organizationName && (
                      <span className="tg-pill tg-pill--blue">{t.organizationName}</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--tg-text)', lineHeight: 1.3, marginBottom: 4 }}>
                    {t.eventName}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--tg-accent)', fontWeight: 500 }}>{t.ticketTypeName}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Calendar style={{ width: 14, height: 14, color: 'var(--tg-hint)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--tg-hint)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date & Time</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tg-text)' }}>{t.eventDate}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <MapPin style={{ width: 14, height: 14, color: 'var(--tg-hint)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--tg-hint)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Venue</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tg-text)' }}>{t.venue}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Bottom: QR Code */}
                <div style={{ background: 'var(--tg-bg2)', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ padding: 12, background: '#fff', borderRadius: 12 }}>
                    <QRCodeSVG value={t.qrData || t.id} size={148} level="H" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--tg-hint)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Ticket ID</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--tg-amber)', background: 'rgba(245,166,35,0.08)', padding: '4px 12px', borderRadius: 6 }}>
                      {t.id}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--tg-hint)' }}>
                    <span>Holder: <strong style={{ color: 'var(--tg-text)' }}>{t.customerName}</strong></span>
                    <span>Price: <strong style={{ color: 'var(--tg-green)' }}>{t.price} ETB</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="spacer-16" />
      </div>
    </div>
  );
};
