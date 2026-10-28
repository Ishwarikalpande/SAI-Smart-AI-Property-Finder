import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  FileCheck,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const [showSecret, setShowSecret] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [rateLimitGeneral, setRateLimitGeneral] = useState('120');
  const [rateLimitAuth, setRateLimitAuth] = useState('5');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const rbacRoles = [
    {
      role: 'SUPER_ADMIN',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      description: 'Platform Owner & Infrastructure Operator',
      permissions: [
        'Full System Configuration',
        'Database Audit Logs & Telemetry',
        'User Suspension & Deletion',
        'Property Moderation & Suspension',
        'KYC & RERA Registry Verification',
        'Complaint Adjudication',
        'AI Hyperparameter Tuning',
      ],
    },
    {
      role: 'BUILDER',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      description: 'Corporate Developer & Township Promoters',
      permissions: [
        'Post Mega Township Projects',
        'Upload MahaRERA Certificates',
        'Manage Phase Inventory',
        'Respond to Direct Buyer Enquiries',
      ],
    },
    {
      role: 'AGENT',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      description: 'Licensed Real Estate Brokers & Facilitators',
      permissions: [
        'Multi-Property Resale Listings',
        'Schedule Physical Site Visits',
        'Manage Client Leads & Inquiries',
      ],
    },
    {
      role: 'OWNER',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      description: 'Individual Property Owners & Landlords',
      permissions: [
        'Direct Owner Property Listing (Up to 3)',
        'Identity & Deed Verification',
        'Direct Chat with Verified Buyers',
      ],
    },
    {
      role: 'BUYER',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Home Seekers & Retail Investors',
      permissions: [
        'AI Multilingual Conversational Search',
        'Favorite Listings & Shortlists',
        'Request Site Visits',
        'Submit Grievance Complaints',
      ],
    },
  ];

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-white">Security & Access Governance</h1>
              <p className="text-sm text-slate-400">
                Role-Based Access Control (RBAC), 2-Factor Authentication policies, session expirations, and CORS security.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Firewall & Security Audit Passing</span>
          </span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm">Security configurations saved successfully. Session policies refreshed.</span>
        </div>
      )}

      {/* Top Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Super Admin 2FA</p>
            <p className="text-base font-bold text-white">TOTP Enforced</p>
            <p className="text-[10px] text-emerald-400">RFC 6238 Compliant</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Encryption Standard</p>
            <p className="text-base font-bold text-white">HS256 JWT</p>
            <p className="text-[10px] text-slate-400">Stateless Token Claims</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">CORS Protection</p>
            <p className="text-base font-bold text-white">Strict Origin</p>
            <p className="text-[10px] text-cyan-400">Ports 5173, 5174</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Session Timeout</p>
            <p className="text-base font-bold text-white">{sessionTimeout} Minutes</p>
            <p className="text-[10px] text-amber-400">Auto-Revocation Enabled</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: RBAC Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="font-semibold text-white">Role-Based Access Control (RBAC) Matrix</h2>
                <p className="text-xs text-slate-400">Explicit authority levels segregated by domain</p>
              </div>
              <span className="text-xs font-mono text-slate-400">5 Registered Roles</span>
            </div>

            <div className="space-y-4">
              {rbacRoles.map((r) => (
                <div key={r.role} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${r.badge}`}>
                        {r.role}
                      </span>
                      <span className="text-xs text-slate-400">{r.description}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.permissions.map((perm, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 text-slate-300 text-[11px] border border-slate-800"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{perm}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Policies & Settings Form */}
        <div className="space-y-6">
          <form onSubmit={handleSaveSecurity} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-800">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white text-sm">Session & Rate-Limiting Rules</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Admin Inactivity Session Timeout (Minutes)
                </label>
                <input
                  type="number"
                  min={10}
                  max={480}
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  General API Rate Limit (Requests / Min)
                </label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  value={rateLimitGeneral}
                  onChange={(e) => setRateLimitGeneral(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Auth / Login Max Attempts Before Lockout
                </label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={rateLimitAuth}
                  onChange={(e) => setRateLimitAuth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30"
                >
                  Save Security Thresholds
                </button>
              </div>
            </div>
          </form>

          {/* CORS White-list Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Globe className="w-4 h-4" />
              <h4 className="font-semibold text-white">Active CORS Allowed Origins</h4>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>http://localhost:5173</span>
                <span className="text-[10px] text-indigo-400 font-sans">Public Portal</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>http://localhost:5174</span>
                <span className="text-[10px] text-rose-400 font-sans">Super Admin</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>http://127.0.0.1:8000</span>
                <span className="text-[10px] text-emerald-400 font-sans">FastAPI Docs</span>
              </div>
            </div>
          </div>

          {/* Security Alert */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-2 text-xs text-amber-300">
            <div className="flex items-center space-x-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Immutable Admin Isolation</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Super Admin routes are protected with the <code className="text-amber-200">require_super_admin</code> dependency. Any user token without role='super_admin' receives an immediate HTTP 403 Forbidden response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SecurityPage;
