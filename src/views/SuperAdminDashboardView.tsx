import React, { useState } from 'react';
import { mockDataService } from '../services/mockDataService';
import { Organization } from '../types';
import { useTelegram } from '../contexts/TelegramContext';
import {
  ShieldCheck, Building2, CheckCircle2, XCircle,
  Users, Ticket, DollarSign, Search, Eye, ChevronLeft, AlertCircle
} from 'lucide-react';

interface Props { onNavigate: (view: string) => void; }

export const SuperAdminDashboardView: React.FC<Props> = ({ onNavigate }) => {
  const { triggerHaptic, showAlert } = useTelegram();
  const [activeTab, setActiveTab] = useState<'pending' | 'all_orgs' | 'transactions'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectionModalOrg, setRejectionModalOrg] = useState<Organization | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const stats = mockDataService.getPlatformStats();
  const organizations = mockDataService.getOrganizations();
  const state = mockDataService.getState();
  const pendingOrgs = organizations.filter((o) => o.status === 'pending');
  const filteredOrgs = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = (orgId: string, orgName: string) => {
    triggerHaptic('success');
    mockDataService.updateOrganizationStatus(orgId, 'approved');
    showAlert(`"${orgName}" has been APPROVED!`);
    window.location.reload();
  };
  const handleConfirmReject = () => {
    if (!rejectionModalOrg || !rejectionReason.trim()) return;
    triggerHaptic('error');
    mockDataService.updateOrganizationStatus(rejectionModalOrg.id, 'rejected', rejectionReason);
    showAlert(`"${rejectionModalOrg.name}" has been REJECTED.`);
    setRejectionModalOrg(null);
    window.location.reload();
  };
  const handleSuspend = (orgId: string, orgName: string) => {
    triggerHaptic('warning');
    mockDataService.updateOrganizationStatus(orgId, 'suspended');
    showAlert(`"${orgName}" is now SUSPENDED.`);
    window.location.reload();
  };

  return (
    <div className="tg-page">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="tg-header">
        <button className="tg-header__back" onClick={() => onNavigate('landing')}>
          <ChevronLeft style={{ width: 20, height: 20 }} />
        </button>
        <span className="tg-header__title">Super Admin</span>
        <span className="tg-pill tg-pill--purple">Admin</span>
      </div>

      <div className="tg-content">

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div className="tg-stat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Building2 style={{ width: 15, height: 15, color: 'var(--tg-accent)' }} />
              <span className="tg-stat__label">Companies</span>
            </div>
            <span className="tg-stat__value">{stats.totalOrganizations}</span>
            <span className="tg-stat__sub" style={{ color: 'var(--tg-amber)' }}>{stats.pendingOrganizations} pending</span>
          </div>
          <div className="tg-stat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Users style={{ width: 15, height: 15, color: 'var(--tg-green)' }} />
              <span className="tg-stat__label">Active Events</span>
            </div>
            <span className="tg-stat__value">{stats.activeEvents}</span>
            <span className="tg-stat__sub">Published</span>
          </div>
          <div className="tg-stat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ticket style={{ width: 15, height: 15, color: 'var(--tg-amber)' }} />
              <span className="tg-stat__label">Tickets Issued</span>
            </div>
            <span className="tg-stat__value">{stats.totalTicketsIssued}</span>
            <span className="tg-stat__sub" style={{ color: 'var(--tg-green)' }}>{stats.totalTicketsCheckedIn} checked in</span>
          </div>
          <div className="tg-stat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <DollarSign style={{ width: 15, height: 15, color: 'var(--tg-purple)' }} />
              <span className="tg-stat__label">Revenue</span>
            </div>
            <span className="tg-stat__value" style={{ fontSize: 16 }}>{stats.totalRevenue.toLocaleString()}</span>
            <span className="tg-stat__sub">ETB total</span>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="tg-tabs" style={{ padding: '0 0 12px' }}>
          <button className={`tg-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            Pending {pendingOrgs.length > 0 && <span style={{ background: 'var(--tg-amber)', color: '#000', borderRadius: 99, padding: '1px 6px', fontSize: 10, marginLeft: 4 }}>{pendingOrgs.length}</span>}
          </button>
          <button className={`tg-tab ${activeTab === 'all_orgs' ? 'active' : ''}`} onClick={() => setActiveTab('all_orgs')}>
            All Orgs ({organizations.length})
          </button>
          <button className={`tg-tab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            Transactions ({state.payments.length})
          </button>
        </div>

        {/* ── Pending Tab ─────────────────────────────────────────────── */}
        {activeTab === 'pending' && (
          <div>
            {pendingOrgs.length === 0 ? (
              <div style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', padding: '40px 20px', textAlign: 'center' }}>
                <CheckCircle2 style={{ width: 44, height: 44, color: 'var(--tg-green)', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--tg-text)' }}>All Clear</div>
                <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginTop: 6 }}>No pending applications.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingOrgs.map((org) => (
                  <div key={org.id} style={{ background: 'var(--tg-bg)', borderRadius: 'var(--tg-radius-lg)', overflow: 'hidden' }}>
                    {/* Org header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 'var(--tg-radius-sm)', background: 'rgba(36,129,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 style={{ width: 22, height: 22, color: 'var(--tg-accent)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--tg-text)' }}>{org.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginTop: 2 }}>{org.type} · {new Date(org.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <span className="tg-pill tg-pill--amber">Pending</span>
                    </div>

                    {/* Details */}
                    <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--tg-hint)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>Owner</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tg-text)' }}>{org.ownerName}</div>
                        <div style={{ fontSize: 12, color: 'var(--tg-hint)' }}>{org.ownerPhone}</div>
                        {org.telegramUsername && <div style={{ fontSize: 12, color: 'var(--tg-accent)' }}>@{org.telegramUsername}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--tg-hint)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>Location</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tg-text)' }}>{org.city}, {org.country}</div>
                        <div style={{ fontSize: 12, color: 'var(--tg-hint)' }}>{org.businessAddress}</div>
                      </div>
                    </div>

                    {org.description && (
                      <div style={{ padding: '0 16px 12px', fontSize: 13, color: 'var(--tg-hint)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        "{org.description}"
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--tg-divider)', display: 'flex', gap: 10 }}>
                      <button className="tg-btn tg-btn--success tg-btn--sm" style={{ flex: 1 }} onClick={() => handleApprove(org.id, org.name)}>
                        <CheckCircle2 style={{ width: 16, height: 16 }} /> Approve
                      </button>
                      <button className="tg-btn tg-btn--danger tg-btn--sm" style={{ flex: 1 }} onClick={() => { setRejectionModalOrg(org); setRejectionReason(''); }}>
                        <XCircle style={{ width: 16, height: 16 }} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── All Orgs Tab ─────────────────────────────────────────────── */}
        {activeTab === 'all_orgs' && (
          <div>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search style={{ width: 16, height: 16, color: 'var(--tg-hint)', position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="tg-input"
                style={{ paddingLeft: 42 }}
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="tg-section">
              {filteredOrgs.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--tg-hint)', fontSize: 14 }}>No results found</div>
              ) : filteredOrgs.map((org) => (
                <div key={org.id} className="tg-cell" style={{ cursor: 'default' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--tg-radius-sm)', background: 'rgba(36,129,204,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 style={{ width: 20, height: 20, color: 'var(--tg-accent)' }} />
                  </div>
                  <div className="tg-cell__body">
                    <div className="tg-cell__title">{org.name}</div>
                    <div className="tg-cell__subtitle">{org.ownerName} · {org.city}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={`tg-pill ${org.status === 'approved' ? 'tg-pill--green' : org.status === 'pending' ? 'tg-pill--amber' : 'tg-pill--red'}`}>
                      {org.status}
                    </span>
                    {org.status === 'pending' && (
                      <button className="tg-btn tg-btn--success tg-btn--sm" style={{ padding: '4px 10px', width: 'auto' }} onClick={() => handleApprove(org.id, org.name)}>Approve</button>
                    )}
                    {org.status === 'approved' && (
                      <button className="tg-btn tg-btn--danger tg-btn--sm" style={{ padding: '4px 10px', width: 'auto' }} onClick={() => handleSuspend(org.id, org.name)}>Suspend</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Transactions Tab ─────────────────────────────────────────── */}
        {activeTab === 'transactions' && (
          <div className="tg-section">
            {state.payments.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--tg-hint)', fontSize: 14 }}>No transactions yet</div>
            ) : state.payments.map((p) => (
              <div key={p.id} className="tg-cell" style={{ cursor: 'default' }}>
                <div style={{ width: 42, height: 42, borderRadius: 'var(--tg-radius-sm)', background: 'rgba(77,205,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DollarSign style={{ width: 20, height: 20, color: 'var(--tg-green)' }} />
                </div>
                <div className="tg-cell__body">
                  <div className="tg-cell__title">{p.customerName}</div>
                  <div className="tg-cell__subtitle">{p.eventName} · {p.paymentMethod}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--tg-green)' }}>{p.amount} ETB</span>
                  <span className={`tg-pill ${p.status === 'approved' ? 'tg-pill--green' : p.status === 'pending' ? 'tg-pill--amber' : 'tg-pill--red'}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="spacer-16" />
      </div>

      {/* ── Reject Sheet ────────────────────────────────────────────── */}
      {rejectionModalOrg && (
        <div className="tg-overlay" onClick={() => setRejectionModalOrg(null)}>
          <div className="tg-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="tg-sheet__handle" />
            <div className="tg-sheet__title">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--tg-red)' }}>
                <XCircle style={{ width: 18, height: 18 }} />
                Reject: {rejectionModalOrg.name}
              </span>
              <button className="tg-sheet__close" onClick={() => setRejectionModalOrg(null)}>✕</button>
            </div>
            <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 14, color: 'var(--tg-hint)', lineHeight: 1.6, margin: 0 }}>
                Provide the reason for rejecting this application.
              </p>
              <div>
                <label className="tg-label">Rejection Reason</label>
                <textarea
                  className="tg-input"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete business verification documents..."
                  style={{ resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="tg-btn tg-btn--secondary" style={{ flex: 1 }} onClick={() => setRejectionModalOrg(null)}>Cancel</button>
                <button className="tg-btn tg-btn--danger" style={{ flex: 1 }} onClick={handleConfirmReject}>Confirm Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
