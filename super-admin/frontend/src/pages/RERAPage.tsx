import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Search,
  CheckCircle,
  ExternalLink,
  Plus,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { fetchRERARegistrations, verifyRERA } from '../api/adminApi';
import { Badge } from '../components/Badge';

export const RERAPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    rera_number: '',
    project_name: '',
    promoter_name: '',
    state: 'Maharashtra',
    district: 'Pune',
    project_type: 'Residential',
  });
  const [saving, setSaving] = useState(false);

  const loadRERA = async () => {
    setLoading(true);
    try {
      const data = await fetchRERARegistrations();
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRERA();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await verifyRERA(formData);
      setShowAddModal(false);
      setFormData({
        rera_number: '',
        project_name: '',
        promoter_name: '',
        state: 'Maharashtra',
        district: 'Pune',
        project_type: 'Residential',
      });
      await loadRERA();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-heading text-white flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-indigo-400" />
            <span>State Real Estate Regulatory Authority (RERA) Registry</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized with official state portals (MahaRERA, Karnataka RERA, UP RERA)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add / Verify RERA Entry</span>
        </button>
      </div>

      {/* RERA Registry Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">RERA Number</th>
                <th className="py-3.5 px-4">Project Name</th>
                <th className="py-3.5 px-4">Promoter / Builder</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Project Type</th>
                <th className="py-3.5 px-4">Compliance Status</th>
                <th className="py-3.5 px-4">Verified Date</th>
                <th className="py-3.5 px-4 text-right">Official Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-sm">
                    Loading RERA records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 text-sm">
                    No RERA records cached
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 text-xs">
                      {r.rera_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white text-xs">
                      {r.project_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {r.promoter_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {r.district}, {r.state}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {r.project_type}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={r.verification_status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {r.verified_at ? new Date(r.verified_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.source_url ? (
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-600 text-xs">Internal</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Verify Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold font-heading text-white mb-4">
              Register &amp; Verify Project RERA Certificate
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  RERA Registration Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P52100024891"
                  value={formData.rera_number}
                  onChange={(e) => setFormData({ ...formData, rera_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prestige Heights Phase 2"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Promoter / Developer Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prestige Landmarks LLP"
                  value={formData.promoter_name}
                  onChange={(e) => setFormData({ ...formData, promoter_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    State Authority
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    District
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {saving ? 'Verifying...' : 'Save & Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
