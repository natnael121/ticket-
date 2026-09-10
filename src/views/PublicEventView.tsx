import React, { useState } from 'react';
import { mockDataService } from '../services/mockDataService';
import { useTelegram } from '../contexts/TelegramContext';
import { useAuth } from '../contexts/AuthContext';
import { ImgBBImageUploader } from '../components/common/ImgBBImageUploader';
import { TicketType } from '../types';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Building2,
  CheckCircle2,
  Share2,
  ArrowLeft,
  DollarSign,
  Phone,
  Info,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface PublicEventViewProps {
  eventId: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

export const PublicEventView: React.FC<PublicEventViewProps> = ({ eventId, onNavigate }) => {
  const { user } = useAuth();
  const { tgUser, triggerHaptic, showAlert } = useTelegram();

  const event = mockDataService.getEvent(eventId) || mockDataService.getEvents()[0];
  const organization = event ? mockDataService.getOrganization(event.organizationId) : null;
  const ticketTypes = event ? mockDataService.getTicketTypes(event.id) : [];

  // Checkout State
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(ticketTypes[0] || null);
  const [quantity, setQuantity] = useState(1);

  // Modal Flow
  const [checkoutStep, setCheckoutStep] = useState<'none' | 'register' | 'payment' | 'completed'>('none');

  // Registration Form State
  const [customerName, setCustomerName] = useState(user?.fullName || (tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : ''));
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+251911122334');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'customer@gmail.com');

  // Payment Form State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Telebirr');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold">Event Not Found</h2>
        <button onClick={() => onNavigate('landing')} className="mt-4 px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold">
          Back to Home
        </button>
      </div>
    );
  }

  const activeTicket = selectedTicketType || ticketTypes[0];
  const totalPrice = activeTicket ? activeTicket.price * quantity : 0;

  const handleShare = () => {
    triggerHaptic('impact');
    if (navigator.share) {
      navigator.share({
        title: event.name,
        text: `Get tickets for ${event.name} on Telegram!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showAlert('Event link copied to clipboard!');
    }
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('impact');
    setCheckoutStep('payment');
  };

  const handleFinalSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotUrl) {
      alert('Please upload your payment receipt screenshot via the ImgBB uploader.');
      return;
    }

    triggerHaptic('success');
    setIsSubmitting(true);

    mockDataService.submitOrderAndPayment(
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Nav */}
      <div className="bg-slate-900/90 backdrop-blur sticky top-0 z-30 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => onNavigate('landing')}
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>

        <button
          onClick={handleShare}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20"
        >
          <Share2 className="w-3.5 h-3.5" /> Share Event
        </button>
      </div>

      {/* Hero Banner */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
        <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4 max-w-2xl mx-auto space-y-2">
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/20 border border-blue-500/30 px-3 py-0.5 rounded-full">
            {event.organizationName || 'Verified Organizer'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-md">
            {event.name}
          </h1>
        </div>
      </div>

      {/* Main Details Container */}
      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* Key Info Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
              <Calendar className="w-4 h-4" /> Event Date
            </div>
            <p className="text-xs font-bold text-white">{event.date}</p>
            <p className="text-[11px] text-slate-400">{event.startTime} - {event.endTime}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
              <MapPin className="w-4 h-4" /> Venue
            </div>
            <p className="text-xs font-bold text-white">{event.venue}</p>
            <p className="text-[11px] text-slate-400">{event.address}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
              <Building2 className="w-4 h-4" /> Organizer
            </div>
            <p className="text-xs font-bold text-white">{organization?.name || event.organizationName}</p>
            <p className="text-[11px] text-slate-400">{organization?.ownerPhone || event.contactPhone}</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">About this event</h2>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{event.description}</p>
        </div>

        {/* Ticket Selection Options */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Ticket className="w-4 h-4 text-blue-400" /> Select Ticket Type
          </h2>

          <div className="space-y-3">
            {ticketTypes.map((tt) => {
              const isSelected = selectedTicketType?.id === tt.id;
              return (
                <div
                  key={tt.id}
                  onClick={() => setSelectedTicketType(tt)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{tt.name}</h3>
                      {isSelected && <span className="bg-blue-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">Selected</span>}
                    </div>
                    {tt.description && <p className="text-xs text-slate-400">{tt.description}</p>}
                    <span className="text-[11px] text-emerald-400 font-semibold block">
                      {tt.remainingQuantity} tickets remaining
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-mono font-extrabold text-white block">
                      {tt.price.toLocaleString()} ETB
                    </span>
                    <span className="text-[10px] text-slate-500">Max {tt.maxPerCustomer} / order</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Get Ticket Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Selected Ticket</span>
              <span className="text-sm font-extrabold text-white">
                {activeTicket?.name} • <strong className="text-emerald-400 font-mono">{activeTicket?.price} ETB</strong>
              </span>
            </div>

            <button
              onClick={() => setCheckoutStep('register')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              Get Ticket <Ticket className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* STEP 1: Registration Form Modal */}
      {checkoutStep === 'register' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Step 1 — Customer Registration</h3>
              <button onClick={() => setCheckoutStep('none')} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                <p className="text-slate-300 font-semibold">{event.name}</p>
                <p className="text-blue-400 font-bold">{activeTicket.name} ({activeTicket.price} ETB each)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Abebe Kebede"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+251911..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ticket Quantity *</label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map((q) => (
                      <option key={q} value={q}>{q} ticket{q > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-bold text-white">
                <span>Total Amount Due:</span>
                <span className="font-mono text-emerald-400 text-sm">{totalPrice.toLocaleString()} ETB</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Proceed to Payment Instructions
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: Payment Instructions & Screenshot Upload Modal */}
      {checkoutStep === 'payment' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Step 2 — Submit Payment & Screenshot</h3>
              <button onClick={() => setCheckoutStep('register')} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFinalSubmitPayment} className="space-y-4">
              {/* Payment Instruction Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-blue-500/30 space-y-3">
                <span className="text-[11px] font-bold uppercase text-blue-400 tracking-wider">
                  Organizer Payment Account Details
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Payment Method:</span>
                    <strong className="text-white font-bold">{selectedPaymentMethod}</strong>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Account Name:</span>
                    <strong className="text-white font-bold">{organization?.name || 'Addis Music Co.'}</strong>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Account Number:</span>
                    <strong className="text-emerald-400 font-mono font-bold text-sm">
                      {organization?.paymentMethods[0]?.accountNumber || '0911234567'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Exact Total:</span>
                    <strong className="text-white font-mono font-bold">{totalPrice.toLocaleString()} ETB</strong>
                  </div>
                </div>
              </div>

              {/* ImgBB Image Upload for Payment Receipt Screenshot */}
              <ImgBBImageUploader
                label="Upload Payment Receipt Screenshot (ImgBB Storage) *"
                value={screenshotUrl}
                onChange={(url) => setScreenshotUrl(url)}
                placeholder="Select or Drag Receipt Screenshot"
              />

              <button
                type="submit"
                disabled={isSubmitting || !screenshotUrl}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition"
              >
                Submit Payment for Organizer Approval
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 3: Completed Screen */}
      {checkoutStep === 'completed' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-white">Payment Submitted!</h2>

            <div className="inline-block bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              STATUS: PENDING ORGANIZER APPROVAL
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your payment screenshot has been uploaded to ImgBB and sent to <strong className="text-slate-200">{event.organizationName}</strong>. Once approved, your digital ticket with unique QR code will be issued automatically in Telegram!
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs space-y-1 text-slate-300">
              <p><strong>Event:</strong> {event.name}</p>
              <p><strong>Customer:</strong> {customerName}</p>
              <p><strong>Amount Paid:</strong> {totalPrice.toLocaleString()} ETB</p>
            </div>

            <button
              onClick={() => onNavigate('my_tickets')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Go to My Tickets Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
