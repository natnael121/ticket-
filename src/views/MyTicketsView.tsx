import React, { useState } from 'react';
import { mockDataService } from '../services/mockDataService';
import { useAuth } from '../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, MapPin, CheckCircle2, Clock, XCircle, ChevronLeft } from 'lucide-react';

interface MyTicketsViewProps {
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'valid' | 'used'>('all');

  const customerTickets = mockDataService.getCustomerTickets(user?.phone || user?.email);
  const filteredTickets = customerTickets.filter((t) => {
    if (filter === 'valid') return t.status === 'valid';
    if (filter === 'used') return t.status === 'used';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-20">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('landing')} className="text-slate-400 hover:text-white mr-1">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <Ticket className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white">My Digital Tickets</h1>
          </div>
          <span className="text-xs text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
            {customerTickets.length} Passes
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'all' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400'
            }`}
          >
            All Tickets
          </button>
          <button
            onClick={() => setFilter('valid')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'valid' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Valid Passes
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'used' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Used Passes
          </button>
        </div>

        {/* Tickets Stack */}
        {filteredTickets.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Tickets Found</h3>
            <p className="text-xs text-slate-400">You have no active or historical tickets in your wallet yet.</p>
            <button
              onClick={() => onNavigate('landing')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                className={`relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border rounded-3xl overflow-hidden shadow-2xl transition ${
                  t.status === 'used' ? 'border-slate-800 opacity-75' : 'border-amber-500/40'
                }`}
              >
                {/* Top Ticket Stub */}
                <div className="p-6 border-b-2 border-dashed border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                      {t.organizationName || 'ABC Events'}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase flex items-center gap-1 ${
                        t.status === 'used'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {t.status === 'used' ? 'USED ✅' : 'VALID TICKET 🎟️'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-white leading-snug">{t.eventName}</h2>
                    <p className="text-xs font-semibold text-blue-400 mt-0.5">{t.ticketTypeName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Date & Time</span>
                        <strong className="text-slate-200">{t.eventDate} at {t.eventTime}</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Venue</span>
                        <strong className="text-slate-200">{t.venue}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Ticket Stub (QR Code & Identifier) */}
                <div className="p-6 bg-slate-950 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block">
                    <QRCodeSVG value={t.qrData || t.id} size={160} level="H" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                      Ticket ID / Scanner Identifier
                    </span>
                    <strong className="text-sm font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                      {t.id}
                    </strong>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1 border-t border-slate-900 w-full justify-center">
                    <span>Customer: <strong className="text-white">{t.customerName}</strong></span>
                    <span>•</span>
                    <span>Price: <strong className="text-emerald-400">{t.price} ETB</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
