import React, { useState } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useTelegram } from '../contexts/TelegramContext';
import { firestoreService } from '../services/firestoreService';
import { ImgBBImageUploader } from '../components/common/ImgBBImageUploader';
import { PaymentSubmission, EventItem, TicketType } from '../types';
import {
  Building2, Calendar, Ticket, QrCode,
  CheckCircle2, XCircle, PlusCircle, Eye,
  Users, TrendingUp, AlertCircle, ChevronLeft,
  ExternalLink, Clock, MapPin, DollarSign
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

export const OrganizerDashboardView: React.FC<Props> = ({ onNavigate }) => {
  const {
    currentOrganization, orgEvents, pendingPayments,
    allTickets, refreshOrgData, approvePayment,
    rejectPayment, createNewEvent
  } = useOrganization();
  const { triggerHaptic, showAlert } = useTelegram();

  const [activeTab, setActiveTab] = useState<'events' | 'payments' | 'tickets' | 'analytics'>('events');
  const [selectedPayment, setSelectedPayment] = useState<PaymentSubmission | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showTicketTypeModal, setShowTicketTypeModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [eventForm, setEventForm] = useState({
    name: '', description: '', bannerUrl: '', logoUrl: '',
    date: '2026-11-15', startTime: '18:00', endTime: '23:00',
    venue: 'Millennium Hall', address: 'Bole Road, Addis Ababa',
    googleMapsUrl: '', contactPhone: '+251911234567'
  });
  const [ticketTypeForm, setTicketTypeForm] = useState({
    name: 'VIP Pass', description: 'VIP lounge access', price: 1500, totalQuantity: 100, maxPerCustomer: 5
  });

  if (!currentOrganization) {
    return (
      <div className="tg-page">
        <div className="tg-header">
          <button className="tg-header__back" onClick={() => onNavigate('landing')}>
            <ChevronLeft style={{ width: 20, height: 20 }} />
          </button>
          <span className="tg-header__title">Organizer</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--tg-radius)', background: 'rgba(245,166,35,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle style={{ width: 32, height: 32, color: 'var(--tg-amber)' }} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--tg-text)' }}>No Organization</div>
          <p style={{ fontSize: 14, color: 'var(--tg-hint)', lineHeight: 1.6, maxWidth: 280 }}>
            Register your company to start creating events and managing tickets.
          </p>
          <button className="tg-btn tg-btn--primary" style={{ maxWidth: 240 }} onClick={() => onNavigate('organizer_register')}>
            Register Organization
          </button>
        </div>
      </div>
    );
  }

  // Metrics
  const totalEvents = orgEvents.length;
  const activeEvents = orgEvents.filter((e) => e.status === 'published').length;
  const totalTicketsSold = orgEvents.reduce((s, e) => s + e.ticketsSold, 0);
  const totalRevenue = orgEvents.reduce((s, e) => s + e.revenue, 0);
  const checkedIn = allTickets.filter((t) => t.status === 'used').length;
  const attendanceRate = totalTicketsSold > 0 ? Math.round((checkedIn / totalTicketsSold) * 100) : 0;

  const handleApprovePayment = (p: PaymentSubmission) => {
    triggerHaptic('success');
    approvePayment(p.id);
    showAlert(`Payment approved! Ticket issued to ${p.customerName}.`);
    setSelectedPayment(null);
  };
  const handleRejectPayment = (p: PaymentSubmission) => {
    if (!rejectionReason.trim()) { alert('Please state the rejection reason.'); return; }
    triggerHaptic('error');
    rejectPayment(p.id, rejectionReason);
    showAlert(`Payment rejected for ${p.customerName}.`);
    setSelectedPayment(null);
    setRejectionReason('');
  };
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.bannerUrl) { alert('Please upload an event banner.'); return; }
    triggerHaptic('success');
    const newEvt = createNewEvent({
      organizationId: currentOrganization.id,
      organizationName: currentOrganization.name,
      ...eventForm, status: 'published', totalQuantity: 500
    });
    firestoreService.addTicketType({
      eventId: newEvt.id, organizationId: currentOrganization.id,
      name: 'Regular Admission', description: 'General entry pass',
      price: 500, currency: 'ETB', totalQuantity: 500, remainingQuantity: 500, maxPerCustomer: 10
    });
    setShowCreateEvent(false);
    showAlert(`Event "${newEvt.name}" published!`);
    refreshOrgData();
  };
  const handleAddTicketType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTicketTypeModal) return;
    triggerHaptic('success');
    firestoreService.addTicketType({
      eventId: showTicketTypeModal, organizationId: currentOrganization.id,
      name: ticketTypeForm.name, description: ticketTypeForm.description,
      price: Number(ticketTypeForm.price), currency: 'ETB',
      totalQuantity: Number(ticketTypeForm.totalQuantity),
      remainingQuantity: Number(ticketTypeForm.totalQuantity),
      maxPerCustomer: Number(ticketTypeForm.maxPerCustomer)
    });
    setShowTicketTypeModal(null);
    showAlert('Ticket type added!');
    refreshOrgData();
  };

  return (
    <div className="tg-page">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="tg-header">
        <button className="tg-header__back" onClick={() => onNavigate('landing')}>
          <ChevronLeft style={{ width: 20, height: 20 }} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="tg-header__title" style={{ fontSize: 16 }}>{currentOrganization.name}</div>
        </div>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--tg-accent)', color: '#fff', border: 'none', borderRadius: 'var(--tg-radius-sm)', padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setShowCreateEvent(true)}
        >
          <PlusCircle style={{ width: 15, height: 15 }} /> New Event
        </button>
      </div>

      <div className="tg-content">

        {/* ── Org Status Banner ────────────────────────────────────────── */}
        <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 'var(--tg-radius-sm)', background: 'rgba(36,129,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 style={{ width: 22, height: 22, color: 'var(--tg-accent)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{currentOrganization.name}</div>
              <div style={{ fontSize: 12, color: 'var(--tg-hint)' }}>{currentOrganization.city}</div>
            </div>
          </div>
          <span className={`tg-pill ${currentOrganization.status === 'approved' ? 'tg-pill--green' : 'tg-pill--amber'}`}>
            {currentOrganization.status}
          </span>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          <div className="tg-stat">
            <span className="tg-stat__label">Events</span>
            <span className="tg-stat__value">{totalEvents}</span>
            <span className="tg-stat__sub" style={{ color: 'var(--tg-accent)' }}>{activeEvents} live</span>
          </div>
          <div className="tg-stat">
            <span className="tg-stat__label">Tickets</span>
            <span className="tg-stat__value">{totalTicketsSold}</span>
            <span className="tg-stat__sub" style={{ color: pendingPayments.length > 0 ? 'var(--tg-amber)' : 'var(--tg-hint)' }}>
              {pendingPayments.length} pending
            </span>
          </div>
          <div className="tg-stat">
            <span className="tg-stat__label">Revenue</span>
            <span className="tg-stat__value" style={{ fontSize: 16 }}>{(totalRevenue / 1000).toFixed(1)}K</span>
            <span className="tg-stat__sub">ETB</span>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="tg-tabs" style={{ padding: '0 0 12px' }}>
          {([ 
            { key: 'events' as const, label: `Events (${orgEvents.length})`, count: 0 },
            { key: 'payments' as const, label: 'Payments', count: pendingPayments.length },
            { key: 'tickets' as const, label: `Tickets (${allTickets.length})`, count: 0 },
            { key: 'analytics' as const, label: 'Analytics', count: 0 },
          ]).map(({ key, label, count }) => (
            <button key={key} className={`tg-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
              {label}
              {count > 0 && <span style={{ background: 'var(--tg-red)', color: '#fff', borderRadius: 99, padding: '1px 5px', fontSize: 10, marginLeft: 5 }}>{count}</span>}
            </button>
          ))}
        </div>

        {/* ── Events Tab ──────────────────────────────────────────────── */}
        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orgEvents.length === 0 ? (
              <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '40px 20px', textAlign: 'center' }}>
                <Calendar style={{ width: 44, height: 44, color: 'var(--tg-hint)', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--tg-text)' }}>No Events Yet</div>
                <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginTop: 6, marginBottom: 20 }}>Create your first event to start selling tickets.</div>
                <button className="tg-btn tg-btn--primary" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => setShowCreateEvent(true)}>
                  <PlusCircle style={{ width: 16, height: 16 }} /> Create Event
                </button>
              </div>
            ) : orgEvents.map((evt) => {
              const evtTicketTypes = firestoreService.getTicketTypes(evt.id);
              return (
                <div key={evt.id} style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', overflow: 'hidden' }}>
                  {/* Event header */}
                  <div style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)', alignItems: 'center' }}>
                    {evt.bannerUrl ? (
                      <img src={evt.bannerUrl} alt={evt.name} style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 56, height: 42, background: 'var(--tg-surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Calendar style={{ width: 20, height: 20, color: 'var(--tg-hint)' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--tg-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginTop: 2 }}>{evt.date} · {evt.venue}</div>
                    </div>
                    <span className={`tg-pill ${evt.status === 'published' ? 'tg-pill--green' : 'tg-pill--amber'}`}>{evt.status}</span>
                  </div>
                  {/* Ticket types */}
                  <div style={{ padding: '10px 16px' }}>
                    <div style={{ fontSize: 11, color: 'var(--tg-hint)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Ticket Types</div>
                    {evtTicketTypes.length === 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginBottom: 8 }}>No ticket types yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {evtTicketTypes.map((tt) => (
                          <div key={tt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--tg-surface)', borderRadius: 'var(--tg-radius-sm)' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tg-text)' }}>{tt.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--tg-hint)', marginTop: 1 }}>{tt.remainingQuantity}/{tt.totalQuantity} remaining</div>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--tg-green)' }}>{tt.price} ETB</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="tg-btn tg-btn--secondary tg-btn--sm"
                        style={{ flex: 1 }}
                        onClick={() => onNavigate('public_event', { eventId: evt.id })}
                      >
                        <ExternalLink style={{ width: 14, height: 14 }} /> Public Page
                      </button>
                      <button
                        className="tg-btn tg-btn--primary tg-btn--sm"
                        style={{ flex: 1 }}
                        onClick={() => setShowTicketTypeModal(evt.id)}
                      >
                        <PlusCircle style={{ width: 14, height: 14 }} /> Add Ticket Type
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Payments Tab ─────────────────────────────────────────────── */}
        {activeTab === 'payments' && (
          <div>
            {pendingPayments.length === 0 ? (
              <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '40px 20px', textAlign: 'center' }}>
                <CheckCircle2 style={{ width: 44, height: 44, color: 'var(--tg-green)', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--tg-text)' }}>All Reviewed</div>
                <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginTop: 6 }}>No pending payment submissions.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingPayments.map((p) => (
                  <div key={p.id} style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--tg-text)' }}>{p.customerName}</div>
                        <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginTop: 1 }}>{p.customerPhone}</div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--tg-green)', background: 'rgba(77,205,94,0.1)', padding: '4px 12px', borderRadius: 99 }}>{p.amount} ETB</span>
                    </div>
                    <div style={{ padding: '10px 16px', fontSize: 13, color: 'var(--tg-hint)' }}>
                      <div style={{ marginBottom: 4 }}><strong style={{ color: 'var(--tg-text)' }}>Event:</strong> {p.eventName}</div>
                      <div><strong style={{ color: 'var(--tg-text)' }}>Method:</strong> {p.paymentMethod}</div>
                    </div>
                    {p.screenshotUrl && (
                      <div style={{ padding: '0 16px 10px' }}>
                        <a href={p.screenshotUrl} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: 'var(--tg-radius)', overflow: 'hidden', height: 120, position: 'relative' }}>
                          <img src={p.screenshotUrl} alt="Payment receipt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 600 }}>
                            <Eye style={{ width: 16, height: 16 }} /> View Receipt
                          </div>
                        </a>
                      </div>
                    )}
                    <div style={{ padding: '10px 16px 14px', display: 'flex', gap: 10, borderTop: '1px solid var(--tg-divider)' }}>
                      <button className="tg-btn tg-btn--success tg-btn--sm" style={{ flex: 1 }} onClick={() => handleApprovePayment(p)}>
                        <CheckCircle2 style={{ width: 15, height: 15 }} /> Approve & Issue
                      </button>
                      <button className="tg-btn tg-btn--danger tg-btn--sm" style={{ flex: 1 }} onClick={() => setSelectedPayment(p)}>
                        <XCircle style={{ width: 15, height: 15 }} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tickets Tab ──────────────────────────────────────────────── */}
        {activeTab === 'tickets' && (
          <div className="tg-section">
            {allTickets.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--tg-hint)', fontSize: 14 }}>No tickets issued yet</div>
            ) : allTickets.map((t) => (
              <div key={t.id} className="tg-cell" style={{ cursor: 'default' }}>
                <div style={{ width: 42, height: 42, borderRadius: 'var(--tg-radius-sm)', background: t.status === 'used' ? 'rgba(155,89,182,0.12)' : 'rgba(77,205,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ticket style={{ width: 20, height: 20, color: t.status === 'used' ? 'var(--tg-purple)' : 'var(--tg-green)' }} />
                </div>
                <div className="tg-cell__body">
                  <div className="tg-cell__title">{t.customerName}</div>
                  <div className="tg-cell__subtitle">{t.eventName} · {t.ticketTypeName}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--tg-green)' }}>{t.price} ETB</span>
                  <span className={`tg-pill ${t.status === 'used' ? 'tg-pill--purple' : 'tg-pill--green'}`}>
                    {t.status === 'used' ? 'Used' : 'Valid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Analytics Tab ────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontWeight: 600, fontSize: 15, color: 'var(--tg-text)' }}>
                <TrendingUp style={{ width: 18, height: 18, color: 'var(--tg-green)' }} /> Revenue by Event
              </div>
              {orgEvents.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--tg-hint)', textAlign: 'center', padding: '20px 0' }}>No data yet</div>
              ) : orgEvents.map((e) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--tg-divider)' }}>
                  <div style={{ fontSize: 14, color: 'var(--tg-text)', fontWeight: 500 }}>{e.name}</div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--tg-green)' }}>{e.revenue.toLocaleString()} ETB</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '16px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontWeight: 600, fontSize: 15, color: 'var(--tg-text)' }}>
                <Users style={{ width: 18, height: 18, color: 'var(--tg-accent)' }} /> Attendance Rate
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--tg-accent)', lineHeight: 1 }}>{attendanceRate}<span style={{ fontSize: 24 }}>%</span></div>
              <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginTop: 8 }}>{checkedIn} of {totalTicketsSold} tickets scanned</div>
            </div>
          </div>
        )}

        <div className="spacer-16" />
      </div>

      {/* ── Create Event Sheet ────────────────────────────────────────── */}
      {showCreateEvent && (
        <div className="tg-overlay" onClick={() => setShowCreateEvent(false)}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh' }}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span>Create Event</span>
              <button className="tg-sheet__close" onClick={() => setShowCreateEvent(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateEvent} style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="tg-label">Event Name *</label>
                <input className="tg-input" required value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} placeholder="e.g. Ethiopian Tech Night 2026" />
              </div>
              <div>
                <label className="tg-label">Description *</label>
                <textarea className="tg-input" rows={3} required value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Describe your event..." style={{ resize: 'none' }} />
              </div>
              <ImgBBImageUploader label="Event Banner *" value={eventForm.bannerUrl} onChange={(url) => setEventForm({ ...eventForm, bannerUrl: url })} placeholder="Upload event banner" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="tg-label">Date *</label>
                  <input className="tg-input" type="date" required value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
                </div>
                <div>
                  <label className="tg-label">Start Time *</label>
                  <input className="tg-input" type="time" required value={eventForm.startTime} onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="tg-label">Venue *</label>
                  <input className="tg-input" required value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} placeholder="Millennium Hall" />
                </div>
                <div>
                  <label className="tg-label">Contact Phone *</label>
                  <input className="tg-input" required value={eventForm.contactPhone} onChange={(e) => setEventForm({ ...eventForm, contactPhone: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="tg-btn tg-btn--primary">Publish Event</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Ticket Type Sheet ─────────────────────────────────────── */}
      {showTicketTypeModal && (
        <div className="tg-overlay" onClick={() => setShowTicketTypeModal(null)}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span>Add Ticket Type</span>
              <button className="tg-sheet__close" onClick={() => setShowTicketTypeModal(null)}>✕</button>
            </div>
            <form onSubmit={handleAddTicketType} style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="tg-label">Name *</label>
                <input className="tg-input" required value={ticketTypeForm.name} onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, name: e.target.value })} placeholder="VIP, Regular, Student..." />
              </div>
              <div>
                <label className="tg-label">Price (ETB) *</label>
                <input className="tg-input" type="number" required value={ticketTypeForm.price} onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, price: Number(e.target.value) })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="tg-label">Quantity *</label>
                  <input className="tg-input" type="number" required value={ticketTypeForm.totalQuantity} onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, totalQuantity: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="tg-label">Max/Customer</label>
                  <input className="tg-input" type="number" required value={ticketTypeForm.maxPerCustomer} onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, maxPerCustomer: Number(e.target.value) })} />
                </div>
              </div>
              <button type="submit" className="tg-btn tg-btn--primary">Save Ticket Type</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Reject Payment Sheet ──────────────────────────────────────── */}
      {selectedPayment && (
        <div className="tg-overlay" onClick={() => setSelectedPayment(null)}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span style={{ color: 'var(--tg-red)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle style={{ width: 18, height: 18 }} /> Reject Payment
              </span>
              <button className="tg-sheet__close" onClick={() => setSelectedPayment(null)}>✕</button>
            </div>
            <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 14, color: 'var(--tg-hint)', lineHeight: 1.6, margin: 0 }}>
                Rejecting {selectedPayment.amount} ETB payment from {selectedPayment.customerName}.
              </p>
              <div>
                <label className="tg-label">Rejection Reason *</label>
                <textarea className="tg-input" rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g. Payment amount doesn't match..." style={{ resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="tg-btn tg-btn--secondary" style={{ flex: 1 }} onClick={() => setSelectedPayment(null)}>Cancel</button>
                <button className="tg-btn tg-btn--danger" style={{ flex: 1 }} onClick={() => handleRejectPayment(selectedPayment)}>Confirm Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
