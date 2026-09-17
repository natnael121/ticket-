import React, { useState, useEffect, useRef } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useTelegram } from '../contexts/TelegramContext';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { processTicketCheckIn, CheckInResult } from '../services/ticketService';
import { ImgBBImageUploader } from '../components/common/ImgBBImageUploader';
import { PaymentSubmission, EventItem, TicketType, EVENT_CATEGORIES } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  Building2, Calendar, Ticket, QrCode,
  CheckCircle2, XCircle, PlusCircle, Eye,
  Users, TrendingUp, AlertCircle, ChevronLeft,
  ExternalLink, Clock, MapPin, DollarSign,
  Share2, Copy, Check, Send, Search, Camera,
  AlertTriangle
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
  const { user } = useAuth();
  const { triggerHaptic, showAlert } = useTelegram();

  const [activeTab, setActiveTab] = useState<'events' | 'payments' | 'scanner' | 'tickets' | 'analytics'>('events');
  const [selectedPayment, setSelectedPayment] = useState<PaymentSubmission | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showTicketTypeModal, setShowTicketTypeModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Share Event / Ticket State
  const [sharingEvent, setSharingEvent] = useState<EventItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Scanner State
  const [scannerSelectedEventId, setScannerSelectedEventId] = useState<string>('');
  const [scannerManualInput, setScannerManualInput] = useState<string>('');
  const [scannerProcessing, setScannerProcessing] = useState(false);
  const [scannerResult, setScannerResult] = useState<CheckInResult | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Create Event Form State — with custom initial ticket
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    category: 'music',
    bannerUrl: '',
    logoUrl: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '22:00',
    venue: '',
    address: '',
    googleMapsUrl: '',
    contactPhone: '+251911234567',
    // Custom initial ticket details (NO preset forced 500 ETB price!)
    ticketName: 'Standard Entry',
    ticketPrice: '0',
    ticketQuantity: '100'
  });

  // Add Ticket Type Modal State
  const [ticketTypeForm, setTicketTypeForm] = useState({
    name: 'VIP Pass',
    description: 'Special access',
    price: 1000,
    totalQuantity: 50,
    maxPerCustomer: 5
  });

  // Auto-select first event for scanner
  useEffect(() => {
    if (orgEvents.length > 0 && !scannerSelectedEventId) {
      setScannerSelectedEventId(orgEvents[0].id);
    }
  }, [orgEvents, scannerSelectedEventId]);

  // Handle Camera Scanner Lifecycle on Scanner Tab
  useEffect(() => {
    if (activeTab !== 'scanner' || !scannerSelectedEventId) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'org-qr-reader-container',
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
          false
        );
        scanner.render(
          async (scannedText) => {
            if (!scannerProcessing) {
              handleValidateTicket(scannedText);
            }
          },
          () => {}
        );
        scannerRef.current = scanner;
      } catch (err) {
        console.warn('Scanner init error:', err);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [activeTab, scannerSelectedEventId]);

  const handleValidateTicket = async (ticketIdOrToken: string) => {
    if (!scannerSelectedEventId) return;
    setScannerProcessing(true);
    triggerHaptic('impact');

    const result = await processTicketCheckIn(
      ticketIdOrToken,
      scannerSelectedEventId,
      user?.uid || 'organizer_staff',
      user?.fullName || currentOrganization?.name || 'Organizer Staff',
      firestoreService.getState().tickets
    );

    setScannerProcessing(false);
    setScannerResult(result);

    if (result.success) {
      triggerHaptic('success');
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch {}
      refreshOrgData();
    } else {
      triggerHaptic('error');
    }
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerManualInput.trim()) return;
    handleValidateTicket(scannerManualInput.trim());
    setScannerManualInput('');
  };

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
  const totalTicketsSold = orgEvents.reduce((s, e) => s + (e.ticketsSold || 0), 0);
  const totalRevenue = orgEvents.reduce((s, e) => s + (e.revenue || 0), 0);
  const checkedIn = allTickets.filter((t) => t.status === 'used').length;
  const attendanceRate = totalTicketsSold > 0 ? Math.round((checkedIn / totalTicketsSold) * 100) : 0;

  const handleApprovePayment = (p: PaymentSubmission) => {
    triggerHaptic('success');
    approvePayment(p.id);
    showAlert(`Payment approved! Ticket issued to ${p.customerName}.`);
    setSelectedPayment(null);
  };

  const handleRejectPayment = (p: PaymentSubmission) => {
    if (!rejectionReason.trim()) {
      alert('Please state the rejection reason.');
      return;
    }
    triggerHaptic('error');
    rejectPayment(p.id, rejectionReason);
    showAlert(`Payment rejected for ${p.customerName}.`);
    setSelectedPayment(null);
    setRejectionReason('');
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.bannerUrl) {
      alert('Please upload an event banner.');
      return;
    }
    triggerHaptic('success');

    const totalQty = Number(eventForm.ticketQuantity) || 100;
    const newEvt = createNewEvent({
      organizationId: currentOrganization.id,
      organizationName: currentOrganization.name,
      name: eventForm.name,
      description: eventForm.description,
      category: eventForm.category || 'music',
      bannerUrl: eventForm.bannerUrl,
      logoUrl: eventForm.logoUrl,
      date: eventForm.date,
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      venue: eventForm.venue,
      address: eventForm.address,
      googleMapsUrl: eventForm.googleMapsUrl,
      contactPhone: eventForm.contactPhone,
      status: 'published',
      totalQuantity: totalQty
    });

    // Custom initial ticket type with organizer's chosen price (NO preset 500 ETB!)
    if (eventForm.ticketName.trim()) {
      firestoreService.addTicketType({
        eventId: newEvt.id,
        organizationId: currentOrganization.id,
        name: eventForm.ticketName.trim(),
        description: 'Admission ticket',
        price: Number(eventForm.ticketPrice) || 0,
        currency: 'ETB',
        totalQuantity: totalQty,
        remainingQuantity: totalQty,
        maxPerCustomer: 5
      });
    }

    setShowCreateEvent(false);
    showAlert(`Event "${newEvt.name}" published!`);
    refreshOrgData();
  };

  const handleAddTicketType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTicketTypeModal) return;
    triggerHaptic('success');

    firestoreService.addTicketType({
      eventId: showTicketTypeModal,
      organizationId: currentOrganization.id,
      name: ticketTypeForm.name,
      description: ticketTypeForm.description,
      price: Number(ticketTypeForm.price),
      currency: 'ETB',
      totalQuantity: Number(ticketTypeForm.totalQuantity),
      remainingQuantity: Number(ticketTypeForm.totalQuantity),
      maxPerCustomer: Number(ticketTypeForm.maxPerCustomer)
    });

    setShowTicketTypeModal(null);
    showAlert('Ticket type added!');
    refreshOrgData();
  };

  const shareUrl = sharingEvent
    ? `${window.location.origin}/?event=${sharingEvent.id}`
    : '';

  const handleCopyShareLink = () => {
    triggerHaptic('success');
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareTelegram = () => {
    triggerHaptic('impact');
    if (!sharingEvent) return;
    const shareText = encodeURIComponent(`🎟️ Get tickets for "${sharingEvent.name}" on Telegram!\n📅 ${sharingEvent.date} at ${sharingEvent.venue}`);
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`;
    window.open(tgUrl, '_blank');
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
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(155,89,182,0.18)',
              color: 'var(--tg-purple)',
              border: 'none',
              borderRadius: 'var(--tg-radius-sm)',
              padding: '7px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('scanner')}
          >
            <QrCode style={{ width: 14, height: 14 }} /> Scan
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--tg-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--tg-radius-sm)',
              padding: '7px 12px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => setShowCreateEvent(true)}
          >
            <PlusCircle style={{ width: 15, height: 15 }} /> New Event
          </button>
        </div>
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
              <div style={{ fontSize: 12, color: 'var(--tg-hint)' }}>{currentOrganization.city || 'Verified Organizer'}</div>
            </div>
          </div>
          <span className={`tg-pill ${currentOrganization.status === 'approved' ? 'tg-pill--green' : 'tg-pill--amber'}`}>
            {currentOrganization.status}
          </span>
        </div>

        {/* ── Pending Payments Action Alert ─────────────────────────── */}
        {pendingPayments.length > 0 && (
          <div
            onClick={() => {
              triggerHaptic('impact');
              setActiveTab('payments');
            }}
            style={{
              background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.08))',
              border: '1.5px solid var(--tg-amber)',
              borderRadius: 'var(--tg-radius-lg)',
              padding: '14px 16px',
              marginBottom: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              boxShadow: '0 4px 14px rgba(245,166,35,0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(245,166,35,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle style={{ width: 22, height: 22, color: 'var(--tg-amber)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--tg-text)' }}>
                  {pendingPayments.length} Ticket Purchase{pendingPayments.length > 1 ? 's' : ''} Need Approval!
                </div>
                <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginTop: 2 }}>
                  Tap here to review receipts & issue digital tickets
                </div>
              </div>
            </div>
            <button
              className="tg-btn tg-btn--primary tg-btn--sm"
              style={{ width: 'auto', padding: '8px 14px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}
            >
              Approve Now →
            </button>
          </div>
        )}

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          <div className="tg-stat">
            <span className="tg-stat__label">Events</span>
            <span className="tg-stat__value">{totalEvents}</span>
            <span className="tg-stat__sub" style={{ color: 'var(--tg-accent)' }}>{activeEvents} live</span>
          </div>
          <div className="tg-stat">
            <span className="tg-stat__label">Tickets Sold</span>
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

        {/* ── Tabs (Includes Scan Tickets) ────────────────────────────── */}
        <div className="tg-tabs" style={{ padding: '0 0 12px' }}>
          {([ 
            { key: 'events' as const, label: `Events (${orgEvents.length})`, count: 0 },
            { key: 'payments' as const, label: 'Payments', count: pendingPayments.length },
            { key: 'scanner' as const, label: 'Scan Tickets', count: 0 },
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
                <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginTop: 6, marginBottom: 20 }}>
                  Create your first event to start selling tickets without any preset pricing restrictions.
                </div>
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

                  {/* Ticket types list */}
                  <div style={{ padding: '10px 16px' }}>
                    <div style={{ fontSize: 11, color: 'var(--tg-hint)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Ticket Types</div>
                    {evtTicketTypes.length === 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginBottom: 8 }}>No ticket types added yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {evtTicketTypes.map((tt) => (
                          <div key={tt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--tg-surface)', borderRadius: 'var(--tg-radius-sm)' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tg-text)' }}>{tt.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--tg-hint)', marginTop: 1 }}>{tt.remainingQuantity}/{tt.totalQuantity} remaining</div>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14, color: tt.price === 0 ? 'var(--tg-green)' : 'var(--tg-text)', fontFamily: 'monospace' }}>
                              {tt.price === 0 ? 'FREE' : `${tt.price} ETB`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Event Actions: Share & QR, Scan, Add Ticket Type */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      <button
                        className="tg-btn tg-btn--secondary tg-btn--sm"
                        style={{ flex: 1, minWidth: '110px' }}
                        onClick={() => {
                          triggerHaptic('impact');
                          setSharingEvent(evt);
                        }}
                      >
                        <Share2 style={{ width: 14, height: 14 }} /> Share & QR
                      </button>

                      <button
                        className="tg-btn tg-btn--secondary tg-btn--sm"
                        style={{ flex: 1, minWidth: '110px' }}
                        onClick={() => {
                          triggerHaptic('impact');
                          setScannerSelectedEventId(evt.id);
                          setActiveTab('scanner');
                        }}
                      >
                        <QrCode style={{ width: 14, height: 14 }} /> Scan Tickets
                      </button>

                      <button
                        className="tg-btn tg-btn--primary tg-btn--sm"
                        style={{ flex: 1, minWidth: '110px' }}
                        onClick={() => setShowTicketTypeModal(evt.id)}
                      >
                        <PlusCircle style={{ width: 14, height: 14 }} /> + Ticket Type
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
                    <div style={{ padding: '10px 16px 14px', display: 'flex', gap: 8 }}>
                      <button
                        className="tg-btn tg-btn--primary tg-btn--sm"
                        style={{ flex: 1 }}
                        onClick={() => handleApprovePayment(p)}
                      >
                        <CheckCircle2 style={{ width: 15, height: 15 }} /> Approve & Issue Ticket
                      </button>
                      <button
                        className="tg-btn tg-btn--danger tg-btn--sm"
                        style={{ flex: 1 }}
                        onClick={() => setSelectedPayment(p)}
                      >
                        <XCircle style={{ width: 15, height: 15 }} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Scan Tickets Tab (Moved into Organizer Dashboard) ─────────── */}
        {activeTab === 'scanner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Event Selector */}
            <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '14px 16px' }}>
              <label className="tg-label">Select Event to Check-In</label>
              <select
                className="tg-input"
                style={{ appearance: 'none', fontWeight: 600 }}
                value={scannerSelectedEventId}
                onChange={(e) => setScannerSelectedEventId(e.target.value)}
              >
                {orgEvents.length === 0 && <option value="">No events created yet</option>}
                {orgEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name} ({evt.date})
                  </option>
                ))}
              </select>
            </div>

            {/* Camera QR Scanner Box */}
            <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--tg-divider)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera style={{ width: 18, height: 18, color: 'var(--tg-green)' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tg-text)' }}>Camera QR Scanner</span>
                <span style={{ fontSize: 12, color: 'var(--tg-hint)', marginLeft: 'auto' }}>Point at attendee QR</span>
              </div>
              <div id="org-qr-reader-container" style={{ background: 'var(--tg-bg2)', minHeight: 240 }} />
            </div>

            {/* Manual Ticket ID Search Form */}
            <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                Or Enter Ticket ID Manually
              </div>
              <form onSubmit={handleManualScanSubmit} style={{ display: 'flex', gap: 8 }}>
                <input
                  className="tg-input"
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
                  type="text"
                  placeholder="e.g. EVT-2026-XXXXX"
                  value={scannerManualInput}
                  onChange={(e) => setScannerManualInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={scannerProcessing || !scannerManualInput.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--tg-purple)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--tg-radius)',
                    padding: '0 16px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <Search style={{ width: 16, height: 16 }} /> Check In
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Tickets Tab ──────────────────────────────────────────────── */}
        {activeTab === 'tickets' && (
          <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', overflow: 'hidden' }}>
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

      {/* ── Create Event Sheet (No preset forced price!) ──────────────── */}
      {showCreateEvent && (
        <div className="tg-overlay" onClick={() => setShowCreateEvent(false)}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span>Create Event</span>
              <button className="tg-sheet__close" onClick={() => setShowCreateEvent(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateEvent} style={{ padding: '8px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="tg-label">Event Name *</label>
                <input
                  className="tg-input"
                  required
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  placeholder="e.g. Addis Tech Summit 2026"
                />
              </div>

              <div>
                <label className="tg-label">Event Category *</label>
                <select
                  className="tg-input"
                  required
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                >
                  {EVENT_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="tg-label">Description *</label>
                <textarea
                  className="tg-input"
                  rows={3}
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Describe the event, agenda, performers, etc."
                  style={{ resize: 'none' }}
                />
              </div>

              <ImgBBImageUploader
                label="Event Banner (Image / Preset) *"
                value={eventForm.bannerUrl}
                onChange={(url) => setEventForm({ ...eventForm, bannerUrl: url })}
                placeholder="Upload file, paste URL, or pick preset"
                selectedCategory={eventForm.category}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="tg-label">Date *</label>
                  <input
                    className="tg-input"
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="tg-label">Start Time *</label>
                  <input
                    className="tg-input"
                    type="time"
                    required
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="tg-label">Venue *</label>
                  <input
                    className="tg-input"
                    required
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    placeholder="e.g. Millennium Hall"
                  />
                </div>
                <div>
                  <label className="tg-label">Contact Phone</label>
                  <input
                    className="tg-input"
                    value={eventForm.contactPhone}
                    onChange={(e) => setEventForm({ ...eventForm, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              {/* Custom Initial Ticket Type & Pricing Setup (NO PRESET 500 ETB!) */}
              <div style={{ background: 'var(--tg-bg2)', borderRadius: 'var(--tg-radius-lg)', padding: '14px', border: '1px solid var(--tg-card-border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tg-accent)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ticket style={{ width: 16, height: 16 }} /> Initial Ticket & Custom Price
                </div>
                <p style={{ fontSize: 12, color: 'var(--tg-hint)', marginBottom: 12 }}>
                  Set your own ticket name and price. Enter 0 for free events.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label className="tg-label">Ticket Name</label>
                    <input
                      className="tg-input"
                      value={eventForm.ticketName}
                      onChange={(e) => setEventForm({ ...eventForm, ticketName: e.target.value })}
                      placeholder="e.g. Standard, VIP, Early Bird"
                    />
                  </div>
                  <div>
                    <label className="tg-label">Price (ETB) *</label>
                    <input
                      className="tg-input"
                      type="number"
                      min="0"
                      required
                      value={eventForm.ticketPrice}
                      onChange={(e) => setEventForm({ ...eventForm, ticketPrice: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="tg-label">Tickets Available</label>
                  <input
                    className="tg-input"
                    type="number"
                    min="1"
                    required
                    value={eventForm.ticketQuantity}
                    onChange={(e) => setEventForm({ ...eventForm, ticketQuantity: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>

              <button type="submit" className="tg-btn tg-btn--primary">
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Extra Ticket Type Sheet ───────────────────────────────── */}
      {showTicketTypeModal && (
        <div className="tg-overlay" onClick={() => setShowTicketTypeModal(null)}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span>Add Ticket Type</span>
              <button className="tg-sheet__close" onClick={() => setShowTicketTypeModal(null)}>✕</button>
            </div>
            <form onSubmit={handleAddTicketType} style={{ padding: '8px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="tg-label">Ticket Name *</label>
                <input
                  className="tg-input"
                  required
                  value={ticketTypeForm.name}
                  onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, name: e.target.value })}
                  placeholder="VIP, Early Bird, Student, Backstage..."
                />
              </div>
              <div>
                <label className="tg-label">Price (ETB) *</label>
                <input
                  className="tg-input"
                  type="number"
                  min="0"
                  required
                  value={ticketTypeForm.price}
                  onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, price: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="tg-label">Quantity *</label>
                  <input
                    className="tg-input"
                    type="number"
                    min="1"
                    required
                    value={ticketTypeForm.totalQuantity}
                    onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, totalQuantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="tg-label">Max/Customer</label>
                  <input
                    className="tg-input"
                    type="number"
                    min="1"
                    required
                    value={ticketTypeForm.maxPerCustomer}
                    onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, maxPerCustomer: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button type="submit" className="tg-btn tg-btn--primary">
                Save Ticket Type
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Share Event & QR Code Sheet (Requirement 2) ──────────────── */}
      {sharingEvent && (
        <div className="tg-overlay" onClick={() => setSharingEvent(null)}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Share2 style={{ width: 16, height: 16, color: 'var(--tg-accent)' }} />
                Share Event & QR Code
              </span>
              <button className="tg-sheet__close" onClick={() => setSharingEvent(null)}>✕</button>
            </div>

            <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--tg-text)' }}>{sharingEvent.name}</div>
              <div style={{ fontSize: 13, color: 'var(--tg-hint)' }}>
                {sharingEvent.date} · {sharingEvent.venue}
              </div>

              {/* QR Code Container */}
              <div style={{ background: '#ffffff', padding: 14, borderRadius: 'var(--tg-radius-lg)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', margin: '4px 0' }}>
                <QRCodeSVG value={shareUrl} size={180} level="M" />
              </div>
              <div style={{ fontSize: 12, color: 'var(--tg-hint)' }}>
                Attendees scan this QR code to view tickets and buy directly.
              </div>

              {/* Copy URL Box */}
              <div style={{ display: 'flex', width: '100%', gap: 8 }}>
                <input
                  className="tg-input"
                  style={{ fontSize: 12, fontFamily: 'monospace', flex: 1 }}
                  readOnly
                  value={shareUrl}
                />
                <button
                  onClick={handleCopyShareLink}
                  style={{
                    background: copiedLink ? 'var(--tg-green)' : 'var(--tg-accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--tg-radius)',
                    padding: '0 16px',
                    fontWeight: 600,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Share to Telegram Button */}
              <button
                onClick={handleShareTelegram}
                className="tg-btn tg-btn--primary"
                style={{ width: '100%' }}
              >
                <Send style={{ width: 16, height: 16 }} /> Share via Telegram
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scan Check-in Result Modal ───────────────────────────────── */}
      {scannerResult && (
        <div className="tg-overlay tg-overlay--center" onClick={() => setScannerResult(null)}>
          <div
            className="tg-sheet--center"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderRadius: 'var(--tg-radius-xl)',
              background: 'var(--tg-bg)',
              textAlign: 'center',
              maxWidth: 340,
              padding: '24px',
              border: scannerResult.success
                ? '2px solid rgba(77,205,94,0.4)'
                : scannerResult.resultCode === 'already_used'
                ? '2px solid rgba(229,57,53,0.4)'
                : '2px solid rgba(245,166,35,0.4)'
            }}
          >
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: scannerResult.success ? 'rgba(77,205,94,0.15)' : scannerResult.resultCode === 'already_used' ? 'rgba(229,57,53,0.15)' : 'rgba(245,166,35,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              {scannerResult.success
                ? <CheckCircle2 style={{ width: 40, height: 40, color: 'var(--tg-green)' }} />
                : scannerResult.resultCode === 'already_used'
                ? <XCircle style={{ width: 40, height: 40, color: 'var(--tg-red)' }} />
                : <AlertTriangle style={{ width: 40, height: 40, color: 'var(--tg-amber)' }} />
              }
            </div>

            <div style={{
              fontSize: 20, fontWeight: 800,
              color: scannerResult.success ? 'var(--tg-green)' : scannerResult.resultCode === 'already_used' ? 'var(--tg-red)' : 'var(--tg-amber)',
              marginBottom: 6
            }}>
              {scannerResult.message}
            </div>

            {scannerResult.ticket && (
              <div style={{ background: 'var(--tg-bg2)', borderRadius: 'var(--tg-radius)', padding: '10px 14px', margin: '12px 0', textAlign: 'left', fontSize: 12 }}>
                <div><strong>Attendee:</strong> {scannerResult.ticket.customerName}</div>
                <div><strong>Ticket:</strong> {scannerResult.ticket.ticketTypeName} ({scannerResult.ticket.id})</div>
              </div>
            )}

            <button
              className="tg-btn tg-btn--primary"
              style={{ marginTop: 12 }}
              onClick={() => setScannerResult(null)}
            >
              Scan Next Ticket
            </button>
          </div>
        </div>
      )}

      {/* ── Rejection Reason Modal ────────────────────────────────────── */}
      {selectedPayment && (
        <div className="tg-overlay" onClick={() => setSelectedPayment(null)}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span>Reject Payment</span>
              <button className="tg-sheet__close" onClick={() => setSelectedPayment(null)}>✕</button>
            </div>
            <div style={{ padding: '8px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--tg-hint)' }}>
                Please provide the reason for rejecting {selectedPayment.customerName}'s payment submission.
              </div>
              <textarea
                className="tg-input"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Receipt unreadable, incorrect amount transferred, etc."
                style={{ resize: 'none' }}
              />
              <button
                className="tg-btn tg-btn--danger"
                onClick={() => handleRejectPayment(selectedPayment)}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
