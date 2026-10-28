import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  FileText,
  ShieldCheck,
  Landmark,
  AlertTriangle,
  Bot,
  BarChart3,
  Bell,
  Globe,
  Settings,
  Lock,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  LogOut,
  Building,
  User,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'users-all'
  | 'users-buyers'
  | 'users-owners'
  | 'users-agents'
  | 'users-builders'
  | 'properties'
  | 'documents'
  | 'kyc'
  | 'rera'
  | 'complaints'
  | 'ai'
  | 'analytics'
  | 'notifications'
  | 'content'
  | 'settings'
  | 'security'
  | 'audit-logs';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onLogout: () => void;
  adminUser: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  onLogout,
  adminUser,
}) => {
  const [usersExpanded, setUsersExpanded] = useState(
    currentSection.startsWith('users-')
  );

  const isUserSectionActive = currentSection.startsWith('users-');

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-heading font-extrabold text-lg tracking-tight text-white">SAI</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Admin</span>
            </div>
            <p className="text-[11px] text-slate-400">Control Center</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 text-sm font-medium">
        {/* Dashboard */}
        <button
          onClick={() => onSelectSection('dashboard')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'dashboard'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {/* Users Group */}
        <div>
          <button
            onClick={() => setUsersExpanded(!usersExpanded)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
              isUserSectionActive && !usersExpanded
                ? 'bg-slate-900 text-indigo-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </div>
            {usersExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {usersExpanded && (
            <div className="mt-1 ml-4 pl-3 border-l border-slate-800 space-y-1 py-1">
              <button
                onClick={() => onSelectSection('users-all')}
                className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs transition ${
                  currentSection === 'users-all'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>All Users</span>
              </button>
              <button
                onClick={() => onSelectSection('users-buyers')}
                className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs transition ${
                  currentSection === 'users-buyers'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>Buyers</span>
              </button>
              <button
                onClick={() => onSelectSection('users-owners')}
                className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs transition ${
                  currentSection === 'users-owners'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>Owners</span>
              </button>
              <button
                onClick={() => onSelectSection('users-agents')}
                className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs transition ${
                  currentSection === 'users-agents'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>Agents</span>
              </button>
              <button
                onClick={() => onSelectSection('users-builders')}
                className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs transition ${
                  currentSection === 'users-builders'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>Builders</span>
              </button>
            </div>
          )}
        </div>

        {/* Properties */}
        <button
          onClick={() => onSelectSection('properties')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'properties'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Properties</span>
        </button>

        {/* Documents */}
        <button
          onClick={() => onSelectSection('documents')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'documents'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents</span>
        </button>

        {/* KYC Verification */}
        <button
          onClick={() => onSelectSection('kyc')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'kyc'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>KYC Verification</span>
        </button>

        {/* RERA Verification */}
        <button
          onClick={() => onSelectSection('rera')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'rera'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>RERA Verification</span>
        </button>

        {/* Complaints & Reports */}
        <button
          onClick={() => onSelectSection('complaints')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'complaints'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Complaints & Reports</span>
        </button>

        {/* AI Management */}
        <button
          onClick={() => onSelectSection('ai')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'ai'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Management</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => onSelectSection('analytics')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'analytics'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => onSelectSection('notifications')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'notifications'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        {/* Website Content */}
        <button
          onClick={() => onSelectSection('content')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'content'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Website Content</span>
        </button>

        {/* System Settings */}
        <button
          onClick={() => onSelectSection('settings')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'settings'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System Settings</span>
        </button>

        {/* Security */}
        <button
          onClick={() => onSelectSection('security')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'security'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security</span>
        </button>

        {/* Audit Logs */}
        <button
          onClick={() => onSelectSection('audit-logs')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
            currentSection === 'audit-logs'
              ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>
      </div>

      {/* Admin User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{adminUser?.name || 'Super Admin'}</p>
            <p className="text-[11px] text-slate-400 truncate">{adminUser?.email || 'admin@sai.in'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
