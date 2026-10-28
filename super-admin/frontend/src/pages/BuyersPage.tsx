import React, { useState, useEffect } from 'react';
import { Search, Heart, MessageSquare, MapPin, Eye, CheckCircle } from 'lucide-react';
import { fetchBuyers, toggleUserStatus } from '../api/adminApi';
import { Badge } from '../components/Badge';

export const BuyersPage: React.FC = () => {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBuyers = async () => {
    setLoading(true);
    try {
      const data = await fetchBuyers(search);
      setBuyers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuyers();
  }, [search]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadBuyers();
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buyers by name, email..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>
        <span className="text-xs text-slate-400">Total Buyers: <strong>{buyers.length}</strong></span>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Buyer</th>
                <th className="py-3.5 px-4">Preferred City</th>
                <th className="py-3.5 px-4">KYC Status</th>
                <th className="py-3.5 px-4">Saved Properties</th>
                <th className="py-3.5 px-4">Inquiries Sent</th>
                <th className="py-3.5 px-4">Site Visits</th>
                <th className="py-3.5 px-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">Loading buyers...</td>
                </tr>
              ) : buyers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 text-sm">No buyers found</td>
                </tr>
              ) : (
                buyers.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-white">{b.name}</p>
                        <p className="text-xs text-slate-400">{b.email} &bull; {b.phone || 'No phone'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <span className="inline-flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{b.preferred_city}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={b.kyc_status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-sky-400">
                      {b.saved_properties_count} saved
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-indigo-400">
                      {b.inquiries_count} inquiries
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-emerald-400">
                      {b.site_visits_count} visits
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={b.is_active ? 'ACTIVE' : 'SUSPENDED'} />
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
