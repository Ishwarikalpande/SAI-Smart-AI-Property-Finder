import React, { useState, useEffect } from 'react';
import { Search, Landmark, Building2, CheckCircle, XCircle } from 'lucide-react';
import { fetchBuilders, verifyBuilder } from '../api/adminApi';
import { Badge } from '../components/Badge';

export const BuildersPage: React.FC = () => {
  const [builders, setBuilders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBuilders = async () => {
    setLoading(true);
    try {
      const data = await fetchBuilders(search);
      setBuilders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuilders();
  }, [search]);

  const handleVerifyToggle = async (builderId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'VERIFIED' ? 'REJECTED' : 'VERIFIED';
    try {
      await verifyBuilder(builderId, nextStatus);
      await loadBuilders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadBuilders();
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search builders by company, registration, RERA..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>
        <span className="text-xs text-slate-400">Total Developers: <strong>{builders.length}</strong></span>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Developer Entity</th>
                <th className="py-3.5 px-4">Corporate Reg &amp; RERA</th>
                <th className="py-3.5 px-4">Projects</th>
                <th className="py-3.5 px-4">Units Listed</th>
                <th className="py-3.5 px-4">Compliance Status</th>
                <th className="py-3.5 px-4 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">Loading builders...</td>
                </tr>
              ) : builders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 text-sm">No builders found</td>
                </tr>
              ) : (
                builders.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-white">{b.company_name || b.name}</p>
                        <p className="text-xs text-slate-400">{b.email} &bull; {b.phone || 'No phone'}</p>
                        {b.office_address && <p className="text-[11px] text-slate-500 truncate max-w-xs">{b.office_address}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      <div>Reg: {b.developer_registration_no || 'Pending'}</div>
                      <div className="text-[11px] text-indigo-400 font-semibold">{b.rera_id || 'RERA-Pending'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-blue-400">
                      {b.projects_count} townships / projects
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-teal-400">
                      {b.properties_count} units
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={b.verification_status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleVerifyToggle(b.id, b.verification_status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          b.verification_status === 'VERIFIED'
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {b.verification_status === 'VERIFIED' ? 'Revoke Approval' : 'Approve Developer'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
