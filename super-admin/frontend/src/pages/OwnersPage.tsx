import React, { useState, useEffect } from 'react';
import { Search, Building, FileCheck } from 'lucide-react';
import { fetchOwners } from '../api/adminApi';
import { Badge } from '../components/Badge';

export const OwnersPage: React.FC = () => {
  const [owners, setOwners] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOwners = async () => {
    setLoading(true);
    try {
      const data = await fetchOwners(search);
      setOwners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, [search]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadOwners();
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search owners by name, email..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>
        <span className="text-xs text-slate-400">Total Owners: <strong>{owners.length}</strong></span>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Owner Profile</th>
                <th className="py-3.5 px-4">Company / Entity</th>
                <th className="py-3.5 px-4">PAN Details</th>
                <th className="py-3.5 px-4">Listed Properties</th>
                <th className="py-3.5 px-4">KYC Status</th>
                <th className="py-3.5 px-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">Loading owners...</td>
                </tr>
              ) : owners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 text-sm">No owners found</td>
                </tr>
              ) : (
                owners.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-white">{o.name}</p>
                        <p className="text-xs text-slate-400">{o.email} &bull; {o.phone || 'No phone'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {o.company_name || 'Individual Owner'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      {o.pan_number || 'Not Submitted'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-teal-400">
                      {o.properties_count} listings
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={o.kyc_status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={o.is_active ? 'ACTIVE' : 'SUSPENDED'} />
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
