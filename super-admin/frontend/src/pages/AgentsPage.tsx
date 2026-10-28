import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, Star, CheckCircle, XCircle } from 'lucide-react';
import { fetchAgents, verifyAgent } from '../api/adminApi';
import { Badge } from '../components/Badge';

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await fetchAgents(search);
      setAgents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, [search]);

  const handleVerifyToggle = async (agentId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'VERIFIED' ? 'REJECTED' : 'VERIFIED';
    try {
      await verifyAgent(agentId, nextStatus);
      await loadAgents();
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
            loadAgents();
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by agency, license, name..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>
        <span className="text-xs text-slate-400">Total Registered Agents: <strong>{agents.length}</strong></span>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Agent Profile</th>
                <th className="py-3.5 px-4">Agency / Brokerage</th>
                <th className="py-3.5 px-4">Broker License &amp; RERA</th>
                <th className="py-3.5 px-4">Rating &amp; Exp</th>
                <th className="py-3.5 px-4">Inventory</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">Loading agents...</td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 text-sm">No agents found</td>
                </tr>
              ) : (
                agents.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-white">{a.name}</p>
                        <p className="text-xs text-slate-400">{a.email} &bull; {a.phone || 'No phone'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {a.agency_name || 'Independent Agent'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      <div>Lic: {a.license_number || 'N/A'}</div>
                      <div className="text-[11px] text-indigo-400 font-semibold">{a.rera_id || 'RERA Pending'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div className="flex items-center space-x-1 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold">{a.rating || 4.9}</span>
                        <span className="text-slate-500">({a.experience_years}y exp)</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-purple-400">
                      {a.properties_count} listings
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={a.verification_status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleVerifyToggle(a.id, a.verification_status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          a.verification_status === 'VERIFIED'
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {a.verification_status === 'VERIFIED' ? 'Revoke License' : 'Verify License'}
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
