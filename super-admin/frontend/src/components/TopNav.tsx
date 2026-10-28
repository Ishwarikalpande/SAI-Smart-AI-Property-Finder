import React from 'react';
import {
  Bell,
  RefreshCw,
  Search,
  Shield,
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { NavSection } from './Sidebar';

interface TopNavProps {
  currentSection: NavSection;
  onRefresh: () => void;
  loading: boolean;
  adminUser: any;
  onOpenNotifications: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentSection,
  onRefresh,
  loading,
  adminUser,
  onOpenNotifications,
}) => {
  const titles: Record<NavSection, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Overview', subtitle: 'Live ecosystem metrics and platform telemetry' },
    'users-all': { title: 'User Management', subtitle: 'Global user registry across all account types' },
    'users-buyers': { title: 'Buyer Management', subtitle: 'Verified buyers, search trends, and preferences' },
    'users-owners': { title: 'Owner Management', subtitle: 'Individual property owners, PAN and verification' },
    'users-agents': { title: 'Agent Management', subtitle: 'Licensed brokers, agency credentials, and RERA' },
    'users-builders': { title: 'Builder Management', subtitle: 'Real estate developers, projects, and corporate compliance' },
    properties: { title: 'Property Management', subtitle: 'Central listings registry and approval pipeline' },
    documents: { title: 'Document Verification', subtitle: 'AI-assisted OCR document inspection and validation' },
    kyc: { title: 'KYC Verification Desk', subtitle: 'Statutory identity proof verification workflow' },
    rera: { title: 'RERA Verification', subtitle: 'State Real Estate Regulatory Authority registry synchronization' },
    complaints: { title: 'Complaints & Reports', subtitle: 'User grievances, fraudulent listings, and investigations' },
    ai: { title: 'AI Assistant Operations', subtitle: 'Qwen multilingual conversational engine & telemetry' },
    analytics: { title: 'Platform Analytics', subtitle: 'Ecosystem growth trends, geographic distribution, and market insights' },
    notifications: { title: 'Notification Broadcasts', subtitle: 'Omnichannel broadcast delivery and targeting' },
    content: { title: 'Website Content (CMS)', subtitle: 'Manage homepage banners, categories, and FAQs' },
    settings: { title: 'System Settings', subtitle: 'Global platform configuration and verification policies' },
    security: { title: 'Security & Access Control', subtitle: 'Role permissions, TOTP 2FA, session policies, and rate limits' },
    'audit-logs': { title: 'Immutable Audit Trail', subtitle: 'Searchable administrative activity logs' },
  };

  const current = titles[currentSection] || { title: 'Control Center', subtitle: 'Administration' };

  return (
    <header className="sticky top-0 z-20 glass-panel border-b border-slate-800/80 px-8 py-4 flex items-center justify-between">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold font-heading text-white tracking-tight flex items-center space-x-2">
          <span>{current.title}</span>
          <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Internal Console
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">{current.subtitle}</p>
      </div>

      {/* Health Badges & Actions */}
      <div className="flex items-center space-x-4">
        {/* System Health Indicators */}
        <div className="hidden lg:flex items-center space-x-3 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">FastAPI: 8000</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5 text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-medium">Qwen AI: 8 Langs</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5 text-teal-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="font-medium">DB: Connected</span>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Data"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          title="Broadcast Alerts"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-800 relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-indigo-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-slate-950" />
        </button>

        {/* Admin Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-600/30">
            SA
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-white leading-tight">{adminUser?.name || 'Super Admin'}</p>
            <p className="text-[10px] text-emerald-400 font-medium">SUPER_ADMIN</p>
          </div>
        </div>
      </div>
    </header>
  );
};
