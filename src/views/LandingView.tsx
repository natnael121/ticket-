import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTelegram } from '../contexts/TelegramContext';
import { mockDataService } from '../services/mockDataService';
import {
  Ticket,
  Building2,
  QrCode,
  ShieldCheck,
  Calendar,
  MapPin,
  ChevronRight,
  Sparkles,
  Users,
  CheckCircle2,
  PlusCircle,
  Send,
  UserCheck,
  Lock,
  ArrowRight
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const { user, role, telegramAuth, switchUserRole } = useAuth();
  const { tgUser, triggerHaptic } = useTelegram();

  const [showTelegramLoginModal, setShowTelegramLoginModal] = useState(false);
  const [manualUsername, setManualUsername] = useState('');

  const publishedEvents = mockDataService.getState().events.filter((e) => e.status === 'published');

  const handleTelegramAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    if (!manualUsername.trim()) return;

    telegramAuth({
      id: Date.now(),
      first_name: manualUsername.replace('@', ''),
      username: manualUsername.replace('@', ''),
      role: 'customer'
    });
    setShowTelegramLoginModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0e1621] text-slate-100 pb-20 font-sans">
      {/* Telegram Native Header */}
      <div className="bg-[#17212b] border-b border-slate-800/80 px-4 py-6 text-center space-y-4">
        {/* Telegram User Identity Bar */}
        <div className="max-w-md mx-auto">
          {user ? (
            <div className="bg-[#242f3d] border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-[#2481cc] text-white font-extrabold flex items-center justify-center text-sm shadow">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">{user.fullName}</span>
                  <span className="text-[11px] text-blue-400">
                    {user.telegramUsername ? `@${user.telegramUsername}` : 'Telegram Authenticated'}
                  </span>
                </div>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                {role.replace('_', ' ')}
              </span>
            </div>
          ) : (
            <div className="bg-[#242f3d] border border-slate-700/60 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Send className="w-4 h-4" /> Telegram Web App Platform
              </div>
              <p className="text-xs text-slate-300">
                Log in with your Telegram account to purchase event tickets and access ticket wallet.
              </p>
              <button
                onClick={() => {
                  if (tgUser) {
                    telegramAuth();
                  } else {
                    setShowTelegramLoginModal(true);
                  }
                }}
                className="w-full py-3 bg-[#2481cc] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4" /> Continue with Telegram
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1 pt-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Telegram Event Ticketing Platform
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Multi-tenant event ticketing, Telebirr/CBE payment verification, and instant entrance QR check-in.
          </p>
        </div>
      </div>

      {/* Main Telegram Action Cards Grid */}
      <div className="max-w-xl mx-auto px-4 mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('organizer_register')}
            className="p-4 rounded-2xl bg-[#17212b] border border-slate-800 hover:border-blue-500/50 shadow-md text-left flex flex-col justify-between group transition"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-extrabold text-white group-hover:text-blue-400 transition-colors">
                Register Company
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Submit application as Organizer
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              if (role !== 'organizer') switchUserRole('organizer');
              onNavigate('organizer_dashboard');
            }}
            className="p-4 rounded-2xl bg-[#17212b] border border-slate-800 hover:border-emerald-500/50 shadow-md text-left flex flex-col justify-between group transition"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                Organizer Dashboard
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Create events & manage payments
              </span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('my_tickets')}
            className="p-4 rounded-2xl bg-[#17212b] border border-slate-800 hover:border-amber-500/50 shadow-md text-left flex flex-col justify-between group transition"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-extrabold text-white group-hover:text-amber-400 transition-colors">
                My Digital Tickets
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                View your active QR passes
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              if (role !== 'staff') switchUserRole('staff');
              onNavigate('scanner');
            }}
            className="p-4 rounded-2xl bg-[#17212b] border border-slate-800 hover:border-purple-500/50 shadow-md text-left flex flex-col justify-between group transition"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-extrabold text-white group-hover:text-purple-400 transition-colors">
                Scan Entrance Ticket
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Camera QR check-in
              </span>
            </div>
          </button>
        </div>

        {/* Super Admin Access Card */}
        <button
          onClick={() => {
            switchUserRole('super_admin');
            onNavigate('super_admin_dashboard');
          }}
          className="w-full p-3.5 bg-[#17212b] border border-slate-800 hover:border-purple-500/40 rounded-2xl flex items-center justify-between text-left group transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Super Admin Control Hub</span>
              <span className="text-[11px] text-slate-400">Review pending company registrations & platform statistics</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-transform" />
        </button>
      </div>

      {/* Events Feed Section */}
      <div className="max-w-xl mx-auto px-4 mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Published Events ({publishedEvents.length})
          </h2>
        </div>

        {publishedEvents.length === 0 ? (
          <div className="bg-[#17212b] border border-slate-800/80 rounded-3xl p-8 text-center space-y-3 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Events Published Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Real organizers can register their company, submit applications for Super Admin review, and create the platform's first event!
            </p>
            <button
              onClick={() => onNavigate('organizer_register')}
              className="px-5 py-2.5 bg-[#2481cc] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow"
            >
              Register Company & Create Event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {publishedEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => onNavigate('public_event', { eventId: evt.id })}
                className="bg-[#17212b] rounded-2xl border border-slate-800 hover:border-blue-500/40 overflow-hidden shadow-lg cursor-pointer transition group"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                  <img src={evt.bannerUrl} alt={evt.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#17212b] via-transparent to-transparent" />
                </div>

                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                    {evt.organizationName}
                  </span>
                  <h3 className="text-base font-bold text-white">{evt.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{evt.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-300 font-medium">📅 {evt.date} • {evt.venue}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      Get Tickets <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TELEGRAM AUTHENTICATION MODAL */}
      {showTelegramLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#17212b] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" /> Telegram Login
              </h3>
              <button onClick={() => setShowTelegramLoginModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your Telegram Username or Name to authenticate your Telegram account session.
            </p>

            <form onSubmit={handleTelegramAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telegram Username / Name *</label>
                <input
                  type="text"
                  required
                  value={manualUsername}
                  onChange={(e) => setManualUsername(e.target.value)}
                  placeholder="@your_telegram_username"
                  className="w-full bg-[#0e1621] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#2481cc] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition"
              >
                <UserCheck className="w-4 h-4" /> Authenticate Telegram Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
