import React, { useState } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useTelegram } from '../contexts/TelegramContext';
import { mockDataService } from '../services/mockDataService';
import { ImgBBImageUploader } from '../components/common/ImgBBImageUploader';
import { PaymentSubmission, EventItem, TicketType } from '../types';
import {
  Building2,
  Calendar,
  Ticket,
  DollarSign,
  QrCode,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Eye,
  Users,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface OrganizerDashboardViewProps {
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

export const OrganizerDashboardView: React.FC<OrganizerDashboardViewProps> = ({ onNavigate }) => {
  const {
    currentOrganization,
    orgEvents,
    pendingPayments,
    approvedPayments,
    allOrders,
    allTickets,
    refreshOrgData,
    approvePayment,
    rejectPayment,
    createNewEvent
  } = useOrganization();

  const { triggerHaptic, showAlert } = useTelegram();

  // Modals & Active Tabs
  const [activeTab, setActiveTab] = useState<'events' | 'payments' | 'tickets' | 'analytics'>('events');
  const [selectedPayment, setSelectedPayment] = useState<PaymentSubmission | null>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showTicketTypeModal, setShowTicketTypeModal] = useState<string | null>(null); // eventId
  const [rejectionReason, setRejectionReason] = useState('');

  // Event Creation Form State
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    bannerUrl: '',
    logoUrl: '',
    date: '2026-11-15',
    startTime: '18:00',
    endTime: '23:00',
    venue: 'Millennium Hall',
    address: 'Bole Road, Addis Ababa',
    googleMapsUrl: '',
    contactPhone: '+251911234567'
  });

  // Ticket Type Form State
  const [ticketTypeForm, setTicketTypeForm] = useState({
    name: 'VIP Pass',
    description: 'VIP lounge access with complimentary drinks',
    price: 1500,
    totalQuantity: 100,
    maxPerCustomer: 5
  });

  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-400" />
        <h2 className="text-xl font-bold">No Active Organization</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          Please register your company or switch to an approved organizer role in the top demo switcher.
        </p>
        <button
          onClick={() => onNavigate('organizer_register')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
        >
          Register New Organization
        </button>
      </div>
    );
  }

  // Calculate Metrics
  const totalEvents = orgEvents.length;
  const activeEvents = orgEvents.filter((e) => e.status === 'published').length;
  const totalTicketsSold = orgEvents.reduce((sum, e) => sum + e.ticketsSold, 0);
  const totalRevenue = orgEvents.reduce((sum, e) => sum + e.revenue, 0);
  const checkedInTicketsCount = allTickets.filter((t) => t.status === 'used').length;
  const attendanceRate = totalTicketsSold > 0 ? Math.round((checkedInTicketsCount / totalTicketsSold) * 100) : 0;

  const handleApprovePaymentClick = (payment: PaymentSubmission) => {
    triggerHaptic('success');
    approvePayment(payment.id);
    showAlert(`Payment approved for ${payment.customerName}! Ticket issued and delivered.`);
    setSelectedPayment(null);
  };

  const handleRejectPaymentClick = (payment: PaymentSubmission) => {
    if (!rejectionReason.trim()) {
      alert('Please state why the payment screenshot was rejected.');
      return;
    }
    triggerHaptic('error');
    rejectPayment(payment.id, rejectionReason);
    showAlert(`Payment rejected for ${payment.customerName}.`);
    setSelectedPayment(null);
    setRejectionReason('');
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.bannerUrl) {
      alert('Please upload an event banner image using the ImgBB uploader.');
      return;
    }

    triggerHaptic('success');
    const newEvt = createNewEvent({
      organizationId: currentOrganization.id,
      organizationName: currentOrganization.name,
      name: eventForm.name,
      description: eventForm.description,
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
      totalQuantity: 500
    });

    // Create default ticket type
    mockDataService.addTicketType({
      eventId: newEvt.id,
      organizationId: currentOrganization.id,
      name: 'Regular Admission',
      description: 'General entry pass',
      price: 500,
      currency: 'ETB',
      totalQuantity: 500,
      remainingQuantity: 500,
      maxPerCustomer: 10
    });

    setShowCreateEventModal(false);
    showAlert(`Event "${newEvt.name}" published successfully!`);
    refreshOrgData();
  };

  const handleAddTicketTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTicketTypeModal) return;

    triggerHaptic('success');
    mockDataService.addTicketType({
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
    showAlert('New ticket type added!');
    refreshOrgData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-extrabold text-white">{currentOrganization.name}</h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase">
                {currentOrganization.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Organizer Admin Control Panel • {currentOrganization.city}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateEventModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition"
            >
              <PlusCircle className="w-4 h-4" /> Create New Event
            </button>
            <button
              onClick={() => onNavigate('scanner')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <QrCode className="w-4 h-4" /> Entrance Scanner
            </button>
          </div>
        </div>

        {/* Organizer Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Total Events</span>
            <p className="text-xl font-extrabold text-white">{totalEvents}</p>
            <span className="text-[10px] text-blue-400">{activeEvents} published</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Tickets Sold</span>
            <p className="text-xl font-extrabold text-white">{totalTicketsSold}</p>
            <span className="text-[10px] text-slate-400">Total volume</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Pending Payments</span>
            <p className="text-xl font-extrabold text-amber-400">{pendingPayments.length}</p>
            <span className="text-[10px] text-amber-400 font-semibold">Requires review</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Checked In</span>
            <p className="text-xl font-extrabold text-emerald-400">{checkedInTicketsCount}</p>
            <span className="text-[10px] text-slate-400">Gate scans</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Attendance Rate</span>
            <p className="text-xl font-extrabold text-purple-400">{attendanceRate}%</p>
            <span className="text-[10px] text-slate-400">Turnout percent</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Total Revenue</span>
            <p className="text-lg font-extrabold text-emerald-400">
              {totalRevenue.toLocaleString()} <span className="text-[10px]">ETB</span>
            </p>
            <span className="text-[10px] text-slate-400">Approved orders</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'events' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Events & Tickets ({orgEvents.length})
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'payments' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Pending Payments Approval
            {pendingPayments.length > 0 && (
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold">
                {pendingPayments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'tickets' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Issued Tickets ({allTickets.length})
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Analytics & Reports
          </button>
        </div>

        {/* TAB 1: Events & Tickets List */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {orgEvents.map((evt) => {
              const evtTicketTypes = mockDataService.getTicketTypes(evt.id);
              return (
                <div key={evt.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <img src={evt.bannerUrl} alt={evt.name} className="w-16 h-12 object-cover rounded-lg bg-slate-950" />
                      <div>
                        <h3 className="text-base font-bold text-white">{evt.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>📅 {evt.date} at {evt.startTime}</span>
                          <span>•</span>
                          <span>📍 {evt.venue}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('public_event', { eventId: evt.id })}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Public Page
                      </button>
                      <button
                        onClick={() => setShowTicketTypeModal(evt.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Add Ticket Type
                      </button>
                    </div>
                  </div>

                  {/* Ticket Types for Event */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Configured Ticket Types
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {evtTicketTypes.map((tt) => (
                        <div key={tt.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-xs text-white">{tt.name}</strong>
                            <span className="text-xs font-mono font-bold text-emerald-400">{tt.price} ETB</span>
                          </div>
                          {tt.description && <p className="text-[11px] text-slate-400 line-clamp-1">{tt.description}</p>}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                            <span>Remaining: {tt.remainingQuantity} / {tt.totalQuantity}</span>
                            <span>Max/cust: {tt.maxPerCustomer}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Pending Payments Approval Drawer */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {pendingPayments.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">No Pending Payments</h3>
                <p className="text-xs text-slate-400">All customer payment submissions have been reviewed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pendingPayments.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-sm font-bold text-white block">{p.customerName}</strong>
                        <span className="text-xs text-slate-400">{p.customerPhone}</span>
                      </div>
                      <span className="text-sm font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        {p.amount} ETB
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                      <p className="text-slate-300"><strong>Event:</strong> {p.eventName}</p>
                      <p className="text-slate-300"><strong>Method:</strong> {p.paymentMethod}</p>
                      <p className="text-slate-400"><strong>Submitted:</strong> {new Date(p.createdAt).toLocaleString()}</p>
                    </div>

                    {/* Screenshot Preview */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Payment Screenshot (ImgBB)</span>
                      <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="block relative rounded-xl overflow-hidden group bg-slate-950 border border-slate-800 h-36">
                        <img src={p.screenshotUrl} alt="Payment receipt" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Eye className="w-4 h-4" /> Expand Receipt
                        </div>
                      </a>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApprovePaymentClick(p)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve & Issue Ticket
                      </button>
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs rounded-xl flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Issued Tickets */}
        {activeTab === 'tickets' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-4 space-y-4">
            <h3 className="text-sm font-bold text-white">Issued Digital Tickets</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Event & Ticket Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Issued Date</th>
                    <th className="p-3">Check-in Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {allTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-amber-400">{t.id}</td>
                      <td className="p-3">
                        <strong className="text-white block">{t.customerName}</strong>
                        <span className="text-slate-400">{t.customerPhone}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-200 block font-medium">{t.eventName}</span>
                        <span className="text-blue-400">{t.ticketTypeName} ({t.price} ETB)</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            t.status === 'used'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {t.status === 'used' ? 'USED ✅' : 'VALID 🎟️'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{new Date(t.issuedAt).toLocaleDateString()}</td>
                      <td className="p-3 text-[11px]">
                        {t.status === 'used' ? (
                          <span className="text-purple-300">Scanned by {t.checkedInByName || 'Staff'} at {new Date(t.checkedInAt!).toLocaleTimeString()}</span>
                        ) : (
                          <span className="text-slate-500">Not checked in</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Analytics */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Revenue Breakdown
              </h3>
              <div className="space-y-2">
                {orgEvents.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-xs p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-300 font-medium">{e.name}</span>
                    <span className="font-mono font-bold text-emerald-400">{e.revenue.toLocaleString()} ETB</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> Gate Turnout Percentage
              </h3>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                <p className="text-3xl font-extrabold text-purple-400">{attendanceRate}%</p>
                <p className="text-xs text-slate-400">
                  {checkedInTicketsCount} out of {totalTicketsSold} tickets scanned at entrance gates
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE EVENT MODAL */}
      {showCreateEventModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Event</h3>
              <button onClick={() => setShowCreateEventModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Name *</label>
                <input
                  type="text"
                  required
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  placeholder="e.g. Ethiopian Tech & Music Night 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Description *</label>
                <textarea
                  rows={3}
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Full event schedule, artist lineups, and venue guidelines..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* ImgBB Image Upload */}
              <ImgBBImageUploader
                label="Event Banner Image (ImgBB Upload) *"
                value={eventForm.bannerUrl}
                onChange={(url) => setEventForm({ ...eventForm, bannerUrl: url })}
                placeholder="Upload Event Banner to ImgBB"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Venue Name *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    placeholder="e.g. Millennium Hall"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.contactPhone}
                    onChange={(e) => setEventForm({ ...eventForm, contactPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD TICKET TYPE MODAL */}
      {showTicketTypeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add Ticket Type</h3>
              <button onClick={() => setShowTicketTypeModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddTicketTypeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ticket Type Name *</label>
                <input
                  type="text"
                  required
                  value={ticketTypeForm.name}
                  onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, name: e.target.value })}
                  placeholder="VIP Pass, Student Pass, Early Bird"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ticket Price (ETB) *</label>
                <input
                  type="number"
                  required
                  value={ticketTypeForm.price}
                  onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Quantity *</label>
                  <input
                    type="number"
                    required
                    value={ticketTypeForm.totalQuantity}
                    onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, totalQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Per Customer</label>
                  <input
                    type="number"
                    required
                    value={ticketTypeForm.maxPerCustomer}
                    onChange={(e) => setTicketTypeForm({ ...ticketTypeForm, maxPerCustomer: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Save Ticket Type
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REJECT PAYMENT MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" /> Reject Payment: {selectedPayment.customerName}
            </h3>

            <p className="text-xs text-slate-400">
              State the reason why the payment screenshot for {selectedPayment.amount} ETB was rejected.
            </p>

            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Payment amount does not match ticket total or transaction ID not clear."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSelectedPayment(null)}
                className="py-2.5 px-4 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectPaymentClick(selectedPayment)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow"
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
