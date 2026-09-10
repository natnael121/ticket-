import React, { useState } from 'react';
import { mockDataService } from '../services/mockDataService';
import { Organization } from '../types';
import { useTelegram } from '../contexts/TelegramContext';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Ticket,
  DollarSign,
  Search,
  Eye,
  Filter
} from 'lucide-react';

interface SuperAdminDashboardViewProps {
  onNavigate: (view: string) => void;
}

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({ onNavigate }) => {
  const { triggerHaptic, showAlert } = useTelegram();
  const [activeTab, setActiveTab] = useState<'pending' | 'all_orgs' | 'transactions'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectionModalOrg, setRejectionModalOrg] = useState<Organization | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const stats = mockDataService.getPlatformStats();
  const organizations = mockDataService.getOrganizations();
  const state = mockDataService.getState();

  const pendingOrgs = organizations.filter((o) => o.status === 'pending');
  const filteredOrgs = organizations.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = (orgId: string, orgName: string) => {
    triggerHaptic('success');
    mockDataService.updateOrganizationStatus(orgId, 'approved');
    showAlert(`Organization "${orgName}" has been APPROVED! The organizer can now create and publish events.`);
    window.location.reload();
  };

  const handleOpenRejectModal = (org: Organization) => {
    setRejectionModalOrg(org);
    setRejectionReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectionModalOrg) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    triggerHaptic('error');
    mockDataService.updateOrganizationStatus(rejectionModalOrg.id, 'rejected', rejectionReason);
    showAlert(`Organization "${rejectionModalOrg.name}" has been REJECTED.`);
    setRejectionModalOrg(null);
    window.location.reload();
  };

  const handleSuspend = (orgId: string, orgName: string) => {
    if (confirm(`Are you sure you want to SUSPEND "${orgName}"? They will no longer be able to publish events.`)) {
      triggerHaptic('warning');
      mockDataService.updateOrganizationStatus(orgId, 'suspended');
      showAlert(`Organization "${orgName}" is now SUSPENDED.`);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-extrabold text-white">Super Admin Dashboard</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Platform Overview & Organization Approval Control
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              Super Admin Mode
            </span>
          </div>
        </div>

        {/* Platform Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Companies</span>
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">{stats.totalOrganizations}</p>
            <p className="text-[11px] text-amber-400 font-medium">{stats.pendingOrganizations} pending approval</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Active Events</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">{stats.activeEvents}</p>
            <p className="text-[11px] text-slate-400">Published across platform</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Tickets Issued</span>
              <Ticket className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">{stats.totalTicketsIssued}</p>
            <p className="text-[11px] text-emerald-400 font-medium">{stats.totalTicketsCheckedIn} checked in</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">
              {stats.totalRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-400">ETB</span>
            </p>
            <p className="text-[11px] text-slate-400">{stats.pendingPaymentsCount} payments pending review</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Pending Applications
            {pendingOrgs.length > 0 && (
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold">
                {pendingOrgs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('all_orgs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'all_orgs'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            All Organizations ({organizations.length})
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Global Payment Transactions ({state.payments.length})
          </button>
        </div>

        {/* TAB 1: Pending Applications */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingOrgs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">No Pending Applications</h3>
                <p className="text-xs text-slate-400">All company registration requests have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrgs.map((org) => (
                  <div
                    key={org.id}
                    className="bg-slate-900 border border-slate-800 hover:border-purple-500/30 rounded-2xl p-5 space-y-4 shadow-lg transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{org.name}</h3>
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase">
                            Pending Review
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {org.type} • Registered {new Date(org.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(org.id, org.name)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition shadow"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(org)}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs rounded-xl flex items-center gap-1 transition"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                        <span className="text-slate-400 block text-[11px]">Owner / Representative</span>
                        <strong className="text-slate-200 block text-xs">{org.ownerName}</strong>
                        <p className="text-slate-400 mt-0.5">{org.ownerPhone}</p>
                        <p className="text-slate-400">{org.ownerEmail}</p>
                        {org.telegramUsername && <p className="text-blue-400">@{org.telegramUsername}</p>}
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                        <span className="text-slate-400 block text-[11px]">Location & Address</span>
                        <strong className="text-slate-200 block text-xs">{org.city}, {org.country}</strong>
                        <p className="text-slate-400 mt-0.5">{org.businessAddress}</p>
                        {org.website && <a href={org.website} target="_blank" rel="noreferrer" className="text-blue-400 underline block mt-1">{org.website}</a>}
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                        <span className="text-slate-400 block text-[11px]">Event Business Projection</span>
                        <strong className="text-slate-200 block text-xs">{org.expectedEvents}</strong>
                        <p className="text-slate-400 mt-0.5">{org.expectedAttendees}</p>
                      </div>
                    </div>

                    {org.description && (
                      <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40 italic">
                        "{org.description}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: All Organizations */}
        {activeTab === 'all_orgs' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search organizations by name, owner, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Organization</th>
                      <th className="p-3.5">Owner Contact</th>
                      <th className="p-3.5">Type & City</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrgs.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-white">
                          {org.name}
                          <span className="block text-[11px] font-normal text-slate-400">ID: {org.id}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-200 block">{org.ownerName}</span>
                          <span className="text-slate-400">{org.ownerEmail}</span>
                        </td>
                        <td className="p-3.5">
                          <span>{org.type}</span>
                          <span className="block text-slate-400">{org.city}</span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              org.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : org.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {org.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {org.status === 'pending' && (
                            <button
                              onClick={() => handleApprove(org.id, org.name)}
                              className="px-2.5 py-1 bg-emerald-600 text-slate-950 font-bold rounded text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                          {org.status === 'approved' && (
                            <button
                              onClick={() => handleSuspend(org.id, org.name)}
                              className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold rounded text-[11px]"
                            >
                              Suspend
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Global Payment Transactions */}
        {activeTab === 'transactions' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-4 p-4">
            <h3 className="text-sm font-bold text-white">Global Payment Submissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Screenshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {state.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">
                        {p.customerName}
                        <span className="block text-[11px] text-slate-400">{p.customerPhone}</span>
                      </td>
                      <td className="p-3 text-slate-200">{p.eventName}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">{p.amount} ETB</td>
                      <td className="p-3 text-slate-300">{p.paymentMethod}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : p.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <a
                          href={p.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 underline text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View ImgBB
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModalOrg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" /> Reject Application: {rejectionModalOrg.name}
            </h3>

            <p className="text-xs text-slate-400">
              Please enter the official reason for rejecting this company registration. The applicant will see this status in Telegram.
            </p>

            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete business verification documents or invalid contact details."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectionModalOrg(null)}
                className="py-2.5 px-4 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
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
