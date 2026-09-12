import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { useTelegram } from '../contexts/TelegramContext';
import { firestoreService } from '../services/firestoreService';
import { processTicketCheckIn, CheckInResult } from '../services/ticketService';
import { QrCode, CheckCircle2, XCircle, AlertTriangle, ChevronLeft, Camera, Search } from 'lucide-react';

interface Props { onNavigate: (view: string) => void; }

export const ScannerView: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { triggerHaptic } = useTelegram();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [manualTicketInput, setManualTicketInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const events = firestoreService.getEvents();

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) setSelectedEventId(events[0].id);
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    const scanner = new Html5QrcodeScanner(
      'qr-reader-container',
      { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
      false
    );
    scanner.render(
      async (scannedText) => { if (!isProcessing) handleValidateTicket(scannedText); },
      () => {}
    );
    scannerRef.current = scanner;
    return () => { scanner.clear().catch(() => {}); };
  }, [selectedEventId]);

  const handleValidateTicket = async (ticketIdOrData: string) => {
    setIsProcessing(true);
    triggerHaptic('impact');
    const result = await processTicketCheckIn(
      ticketIdOrData, selectedEventId,
      user?.uid || 'staff_001', user?.fullName || 'Gate Staff',
      firestoreService.getState().tickets
    );
    setIsProcessing(false);
    setScanResult(result);
    if (result.success) {
      triggerHaptic('success');
      try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); } catch {}
    } else {
      triggerHaptic('error');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTicketInput.trim()) return;
    handleValidateTicket(manualTicketInput.trim());
    setManualTicketInput('');
  };

  return (
    <div className="tg-page">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="tg-header">
        <button className="tg-header__back" onClick={() => onNavigate('organizer_dashboard')}>
          <ChevronLeft style={{ width: 20, height: 20 }} />
        </button>
        <span className="tg-header__title">Ticket Scanner</span>
        <span className="tg-pill tg-pill--purple">Gate Mode</span>
      </div>

      <div className="tg-content">

        {/* ── Event Selector ───────────────────────────────────────── */}
        <div>
          <label className="tg-label">Scanning Event</label>
          <select
            className="tg-input"
            style={{ appearance: 'none' }}
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.length === 0 && <option value="">No events available</option>}
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>{evt.name} · {evt.date}</option>
            ))}
          </select>
        </div>

        <div className="spacer-8" />

        {/* ── Camera View ──────────────────────────────────────────── */}
        <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--tg-divider)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera style={{ width: 18, height: 18, color: 'var(--tg-green)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tg-text)' }}>Camera Scanner</span>
            <span style={{ fontSize: 12, color: 'var(--tg-hint)', marginLeft: 'auto' }}>Point at QR code</span>
          </div>
          <div id="qr-reader-container" style={{ background: 'var(--tg-bg2)', minHeight: 260 }} />
        </div>

        <div className="spacer-8" />

        {/* ── Manual Entry ─────────────────────────────────────────── */}
        <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Or Enter Ticket ID Manually</div>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              className="tg-input"
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
              type="text"
              placeholder="e.g. EVT-2026-XXXXX"
              value={manualTicketInput}
              onChange={(e) => setManualTicketInput(e.target.value)}
            />
            <button
              type="submit"
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--tg-purple)', color: '#fff', border: 'none', borderRadius: 'var(--tg-radius)', padding: '0 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}
            >
              <Search style={{ width: 16, height: 16 }} />
            </button>
          </form>
        </div>

        <div className="spacer-16" />
      </div>

      {/* ── Scan Result Sheet ────────────────────────────────────────── */}
      {scanResult && (
        <div className="tg-overlay tg-overlay--center" onClick={() => setScanResult(null)}>
          <div
            className="tg-sheet--center"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderRadius: 'var(--tg-radius-xl)',
              background: 'var(--tg-bg)',
              textAlign: 'center',
              maxWidth: 340,
              border: scanResult.success
                ? '2px solid rgba(77,205,94,0.4)'
                : scanResult.resultCode === 'already_used'
                ? '2px solid rgba(229,57,53,0.4)'
                : '2px solid rgba(245,166,35,0.4)'
            }}
          >
            {/* Result Icon */}
            <div style={{
              width: 80, height: 80,
              borderRadius: '50%',
              background: scanResult.success ? 'rgba(77,205,94,0.15)' : scanResult.resultCode === 'already_used' ? 'rgba(229,57,53,0.15)' : 'rgba(245,166,35,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              {scanResult.success
                ? <CheckCircle2 style={{ width: 44, height: 44, color: 'var(--tg-green)' }} />
                : scanResult.resultCode === 'already_used'
                ? <XCircle style={{ width: 44, height: 44, color: 'var(--tg-red)' }} />
                : <AlertTriangle style={{ width: 44, height: 44, color: 'var(--tg-amber)' }} />
              }
            </div>

            <div style={{
              fontSize: 22, fontWeight: 800,
              color: scanResult.success ? 'var(--tg-green)' : scanResult.resultCode === 'already_used' ? 'var(--tg-red)' : 'var(--tg-amber)',
              marginBottom: 6
            }}>
              {scanResult.message}
            </div>
            <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginBottom: 20, lineHeight: 1.5 }}>
              {scanResult.success
                ? 'Entry approved. Welcome!'
                : scanResult.resultCode === 'already_used'
                ? 'This ticket was already scanned!'
                : 'Ticket not valid for this event.'}
            </div>

            {/* Ticket Details */}
            {scanResult.ticket && (
              <div style={{ background: 'var(--tg-surface)', borderRadius: 'var(--tg-radius)', padding: '12px 14px', textAlign: 'left', marginBottom: 16 }}>
                {[
                  { label: 'Customer', value: scanResult.ticket.customerName },
                  { label: 'Ticket Type', value: scanResult.ticket.ticketTypeName },
                  { label: 'Ticket ID', value: scanResult.ticket.id, mono: true },
                  ...(scanResult.resultCode === 'already_used' ? [
                    { label: 'First Scanned', value: String(scanResult.checkedInAt || scanResult.ticket.checkedInAt || '—') },
                    { label: 'Scanned By', value: scanResult.checkedInByName || scanResult.ticket.checkedInByName || 'Staff' }
                  ] : [])
                ].map(({ label, value, mono }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--tg-divider)' }}>
                    <span style={{ fontSize: 12, color: 'var(--tg-hint)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tg-text)', fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              className={`tg-btn ${scanResult.success ? 'tg-btn--success' : 'tg-btn--secondary'}`}
              onClick={() => setScanResult(null)}
            >
              Scan Next Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
