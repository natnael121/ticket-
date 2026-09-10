import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { useTelegram } from '../contexts/TelegramContext';
import { mockDataService } from '../services/mockDataService';
import { processTicketCheckIn, CheckInResult } from '../services/ticketService';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  Camera,
  RefreshCw,
  Search
} from 'lucide-react';

interface ScannerViewProps {
  onNavigate: (view: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { triggerHaptic, showAlert } = useTelegram();

  const [selectedEventId, setSelectedEventId] = useState<string>('evt_001');
  const [manualTicketInput, setManualTicketInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);

  const events = mockDataService.getEvents();
  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize html5-qrcode camera scanner
    const scanner = new Html5QrcodeScanner(
      'qr-reader-container',
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      async (scannedText) => {
        if (isProcessing) return;
        handleValidateTicket(scannedText);
      },
      (error) => {
        // quiet scan frame error
      }
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch((err) => console.warn('Scanner clear error:', err));
    };
  }, [selectedEventId]);

  const handleValidateTicket = async (ticketIdOrData: string) => {
    setIsProcessing(true);
    triggerHaptic('impact');

    const result = await processTicketCheckIn(
      ticketIdOrData,
      selectedEventId,
      user?.uid || 'staff_001',
      user?.fullName || 'Gate Staff',
      mockDataService.getState().tickets
    );

    setIsProcessing(false);
    setScanResult(result);

    if (result.success) {
      triggerHaptic('success');
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-20">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('landing')} className="text-slate-400 hover:text-white mr-1">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <QrCode className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-extrabold text-white">QR Ticket Scanner</h1>
          </div>

          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold">
            Entrance Gate Mode
          </span>
        </div>

        {/* Event Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Target Scanning Event *</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name} ({evt.date} • {evt.venue})
              </option>
            ))}
          </select>
        </div>

        {/* Camera View Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-2xl overflow-hidden text-center">
          <div className="flex items-center justify-between px-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Camera className="w-4 h-4 animate-pulse" /> Camera Scanner Ready
            </span>
            <span>Point camera at Ticket QR Code</span>
          </div>

          <div
            id="qr-reader-container"
            className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[260px]"
          />
        </div>

        {/* Manual Code Entry & Quick Test Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Or type Ticket ID (e.g. EVT-2026-8F72K91)..."
              value={manualTicketInput}
              onChange={(e) => setManualTicketInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow"
            >
              <Search className="w-3.5 h-3.5" /> Check Ticket
            </button>
          </form>

          {/* Quick Demo Test Buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Quick Test Ticket IDs:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleValidateTicket('EVT-2026-8F72K91')}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono px-2 py-0.5 rounded border border-slate-700"
              >
                Scan Ticket #1
              </button>
              <button
                onClick={() => handleValidateTicket('EVT-2026-3N89P44')}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono px-2 py-0.5 rounded border border-slate-700"
              >
                Scan Ticket #2
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SCAN RESULT MODAL */}
      {scanResult && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full rounded-3xl p-6 text-center space-y-5 shadow-2xl border-2 ${
              scanResult.success
                ? 'bg-slate-900 border-emerald-500 shadow-emerald-500/20'
                : scanResult.resultCode === 'already_used'
                ? 'bg-slate-900 border-red-500 shadow-red-500/20'
                : 'bg-slate-900 border-amber-500 shadow-amber-500/20'
            }`}
          >
            {/* Icon Header */}
            {scanResult.success ? (
              <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            ) : scanResult.resultCode === 'already_used' ? (
              <div className="w-20 h-20 bg-red-500/20 border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <XCircle className="w-12 h-12" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-amber-500/20 border-2 border-amber-500 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-12 h-12" />
              </div>
            )}

            {/* Title */}
            <div>
              <h2
                className={`text-2xl font-extrabold tracking-tight ${
                  scanResult.success
                    ? 'text-emerald-400'
                    : scanResult.resultCode === 'already_used'
                    ? 'text-red-500'
                    : 'text-amber-400'
                }`}
              >
                {scanResult.message}
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                {scanResult.success
                  ? 'Ticket verified successfully. Customer is allowed entry.'
                  : scanResult.resultCode === 'already_used'
                  ? 'WARNING: This ticket was already checked in!'
                  : 'Invalid ticket or ticket does not belong to this event.'}
              </p>
            </div>

            {/* Detailed Ticket info Box */}
            {scanResult.ticket && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Customer Name:</span>
                  <strong className="text-white text-sm">{scanResult.ticket.customerName}</strong>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Ticket Type:</span>
                  <span className="font-bold text-blue-400">{scanResult.ticket.ticketTypeName}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Ticket ID:</span>
                  <span className="font-mono font-bold text-amber-400">{scanResult.ticket.id}</span>
                </div>

                {scanResult.resultCode === 'already_used' && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1 text-red-300">
                    <p className="font-bold">First Check-in Record:</p>
                    <p>🕒 Time: {scanResult.checkedInAt || scanResult.ticket.checkedInAt}</p>
                    <p>👤 Scanned By: {scanResult.checkedInByName || scanResult.ticket.checkedInByName || 'Staff Member'}</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setScanResult(null)}
              className={`w-full py-3.5 font-extrabold text-xs rounded-xl shadow-lg transition ${
                scanResult.success
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              Scan Next Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
