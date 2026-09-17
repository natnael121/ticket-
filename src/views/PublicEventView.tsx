import React, { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';
import { useTelegram } from '../contexts/TelegramContext';
import { useAuth } from '../contexts/AuthContext';
import { ImgBBImageUploader } from '../components/common/ImgBBImageUploader';
import { TicketType } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Building2,
  CheckCircle2,
  Share2,
  ChevronLeft,
  Copy,
  Check,
  Send,
  ExternalLink,
  Phone,
  AlertCircle
} from 'lucide-react';

interface PublicEventViewProps {
  eventId: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

export const PublicEventView: React.FC<PublicEventViewProps> = ({ eventId, onNavigate }) => {
  const { user } = useAuth();
  const { tgUser, triggerHaptic, showAlert } = useTelegram();

  const [, setTick] = useState(0);
  useEffect(() => {
    return firestoreService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const allEvents = firestoreService.getEvents();
  const event = firestoreService.getEvent(eventId) || (eventId ? allEvents.find((e) => e.id === eventId) : allEvents[0]);
  const organization = event ? firestoreService.getOrganization(event.organizationId) : null;
  const ticketTypes = event ? firestoreService.getTicketTypes(event.id) : [];

  // Checkout State
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  // Modal Flow
  const [checkoutStep, setCheckoutStep] = useState<'none' | 'register' | 'payment' | 'completed'>('none');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Registration Form State
  const [customerName, setCustomerName] = useState(
    user?.fullName || (tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : '')
  );
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  // Payment Form State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Telebirr');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select first ticket type when available
  useEffect(() => {
    if (ticketTypes.length > 0 && !selectedTicketTypeId) {
      setSelectedTicketTypeId(ticketTypes[0].id);
    }
  }, [ticketTypes, selectedTicketTypeId]);

  const activeTicket = ticketTypes.find((t) => t.id === selectedTicketTypeId) || ticketTypes[0];
  const totalPrice = activeTicket ? activeTicket.price * quantity : 0;

  const shareUrl = event
    ? `${window.location.origin}/?event=${event.id}`
    : window.location.href;

  const handleCopyLink = () => {
    triggerHaptic('success');
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareTelegram = () => {
    triggerHaptic('impact');
    if (!event) return;
    const shareText = encodeURIComponent(`🎟️ Get tickets for "${event.name}" on Telegram!\n📅 ${event.date} at ${event.venue}`);
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`;
    window.open(tgUrl, '_blank');
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !activeTicket) return;

    if (activeTicket.price === 0 || totalPrice === 0) {
      triggerHaptic('success');
      setIsSubmitting(true);

      firestoreService.submitOrderAndPayment(
        event.id,
        activeTicket.id,
        customerName,
        customerPhone,
        customerEmail,
        quantity,
        'Free Pass',
        ''
      );

      setIsSubmitting(false);
      setCheckoutStep('completed');
    } else {
      triggerHaptic('impact');
      setCheckoutStep('payment');
    }
  };

  const handleFinalSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotUrl) {
      alert('Please upload your payment receipt screenshot via the ImgBB uploader.');
      return;
    }
    if (!event || !activeTicket) return;

    triggerHaptic('success');
    setIsSubmitting(true);

    firestoreService.submitOrderAndPayment(
      event.id,
      activeTicket.id,
      customerName,
      customerPhone,
      customerEmail,
      quantity,
      selectedPaymentMethod,
      screenshotUrl
    );

    setIsSubmitting(false);
    setCheckoutStep('completed');
  };

  if (!event) {
    return (
      <div className="tg-page">
        <div className="tg-header">
          <button className="tg-header__back" onClick={() => onNavigate('landing')}>
            <ChevronLeft style={{ width: 20, height: 20 }} />
          </button>
          <span className="tg-header__title">Event</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,166,35,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle style={{ width: 32, height: 32, color: 'var(--tg-amber)' }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--tg-text)' }}>Event Not Found</div>
          <p style={{ fontSize: 14, color: 'var(--tg-hint)', lineHeight: 1.6, maxWidth: 300 }}>
            This event may have ended or the link is invalid. Check out our upcoming events!
          </p>
          <button className="tg-btn tg-btn--primary" style={{ maxWidth: 220 }} onClick={() => onNavigate('landing')}>
            Explore Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tg-page" style={{ paddingBottom: 80 }}>
      {/* ── Top Header ────────────────────────────────────────────────── */}
      <div className="tg-header">
        <button className="tg-header__back" onClick={() => onNavigate('landing')}>
          <ChevronLeft style={{ width: 20, height: 20 }} />
        </button>
        <span className="tg-header__title" style={{ fontSize: 16 }}>{event.name}</span>
        <button
          onClick={() => { triggerHaptic('impact'); setShowShareModal(true); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(36,129,204,0.15)',
            color: 'var(--tg-accent)',
            border: 'none',
            borderRadius: 'var(--tg-radius-sm)',
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Share2 style={{ width: 14, height: 14 }} /> Share
        </button>
      </div>

      <div className="tg-content">
        {/* ── Event Banner ────────────────────────────────────────────── */}
        {event.bannerUrl ? (
          <div style={{ borderRadius: 'var(--tg-radius-lg)', overflow: 'hidden', height: 200, position: 'relative', marginBottom: 12 }}>
            <img src={event.bannerUrl} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(23,33,43,0.9) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
              <span className="tg-pill tg-pill--blue" style={{ marginBottom: 6 }}>
                {event.organizationName || organization?.name || 'Verified Organizer'}
              </span>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', lineHeight: 1.2 }}>
                {event.name}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '20px 16px', marginBottom: 12 }}>
            <span className="tg-pill tg-pill--blue" style={{ marginBottom: 8 }}>
              {event.organizationName || organization?.name || 'Verified Organizer'}
            </span>
            <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--tg-text)', lineHeight: 1.3 }}>
              {event.name}
            </div>
          </div>
        )}

        {/* ── Key Info Card ───────────────────────────────────────────── */}
        <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '14px 16px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--tg-radius-sm)', background: 'rgba(36,129,204,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar style={{ width: 18, height: 18, color: 'var(--tg-accent)' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--tg-hint)', fontWeight: 500 }}>Date & Time</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tg-text)' }}>
                {event.date} · {event.startTime} - {event.endTime}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--tg-divider)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--tg-radius-sm)', background: 'rgba(77,205,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin style={{ width: 18, height: 18, color: 'var(--tg-green)' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--tg-hint)', fontWeight: 500 }}>Location</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tg-text)' }}>{event.venue}</div>
              {event.address && <div style={{ fontSize: 12, color: 'var(--tg-hint)' }}>{event.address}</div>}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--tg-divider)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--tg-radius-sm)', background: 'rgba(245,166,35,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 style={{ width: 18, height: 18, color: 'var(--tg-amber)' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--tg-hint)', fontWeight: 500 }}>Organizer</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tg-text)' }}>
                {organization?.name || event.organizationName}
              </div>
              {(organization?.ownerPhone || event.contactPhone) && (
                <div style={{ fontSize: 12, color: 'var(--tg-hint)' }}>
                  {organization?.ownerPhone || event.contactPhone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Event Description ────────────────────────────────────────── */}
        <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '16px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--tg-hint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
            About Event
          </div>
          <p style={{ fontSize: 14, color: 'var(--tg-text)', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>
            {event.description}
          </p>
        </div>

        {/* ── Ticket Types Section ────────────────────────────────────── */}
        <div className="tg-section__header">Available Tickets</div>

        {ticketTypes.length === 0 ? (
          <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '24px 16px', textAlign: 'center', marginBottom: 14 }}>
            <Ticket style={{ width: 36, height: 36, color: 'var(--tg-hint)', margin: '0 auto 10px' }} />
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--tg-text)' }}>Tickets Coming Soon</div>
            <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginTop: 4 }}>
              The organizer has not yet added tickets for this event. Please check back later.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {ticketTypes.map((tt) => {
              const isSelected = activeTicket?.id === tt.id;
              const isSoldOut = tt.remainingQuantity <= 0;
              return (
                <div
                  key={tt.id}
                  onClick={() => {
                    if (!isSoldOut) {
                      triggerHaptic('impact');
                      setSelectedTicketTypeId(tt.id);
                    }
                  }}
                  style={{
                    background: isSelected ? 'rgba(36,129,204,0.1)' : 'var(--tg-bg)',
                    border: isSelected ? '1.5px solid var(--tg-accent)' : '1px solid var(--tg-card-border)',
                    borderRadius: 'var(--tg-radius-lg)',
                    padding: '14px 16px',
                    cursor: isSoldOut ? 'not-allowed' : 'pointer',
                    opacity: isSoldOut ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ flex: 1, paddingRight: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--tg-text)' }}>{tt.name}</span>
                      {isSelected && (
                        <span className="tg-pill tg-pill--blue" style={{ fontSize: 10 }}>Selected</span>
                      )}
                      {isSoldOut && (
                        <span className="tg-pill tg-pill--red" style={{ fontSize: 10 }}>Sold Out</span>
                      )}
                    </div>
                    {tt.description && (
                      <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginBottom: 4 }}>{tt.description}</div>
                    )}
                    <div style={{ fontSize: 11, color: isSoldOut ? 'var(--tg-red)' : 'var(--tg-green)', fontWeight: 600 }}>
                      {isSoldOut ? 'No tickets left' : `${tt.remainingQuantity} tickets left`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: tt.price === 0 ? 'var(--tg-green)' : 'var(--tg-text)', fontFamily: 'monospace' }}>
                      {tt.price === 0 ? 'FREE' : `${tt.price.toLocaleString()} ETB`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--tg-hint)' }}>Max {tt.maxPerCustomer || 5}/order</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="spacer-16" />
      </div>

      {/* ── Sticky Bottom Checkout Bar ───────────────────────────────── */}
      {ticketTypes.length > 0 && activeTicket && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            background: 'var(--tg-bg)',
            borderTop: '1px solid var(--tg-divider)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: '0 -4px 16px rgba(0,0,0,0.2)'
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--tg-hint)' }}>Selected</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tg-text)' }}>
              {activeTicket.name} ·{' '}
              <strong style={{ color: 'var(--tg-green)', fontFamily: 'monospace' }}>
                {activeTicket.price === 0 ? 'FREE' : `${activeTicket.price} ETB`}
              </strong>
            </div>
          </div>

          <button
            onClick={() => { triggerHaptic('impact'); setCheckoutStep('register'); }}
            disabled={activeTicket.remainingQuantity <= 0}
            className="tg-btn tg-btn--primary"
            style={{ width: 'auto', padding: '12px 24px', fontSize: 14, fontWeight: 700 }}
          >
            <Ticket style={{ width: 16, height: 16 }} /> Get Ticket
          </button>
        </div>
      )}

      {/* ── Step 1: Customer Registration Sheet ───────────────────────── */}
      {checkoutStep === 'register' && activeTicket && (
        <div className="tg-overlay" onClick={() => setCheckoutStep('none')}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh' }}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span>Step 1: Your Details</span>
              <button className="tg-sheet__close" onClick={() => setCheckoutStep('none')}>✕</button>
            </div>

            <form onSubmit={handleProceedToPayment} style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--tg-bg2)', borderRadius: 'var(--tg-radius)', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{event.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--tg-accent)' }}>{activeTicket.name}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--tg-green)', fontFamily: 'monospace' }}>
                  {activeTicket.price === 0 ? 'FREE' : `${activeTicket.price} ETB`}
                </div>
              </div>

              <div>
                <label className="tg-label">Full Name *</label>
                <input
                  className="tg-input"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Abebe Kebede"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
                <div>
                  <label className="tg-label">Phone Number *</label>
                  <input
                    className="tg-input"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+251911..."
                  />
                </div>
                <div>
                  <label className="tg-label">Quantity</label>
                  <select
                    className="tg-input"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((q) => (
                      <option key={q} value={q}>{q} ticket{q > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="tg-label">Email (Optional)</label>
                <input
                  className="tg-input"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@email.com"
                />
              </div>

              <div style={{ background: 'var(--tg-bg2)', borderRadius: 'var(--tg-radius)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--tg-hint)' }}>Total Amount:</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--tg-green)', fontFamily: 'monospace' }}>
                  {totalPrice === 0 ? 'FREE' : `${totalPrice.toLocaleString()} ETB`}
                </span>
              </div>

              <button type="submit" disabled={isSubmitting} className="tg-btn tg-btn--primary">
                {totalPrice === 0 || activeTicket.price === 0
                  ? 'Get Free Ticket 🎟️'
                  : 'Proceed to Payment Instructions →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Step 2: Payment Details & Receipt Upload Sheet ─────────────── */}
      {checkoutStep === 'payment' && activeTicket && (
        <div className="tg-overlay" onClick={() => setCheckoutStep('register')}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span>Step 2: Submit Payment</span>
              <button className="tg-sheet__close" onClick={() => setCheckoutStep('register')}>✕</button>
            </div>

            <form onSubmit={handleFinalSubmitPayment} style={{ padding: '8px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Payment Account Details Card */}
              <div style={{ background: 'var(--tg-bg2)', borderRadius: 'var(--tg-radius-lg)', padding: '14px 16px', border: '1px solid var(--tg-accent)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tg-accent)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
                  Organizer Payment Account
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--tg-divider)' }}>
                    <span style={{ color: 'var(--tg-hint)' }}>Payment Method:</span>
                    <strong style={{ color: 'var(--tg-text)' }}>{selectedPaymentMethod}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--tg-divider)' }}>
                    <span style={{ color: 'var(--tg-hint)' }}>Account Name:</span>
                    <strong style={{ color: 'var(--tg-text)' }}>{organization?.name || event.organizationName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--tg-divider)', alignItems: 'center' }}>
                    <span style={{ color: 'var(--tg-hint)' }}>Account Number:</span>
                    <strong style={{ color: 'var(--tg-accent)', fontFamily: 'monospace', fontSize: 15 }}>
                      {organization?.paymentMethods[0]?.accountNumber || organization?.ownerPhone || '+251911234567'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', alignItems: 'center' }}>
                    <span style={{ color: 'var(--tg-hint)' }}>Exact Amount:</span>
                    <strong style={{ color: 'var(--tg-green)', fontFamily: 'monospace', fontSize: 16 }}>
                      {totalPrice === 0 ? 'FREE' : `${totalPrice.toLocaleString()} ETB`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Upload Screenshot */}
              <ImgBBImageUploader
                label="Upload Payment Receipt Screenshot *"
                value={screenshotUrl}
                onChange={(url) => setScreenshotUrl(url)}
                placeholder="Upload screenshot of Telebirr or CBE receipt"
              />

              <button
                type="submit"
                disabled={isSubmitting || (!screenshotUrl && totalPrice > 0)}
                className="tg-btn tg-btn--primary"
                style={{ opacity: isSubmitting || (!screenshotUrl && totalPrice > 0) ? 0.5 : 1 }}
              >
                {isSubmitting ? 'Submitting Order...' : 'Submit Payment for Approval'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Step 3: Payment Submitted Confirmation ───────────────────── */}
      {checkoutStep === 'completed' && (
        <div className="tg-overlay tg-overlay--center" onClick={() => setCheckoutStep('none')}>
          <div className="tg-sheet--center" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-xl)', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(77,205,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 style={{ width: 36, height: 36, color: 'var(--tg-green)' }} />
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tg-text)', marginBottom: 8 }}>
              Payment Submitted!
            </div>

            <span className="tg-pill tg-pill--amber" style={{ marginBottom: 14 }}>
              ⏳ Pending Organizer Approval
            </span>

            <p style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.6, marginBottom: 18 }}>
              Your receipt has been submitted to <strong>{event.organizationName}</strong>. Once approved, your digital ticket QR code will appear automatically in your tickets wallet!
            </p>

            <button
              onClick={() => onNavigate('my_tickets')}
              className="tg-btn tg-btn--primary"
            >
              <Ticket style={{ width: 16, height: 16 }} /> Go to My Tickets Wallet
            </button>
          </div>
        </div>
      )}

      {/* ── Share Ticket & QR Sheet ──────────────────────────────────── */}
      {showShareModal && (
        <div className="tg-overlay" onClick={() => setShowShareModal(false)}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Share2 style={{ width: 16, height: 16, color: 'var(--tg-accent)' }} />
                Share Event & QR Code
              </span>
              <button className="tg-sheet__close" onClick={() => setShowShareModal(false)}>✕</button>
            </div>

            <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--tg-text)' }}>{event.name}</div>
              <div style={{ fontSize: 13, color: 'var(--tg-hint)' }}>
                {event.date} · {event.venue}
              </div>

              {/* QR Code Container */}
              <div style={{ background: '#ffffff', padding: 14, borderRadius: 'var(--tg-radius-lg)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', margin: '6px 0' }}>
                <QRCodeSVG value={shareUrl} size={180} level="M" />
              </div>
              <div style={{ fontSize: 12, color: 'var(--tg-hint)' }}>
                Scan to view event and buy tickets directly
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
                  onClick={handleCopyLink}
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
    </div>
  );
};
