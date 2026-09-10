import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTelegram } from '../contexts/TelegramContext';
import { mockDataService } from '../services/mockDataService';
import {
  User,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Send,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface OrganizerRegistrationViewProps {
  onNavigate: (view: string) => void;
}

export const OrganizerRegistrationView: React.FC<OrganizerRegistrationViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { tgUser, showAlert, triggerHaptic } = useTelegram();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: user?.fullName || (tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : ''),
    phone: user?.phone || '',
    email: user?.email || '',
    telegramUsername: tgUser?.username || '',
    telegramUserId: tgUser ? String(tgUser.id) : '',

    // Step 2: Organization
    companyName: '',
    organizationType: 'Concerts & Entertainment',
    businessAddress: '',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    website: '',
    description: '',

    // Step 3: Event Business Info
    eventType: 'Music Festivals, Cultural Concerts & Live Shows',
    expectedEvents: '6 to 12 events per year',
    expectedAttendees: '1,000 - 5,000 attendees'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('impact');
    if (step < 4) {
      setStep((step + 1) as any);
    }
  };

  const handlePrev = () => {
    triggerHaptic('impact');
    if (step > 1) {
      setStep((step - 1) as any);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');

    mockDataService.addOrganization({
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

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white">Application Submitted!</h2>

          <div className="inline-block bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold">
            Status: PENDING ADMIN APPROVAL
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Your organization application for <strong className="text-slate-200">{formData.companyName}</strong> has been received by our platform Super Admin. You will receive a Telegram notification once reviewed.
          </p>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-left text-xs space-y-1.5 text-slate-300">
            <p><strong>Applicant:</strong> {formData.fullName}</p>
            <p><strong>Phone:</strong> {formData.phone}</p>
            <p><strong>Email:</strong> {formData.email}</p>
          </div>

          <button
            onClick={() => onNavigate('landing')}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
          >
            Back to Main Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-20">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('landing')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel
          </button>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Step {step} of 4
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-white">Register as Organizer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit your company & event details for Super Admin review.
          </p>
        </div>

        {/* Multi-step progress bar */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-blue-500 shadow-sm shadow-blue-500/50' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <form onSubmit={handleNext} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" /> Step 1 — Personal Information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Biniyam Worku"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+251911234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="organizer@company.et"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telegram Username</label>
                  <input
                    type="text"
                    name="telegramUsername"
                    value={formData.telegramUsername}
                    onChange={handleChange}
                    placeholder="@username"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telegram User ID</label>
                  <input
                    type="text"
                    name="telegramUserId"
                    value={formData.telegramUserId}
                    onChange={handleChange}
                    placeholder="e.g. 12345678"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              Continue to Organization Details <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Organization Info */}
        {step === 2 && (
          <form onSubmit={handleNext} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> Step 2 — Organization Information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Addis Concerts & Events PLC"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Organization Type *</label>
                  <select
                    name="organizationType"
                    value={formData.organizationType}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Concerts & Festivals">Concerts & Festivals</option>
                    <option value="Corporate & Tech Conferences">Corporate & Tech Conferences</option>
                    <option value="Sports & Fitness">Sports & Fitness</option>
                    <option value="Nightlife & Parties">Nightlife & Parties</option>
                    <option value="Arts & Theater">Arts & Theater</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City / Location *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Addis Ababa"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business Address *</label>
                <input
                  type="text"
                  name="businessAddress"
                  required
                  value={formData.businessAddress}
                  onChange={handleChange}
                  placeholder="e.g. Bole Road, Tower B, 4th Floor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Organization Website / Social Link</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://company.et"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company Description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief summary of your company and experience organizing events..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrev}
                className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                Continue to Event Business Info <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Event Business Info */}
        {step === 3 && (
          <form onSubmit={handleNext} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" /> Step 3 — Event Business Information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">What type of events do you organize? *</label>
                <input
                  type="text"
                  name="eventType"
                  required
                  value={formData.eventType}
                  onChange={handleChange}
                  placeholder="e.g. Open-air festivals, indoor galas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Number of Events / Year *</label>
                <select
                  name="expectedEvents"
                  value={formData.expectedEvents}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="1 to 3 events per year">1 to 3 events per year</option>
                  <option value="4 to 8 events per year">4 to 8 events per year</option>
                  <option value="9 to 15 events per year">9 to 15 events per year</option>
                  <option value="20+ events per year">20+ events per year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Average Attendees per Event *</label>
                <select
                  name="expectedAttendees"
                  value={formData.expectedAttendees}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="100 - 500 attendees">100 - 500 attendees</option>
                  <option value="500 - 2,000 attendees">500 - 2,000 attendees</option>
                  <option value="2,000 - 10,000 attendees">2,000 - 10,000 attendees</option>
                  <option value="10,000+ attendees">10,000+ attendees</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrev}
                className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                Review Application Summary <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Review & Submit */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Step 4 — Review & Submit Application
            </h2>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-slate-400 block">Organization</span>
                <span className="text-white font-bold text-sm">{formData.companyName}</span>
                <p className="text-slate-300 mt-0.5">{formData.organizationType} • {formData.city}, {formData.country}</p>
              </div>

              <div className="border-b border-slate-800 pb-2">
                <span className="text-slate-400 block">Personal Contact</span>
                <span className="text-slate-200 font-semibold">{formData.fullName}</span>
                <p className="text-slate-400">{formData.phone} • {formData.email}</p>
                {formData.telegramUsername && <p className="text-blue-400">Telegram: @{formData.telegramUsername}</p>}
              </div>

              <div>
                <span className="text-slate-400 block">Event Business Plan</span>
                <p className="text-slate-300">{formData.eventType}</p>
                <p className="text-slate-400">{formData.expectedEvents} | {formData.expectedAttendees}</p>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                Upon submission, your application status will be <strong className="text-white">pending</strong>. A Super Admin will review your credentials before you can publish events.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrev}
                className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" /> Submit Application
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
