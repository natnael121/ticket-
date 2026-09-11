import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTelegram } from '../contexts/TelegramContext';
import { firestoreService } from '../services/firestoreService';
import { Organization } from '../types';
import {
  User, Building2, Calendar, CheckCircle2,
  ArrowRight, ArrowLeft, Send, Clock, ShieldAlert, ChevronLeft,
  XCircle, RefreshCw
} from 'lucide-react';

interface Props { onNavigate: (view: string) => void; }

export const OrganizerRegistrationView: React.FC<Props> = ({ onNavigate }) => {
  const { user, updateUserProfile, switchUserRole } = useAuth();
  const { tgUser, showAlert, triggerHaptic } = useTelegram();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrg, setSubmittedOrg] = useState<Organization | null>(null);

  // Check if user already has an org registered
  const [existingOrg, setExistingOrg] = useState<Organization | null>(() => {
    if (!user?.organizationId) return null;
    return firestoreService.getOrganization(user.organizationId) || null;
  });

  // Poll for approval status changes
  useEffect(() => {
    if (!existingOrg && !submittedOrg) return;
    const orgId = (existingOrg || submittedOrg)?.id;
    if (!orgId) return;
    const interval = setInterval(() => {
      const fresh = firestoreService.getOrganization(orgId);
      if (fresh) {
        if (existingOrg) setExistingOrg(fresh);
        else setSubmittedOrg(fresh);
        // If approved, upgrade user role
        if (fresh.status === 'approved' && user) {
          updateUserProfile({ role: 'organizer', organizationId: fresh.id });
          switchUserRole('organizer', fresh.id);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [existingOrg?.id, submittedOrg?.id]);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || (tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : ''),
    phone: user?.phone || '',
    email: user?.email || '',
    telegramUsername: tgUser?.username || user?.telegramUsername || '',
    telegramUserId: tgUser ? String(tgUser.id) : user?.telegramUserId || '',
    companyName: '',
    organizationType: 'Concerts & Festivals',
    businessAddress: '',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    website: '',
    description: '',
    eventType: 'Music Festivals, Cultural Concerts & Live Shows',
    expectedEvents: '4 to 8 events per year',
    expectedAttendees: '500 - 2,000 attendees'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('impact');
    if (step < 4) setStep((step + 1) as any);
  };

  const handlePrev = () => {
    triggerHaptic('impact');
    if (step > 1) setStep((step - 1) as any);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    triggerHaptic('success');

    const newOrg = firestoreService.addOrganization({
      name: formData.companyName,
      type: formData.organizationType,
      businessAddress: formData.businessAddress,
      city: formData.city,
      country: formData.country,
      website: formData.website,
      description: formData.description,
      ownerUserId: user?.uid || `user_${Date.now()}`,
      ownerName: formData.fullName,
      ownerPhone: formData.phone,
      ownerEmail: formData.email,
      telegramUserId: formData.telegramUserId,
      telegramUsername: formData.telegramUsername,
      expectedEvents: formData.expectedEvents,
      expectedAttendees: formData.expectedAttendees
    });

    // ✅ Link org to user profile so OrganizationContext can find it
    updateUserProfile({ organizationId: newOrg.id });

    setIsSubmitting(false);
    setSubmittedOrg(newOrg);
  };

  // ── If user already has a registered org ────────────────────────────────────
  const displayOrg = existingOrg || submittedOrg;
  if (displayOrg) {
    return (
      <div className="tg-page">
        <div className="tg-header">
          <button className="tg-header__back" onClick={() => onNavigate('landing')}>
            <ChevronLeft style={{ width: 20, height: 20 }} />
          </button>
          <span className="tg-header__title">Organization Status</span>
        </div>

        <div className="tg-content" style={{ paddingTop: 24 }}>
          {/* Status Icon */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: displayOrg.status === 'approved'
                ? 'rgba(77,205,94,0.15)'
                : displayOrg.status === 'rejected'
                ? 'rgba(229,57,53,0.15)'
                : 'rgba(245,166,35,0.15)'
            }}>
              {displayOrg.status === 'approved'
                ? <CheckCircle2 style={{ width: 44, height: 44, color: 'var(--tg-green)' }} />
                : displayOrg.status === 'rejected'
                ? <XCircle style={{ width: 44, height: 44, color: 'var(--tg-red)' }} />
                : <Clock style={{ width: 44, height: 44, color: 'var(--tg-amber)' }} />
              }
            </div>
            <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--tg-text)', marginBottom: 8 }}>
              {displayOrg.status === 'approved' ? 'Application Approved!' :
               displayOrg.status === 'rejected' ? 'Application Rejected' :
               'Application Submitted'}
            </div>
            <span className={`tg-pill ${
              displayOrg.status === 'approved' ? 'tg-pill--green' :
              displayOrg.status === 'rejected' ? 'tg-pill--red' : 'tg-pill--amber'
            }`} style={{ fontSize: 12, padding: '4px 16px' }}>
              {displayOrg.status === 'approved' ? '✓ APPROVED' :
               displayOrg.status === 'rejected' ? '✕ REJECTED' :
               '⏳ PENDING REVIEW'}
            </span>
          </div>

          {/* Org Card */}
          <div className="tg-section" style={{ marginBottom: 12 }}>
            <div className="tg-section__header">Organization Details</div>
            {[
              { label: 'Company Name', value: displayOrg.name },
              { label: 'Type', value: displayOrg.type },
              { label: 'City', value: `${displayOrg.city}, ${displayOrg.country}` },
              { label: 'Owner', value: displayOrg.ownerName },
              { label: 'Phone', value: displayOrg.ownerPhone },
              { label: 'Status', value: displayOrg.status.toUpperCase() },
              ...(displayOrg.approvedAt ? [{ label: 'Approved', value: new Date(displayOrg.approvedAt).toLocaleDateString() }] : []),
              ...(displayOrg.rejectionReason ? [{ label: 'Reason', value: displayOrg.rejectionReason }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="tg-cell" style={{ cursor: 'default' }}>
                <div className="tg-cell__body">
                  <div className="tg-cell__subtitle">{label}</div>
                  <div className="tg-cell__title" style={{ fontSize: 14 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Status-specific message */}
          {displayOrg.status === 'pending' && (
            <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 'var(--tg-radius)', padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <RefreshCw style={{ width: 16, height: 16, color: 'var(--tg-amber)' }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--tg-amber)' }}>Checking for updates…</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.5, margin: 0 }}>
                Your application is waiting for Super Admin review. This page auto-refreshes every 2 seconds. Once approved, you'll be taken directly to your organizer dashboard.
              </p>
            </div>
          )}

          {displayOrg.status === 'approved' && (
            <button
              className="tg-btn tg-btn--primary"
              onClick={() => {
                switchUserRole('organizer', displayOrg.id);
                onNavigate('organizer_dashboard');
              }}
            >
              <ArrowRight style={{ width: 18, height: 18 }} />
              Go to Organizer Dashboard
            </button>
          )}

          {displayOrg.status === 'rejected' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.5 }}>
                Your application was rejected. Please review the reason above and contact support or submit a new application.
              </p>
              <button className="tg-btn tg-btn--secondary" onClick={() => onNavigate('landing')}>
                Back to Home
              </button>
            </div>
          )}

          {displayOrg.status === 'pending' && (
            <button className="tg-btn tg-btn--secondary" style={{ marginTop: 8 }} onClick={() => onNavigate('landing')}>
              Back to Home
            </button>
          )}

          <div className="spacer-16" />
        </div>
      </div>
    );
  }

  // ── Multi-step Registration Form ─────────────────────────────────────────────
  return (
    <div className="tg-page">
      <div className="tg-header">
        <button className="tg-header__back" onClick={() => onNavigate('landing')}>
          <ChevronLeft style={{ width: 20, height: 20 }} />
        </button>
        <span className="tg-header__title">Register as Organizer</span>
        <span style={{ fontSize: 12, color: 'var(--tg-hint)', fontWeight: 600 }}>Step {step}/4</span>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 12px 0', background: 'var(--tg-bg)' }}>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} style={{
            flex: 1, height: 3, borderRadius: 99, transition: 'background 0.3s',
            background: s <= step ? 'var(--tg-accent)' : 'var(--tg-surface)'
          }} />
        ))}
      </div>

      <div className="tg-content">

        {/* ── STEP 1: Personal Info ────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="tg-section__header" style={{ padding: '14px 0 4px' }}>
              Personal Information
            </div>
            <div className="tg-section">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)' }}>
                <label className="tg-label">Full Name *</label>
                <input className="tg-input" name="fullName" required value={formData.fullName} onChange={handleChange} placeholder="e.g. Biniyam Worku" />
              </div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)' }}>
                <label className="tg-label">Phone Number *</label>
                <input className="tg-input" type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="+251911234567" />
              </div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)' }}>
                <label className="tg-label">Email Address *</label>
                <input className="tg-input" type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="organizer@company.et" />
              </div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)' }}>
                <label className="tg-label">Telegram Username</label>
                <input className="tg-input" name="telegramUsername" value={formData.telegramUsername} onChange={handleChange} placeholder="@username" />
              </div>
              <div style={{ padding: '14px 16px' }}>
                <label className="tg-label">Telegram User ID</label>
                <input className="tg-input" name="telegramUserId" value={formData.telegramUserId} onChange={handleChange} placeholder="12345678" />
              </div>
            </div>
            <button type="submit" className="tg-btn tg-btn--primary">
              Continue <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
          </form>
        )}

        {/* ── STEP 2: Organization Info ────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="tg-section__header" style={{ padding: '14px 0 4px' }}>
              Organization Information
            </div>
            <div className="tg-section">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)' }}>
                <label className="tg-label">Company / Organization Name *</label>
                <input className="tg-input" name="companyName" required value={formData.companyName} onChange={handleChange} placeholder="e.g. Addis Concerts & Events PLC" />
              </div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)' }}>
                <label className="tg-label">Organization Type *</label>
                <select className="tg-input" name="organizationType" value={formData.organizationType} onChange={handleChange} style={{ appearance: 'none' }}>
                  <option>Concerts & Festivals</option>
                  <option>Corporate & Tech Conferences</option>
                  <option>Sports & Fitness</option>
                  <option>Nightlife & Parties</option>
                  <option>Arts & Theater</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)' }}>
                <label className="tg-label">City *</label>
                <input className="tg-input" name="city" required value={formData.city} onChange={handleChange} placeholder="Addis Ababa" />
              </div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)' }}>
                <label className="tg-label">Business Address *</label>
                <input className="tg-input" name="businessAddress" required value={formData.businessAddress} onChange={handleChange} placeholder="Bole Road, Tower B, 4th Floor" />
              </div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)' }}>
                <label className="tg-label">Website / Social Link</label>
                <input className="tg-input" type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://company.et" />
              </div>
              <div style={{ padding: '14px 16px' }}>
                <label className="tg-label">Company Description</label>
                <textarea className="tg-input" name="description" rows={3} value={formData.description} onChange={handleChange} placeholder="Brief description of your company…" style={{ resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="tg-btn tg-btn--secondary" style={{ flex: '0 0 80px' }} onClick={handlePrev}>
                Back
              </button>
              <button type="submit" className="tg-btn tg-btn--primary" style={{ flex: 1 }}>
                Continue <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Event Business Info ──────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="tg-section__header" style={{ padding: '14px 0 4px' }}>
              Event Business Information
            </div>
            <div className="tg-section">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)' }}>
                <label className="tg-label">Type of Events *</label>
                <input className="tg-input" name="eventType" required value={formData.eventType} onChange={handleChange} placeholder="e.g. Open-air festivals, indoor galas" />
              </div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tg-divider)' }}>
                <label className="tg-label">Expected Events per Year *</label>
                <select className="tg-input" name="expectedEvents" value={formData.expectedEvents} onChange={handleChange} style={{ appearance: 'none' }}>
                  <option>1 to 3 events per year</option>
                  <option>4 to 8 events per year</option>
                  <option>9 to 15 events per year</option>
                  <option>20+ events per year</option>
                </select>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <label className="tg-label">Expected Avg. Attendees per Event *</label>
                <select className="tg-input" name="expectedAttendees" value={formData.expectedAttendees} onChange={handleChange} style={{ appearance: 'none' }}>
                  <option>100 - 500 attendees</option>
                  <option>500 - 2,000 attendees</option>
                  <option>2,000 - 10,000 attendees</option>
                  <option>10,000+ attendees</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="tg-btn tg-btn--secondary" style={{ flex: '0 0 80px' }} onClick={handlePrev}>Back</button>
              <button type="submit" className="tg-btn tg-btn--primary" style={{ flex: 1 }}>
                Review Application <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 4: Review & Submit ──────────────────────────────── */}
        {step === 4 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="tg-section__header" style={{ padding: '14px 0 4px' }}>
              Review & Submit
            </div>

            <div className="tg-section">
              <div className="tg-cell" style={{ cursor: 'default' }}>
                <div className="tg-cell__body">
                  <div className="tg-cell__subtitle">Organization</div>
                  <div className="tg-cell__title">{formData.companyName}</div>
                </div>
              </div>
              <div className="tg-cell" style={{ cursor: 'default' }}>
                <div className="tg-cell__body">
                  <div className="tg-cell__subtitle">Type & City</div>
                  <div className="tg-cell__title">{formData.organizationType} · {formData.city}</div>
                </div>
              </div>
              <div className="tg-cell" style={{ cursor: 'default' }}>
                <div className="tg-cell__body">
                  <div className="tg-cell__subtitle">Owner / Contact</div>
                  <div className="tg-cell__title">{formData.fullName}</div>
                  <div className="tg-cell__subtitle">{formData.phone} · {formData.email}</div>
                </div>
              </div>
              <div className="tg-cell" style={{ cursor: 'default' }}>
                <div className="tg-cell__body">
                  <div className="tg-cell__subtitle">Event Plan</div>
                  <div className="tg-cell__title">{formData.expectedEvents}</div>
                  <div className="tg-cell__subtitle">{formData.expectedAttendees}</div>
                </div>
              </div>
            </div>

            {/* Warning notice */}
            <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 'var(--tg-radius)', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <ShieldAlert style={{ width: 18, height: 18, color: 'var(--tg-amber)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.5, margin: 0 }}>
                Your application will be reviewed by the Super Admin. You'll be notified via Telegram once approved.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="tg-btn tg-btn--secondary" style={{ flex: '0 0 80px' }} onClick={handlePrev}>Back</button>
              <button type="submit" className="tg-btn tg-btn--primary" style={{ flex: 1 }} disabled={isSubmitting}>
                <Send style={{ width: 18, height: 18 }} />
                {isSubmitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}

        <div className="spacer-16" />
      </div>
    </div>
  );
};
