import React from 'react';
import {
  Users,
  Building,
  Building2,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Bot,
  TrendingUp,
  Sparkles,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Landmark,
  Layers,
  Search,
  MessageSquare,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { NavSection } from '../components/Sidebar';

interface DashboardPageProps {
  metrics: any;
  loading: boolean;
  onNavigate: (section: NavSection) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  loading,
  onNavigate,
}) => {
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-3">
          <span className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading ecosystem telemetry...</p>
        </div>
      </div>
    );
  }

  const m = metrics || {
    total_users: 0,
    total_buyers: 0,
    total_owners: 0,
    total_agents: 0,
    total_builders: 0,
    total_properties: 0,
    pending_properties: 0,
    approved_properties: 0,
    rejected_properties: 0,
    active_listings: 0,
    featured_properties: 0,
    pending_kyc: 0,
    verified_users: 0,
    rejected_verification: 0,
    pending_documents: 0,
    verified_documents: 0,
    open_complaints: 0,
    open_reports: 0,
    total_ai_searches: 0,
    total_ai_recommendations: 0,
    recent_activities: [],
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Platform Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>SAI Autonomous Real Estate Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Smart AI Property Finder Operations
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Central orchestration hub for multi-role user accounts, AI tool executions, statutory verification (KYC/MahaRERA), and property moderation.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => onNavigate('kyc')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Review KYC Queue ({m.pending_kyc})</span>
            </button>
            <button
              onClick={() => onNavigate('properties')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition border border-slate-700 flex items-center space-x-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Listing Moderation</span>
            </button>
            <button
              onClick={() => onNavigate('complaints')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition border border-slate-700 flex items-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Open Tickets ({m.open_complaints})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Core Platform Numbers */}
      <div>
        <h3 className="text-base font-bold font-heading text-white mb-4 flex items-center space-x-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <span>User Ecosystem Distribution</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Users"
            value={m.total_users}
            icon={<Users className="w-5 h-5 text-indigo-400" />}
            color="indigo"
            subtitle="Registered Platform Accounts"
          />
          <StatCard
            title="Buyers"
            value={m.total_buyers}
            icon={<Users className="w-5 h-5 text-sky-400" />}
            color="sky"
            subtitle="Active House Hunters"
          />
          <StatCard
            title="Owners"
            value={m.total_owners}
            icon={<Building className="w-5 h-5 text-teal-400" />}
            color="emerald"
            subtitle="Direct Sellers"
          />
          <StatCard
            title="Agents"
            value={m.total_agents}
            icon={<Building2 className="w-5 h-5 text-purple-400" />}
            color="purple"
            subtitle="Licensed Brokers"
          />
          <StatCard
            title="Builders"
            value={m.total_builders}
            icon={<Landmark className="w-5 h-5 text-blue-400" />}
            color="sky"
            subtitle="Real Estate Developers"
          />
        </div>
      </div>

      {/* 2. Property Listings & Moderation */}
      <div>
        <h3 className="text-base font-bold font-heading text-white mb-4 flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Property Listings &amp; Status Pipeline</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Inventory"
            value={m.total_properties}
            icon={<Building2 className="w-5 h-5 text-emerald-400" />}
            color="emerald"
            subtitle="All Properties in Database"
          />
          <StatCard
            title="Active Listings"
            value={m.active_listings}
            icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
            color="emerald"
            subtitle="Live & Discoverable"
          />
          <StatCard
            title="Pending Approval"
            value={m.pending_properties}
            icon={<Clock className="w-5 h-5 text-amber-400" />}
            color="amber"
            subtitle="Needs Super Admin Review"
          />
          <StatCard
            title="Rejected Listings"
            value={m.rejected_properties}
            icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
            color="rose"
            subtitle="Non-compliant / Flagged"
          />
          <StatCard
            title="Featured Properties"
            value={m.featured_properties}
            icon={<Sparkles className="w-5 h-5 text-indigo-400" />}
            color="indigo"
            subtitle="Sponsored / AI Picks"
          />
        </div>
      </div>

      {/* 3. Verification & Safety */}
      <div>
        <h3 className="text-base font-bold font-heading text-white mb-4 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Statutory Compliance &amp; Document Verification</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Documents"
            value={m.pending_documents}
            icon={<FileText className="w-5 h-5 text-amber-400" />}
            color="amber"
            subtitle="OCR & Inspection Queue"
          />
          <StatCard
            title="Verified Documents"
            value={m.verified_documents}
            icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
            color="emerald"
            subtitle="Authenticated Records"
          />
          <StatCard
            title="Open Complaints"
            value={m.open_complaints}
            icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
            color="rose"
            subtitle="User Grievance Tickets"
          />
          <StatCard
            title="Pending Reports"
            value={m.open_reports}
            icon={<ShieldAlert className="w-5 h-5 text-rose-400" />}
            color="rose"
            subtitle="Flagged Property Reports"
          />
        </div>
      </div>

      {/* 4. AI Engine Telemetry & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Stats Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold font-heading text-white">Qwen AI Engine Telemetry</h4>
              </div>
              <Badge status="ACTIVE" size="sm" />
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Real-time conversational tool-calling grounded across all verified database records.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <Search className="w-4 h-4 text-indigo-400" />
                  <span>Natural Language Searches</span>
                </div>
                <span className="font-bold text-white text-sm">{m.total_ai_searches}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Recommendations</span>
                </div>
                <span className="font-bold text-white text-sm">{m.total_ai_recommendations}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Supported Indic Languages</span>
                </div>
                <span className="font-bold text-emerald-400 text-sm">Exactly 8</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai')}
            className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition flex items-center justify-center space-x-2"
          >
            <span>View Full AI Console</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Live Audit Log Feed */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h4 className="font-bold font-heading text-white">Live Administrative Audit Feed</h4>
            </div>
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View All Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[320px] overflow-y-auto">
            {m.recent_activities && m.recent_activities.length > 0 ? (
              m.recent_activities.map((act: any) => (
                <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-white tracking-wide">{act.action}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Target: {act.entity_type || 'System'} #{act.entity_id || '-'}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-500 text-[11px] whitespace-nowrap">
                    {act.created_at ? new Date(act.created_at).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs py-8 text-center">No recent audit events</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
