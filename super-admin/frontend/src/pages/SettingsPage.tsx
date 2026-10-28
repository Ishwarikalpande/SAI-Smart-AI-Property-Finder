import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Server,
  Shield,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { fetchSystemSettings, saveSystemSettings } from '../api/adminApi';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [platformName, setPlatformName] = useState('Smart AI Property Finder');
  const [supportEmail, setSupportEmail] = useState('support@sai.in');
  const [supportPhone, setSupportPhone] = useState('+91 20 6700 8900');
  const [defaultCity, setDefaultCity] = useState('Pune');
  const [maxUploadSize, setMaxUploadSize] = useState(15);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [propertyAutoApproval, setPropertyAutoApproval] = useState(false);
  const [kycMandatory, setKycMandatory] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchSystemSettings();
      if (res && res.settings) {
        setSettings(res.settings);
        const s = res.settings;
        if (s.platform_name?.value !== undefined) setPlatformName(s.platform_name.value);
        if (s.support_email?.value !== undefined) setSupportEmail(s.support_email.value);
        if (s.support_phone?.value !== undefined) setSupportPhone(s.support_phone.value);
        if (s.default_city?.value !== undefined) setDefaultCity(s.default_city.value);
        if (s.max_upload_size_mb?.value !== undefined) setMaxUploadSize(Number(s.max_upload_size_mb.value));
        if (s.maintenance_mode?.value !== undefined) setMaintenanceMode(Boolean(s.maintenance_mode.value));
        if (s.property_auto_approval?.value !== undefined) setPropertyAutoApproval(Boolean(s.property_auto_approval.value));
        if (s.kyc_mandatory?.value !== undefined) setKycMandatory(Boolean(s.kyc_mandatory.value));
      }
    } catch (err: any) {
      console.error('Failed to load settings', err);
      setMessage({ type: 'error', text: 'Failed to load system settings from backend database.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload: Record<string, any> = {
      platform_name: { value: platformName },
      support_email: { value: supportEmail },
      support_phone: { value: supportPhone },
      default_city: { value: defaultCity },
      max_upload_size_mb: { value: Number(maxUploadSize) },
      maintenance_mode: { value: maintenanceMode },
      property_auto_approval: { value: propertyAutoApproval },
      kyc_mandatory: { value: kycMandatory },
    };

    try {
      await saveSystemSettings(payload);
      setMessage({ type: 'success', text: 'System configuration updated and committed to database successfully.' });
      loadSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update system settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-white">System Settings & Configuration</h1>
              <p className="text-sm text-slate-400">
                Manage global platform switches, compliance policies, customer support channels, and defaults.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-sm font-medium transition"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3" />
          <p className="text-sm">Querying active platform configurations from database...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* General Settings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                  <Server className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h2 className="font-semibold text-white">General Platform Identity</h2>
                    <p className="text-xs text-slate-400">Basic brand naming and public customer care contact points</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none transition"
                      placeholder="Smart AI Property Finder"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Default Market / City
                    </label>
                    <input
                      type="text"
                      value={defaultCity}
                      onChange={(e) => setDefaultCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none transition"
                      placeholder="Pune"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Support Email Address
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none transition"
                      placeholder="support@sai.in"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Support Helpline / Phone
                    </label>
                    <input
                      type="text"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none transition"
                      placeholder="+91 20 6700 8900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Max Upload File Size (MB)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={maxUploadSize}
                      onChange={(e) => setMaxUploadSize(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none transition"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Operational Policies */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h2 className="font-semibold text-white">Trust, Moderation & KYC Governance</h2>
                    <p className="text-xs text-slate-400">Controls for listing approvals and user onboarding compliance</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-white">Mandatory KYC Verification</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Enforced</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Sellers, Agents, and Builders must complete Aadhar / PAN / RERA verification before listings go live.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={kycMandatory}
                        onChange={(e) => setKycMandatory(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-white">Property Auto-Approval</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Manual Moderation Recommended</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        When disabled, every newly submitted listing remains in 'Pending' until reviewed in Super Admin.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={propertyAutoApproval}
                        onChange={(e) => setPropertyAutoApproval(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-rose-300">Platform Maintenance Mode</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Emergency Lockdown</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Disables public user registrations and property submissions while platform upgrades take place.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Cards */}
            <div className="space-y-6">
              {/* Database Telemetry */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center space-x-2.5 text-indigo-400">
                  <Layers className="w-5 h-5" />
                  <h3 className="font-semibold text-white text-sm">Database & Environment</h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Database Engine</span>
                    <span className="text-slate-200 font-mono">SQLite (sai.db)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Backend API</span>
                    <span className="text-slate-200 font-mono">FastAPI / Port 8000</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Super Admin App</span>
                    <span className="text-slate-200 font-mono">Vite / Port 5174</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Main User Portal</span>
                    <span className="text-slate-200 font-mono">Vite / Port 5173</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-400">System Timezone</span>
                    <span className="text-slate-200 font-mono">Asia/Kolkata (IST)</span>
                  </div>
                </div>
              </div>

              {/* AI Quick Info */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center space-x-2.5 text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-semibold text-white text-sm">Active AI Model</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Natural language search and bilingual Marathi/Hindi/English query resolution is managed in the AI Management module.
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model:</span>
                    <span className="text-cyan-300 font-mono font-semibold">{settings.ai_model?.value || 'qwen2.5:7b'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Languages:</span>
                    <span className="text-slate-200 font-medium">8 Languages</span>
                  </div>
                </div>
              </div>

              {/* Help & Documentation Note */}
              <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-2xl p-5 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <Info className="w-4 h-4 shrink-0" />
                  <h4 className="font-semibold text-xs text-indigo-200">Configuration Propagation</h4>
                </div>
                <p className="text-xs text-indigo-300/80 leading-relaxed">
                  All configuration switches persist directly to the system_settings table and take effect immediately across all FastAPI worker threads.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
export default SettingsPage;
