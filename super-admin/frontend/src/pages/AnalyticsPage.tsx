import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  ShieldCheck,
  MapPin,
  PieChart,
} from 'lucide-react';
import { fetchAnalytics } from '../api/adminApi';

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAnalytics(period);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const periods = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '3m', label: '3 Months' },
    { id: '6m', label: '6 Months' },
    { id: '1y', label: '1 Year' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Date Filter Tabs */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Time Horizon:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                period === p.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
          Aggregating telemetry analytics...
        </div>
      ) : (
        <>
          {/* Growth Trend Visualizer */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-bold font-heading text-white text-base">Ecosystem Growth Velocity</h4>
                <p className="text-xs text-slate-400 mt-0.5">Time-series expansion across registered users &amp; listings</p>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <span className="flex items-center space-x-1.5 text-indigo-400">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span>Platform Users</span>
                </span>
                <span className="flex items-center space-x-1.5 text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Properties Added</span>
                </span>
              </div>
            </div>

            {/* Custom Interactive SVG / Visual Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-2 pt-6 border-b border-slate-800">
              {data?.growth_trend?.map((item: any, idx: number) => {
                const maxVal = Math.max(...data.growth_trend.map((g: any) => Math.max(g.users, g.properties)), 1);
                const uHeight = Math.max(8, (item.users / maxVal) * 100);
                const pHeight = Math.max(8, (item.properties / maxVal) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition bg-slate-900 border border-slate-700 text-white text-[10px] p-1.5 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-xl">
                      {item.date}: {item.users} Users, {item.properties} Props
                    </div>

                    <div className="w-full flex items-end justify-center space-x-1 h-full">
                      <div
                        className="w-1/2 bg-indigo-500/80 hover:bg-indigo-400 rounded-t transition-all"
                        style={{ height: `${uHeight}%` }}
                      />
                      <div
                        className="w-1/2 bg-emerald-500/80 hover:bg-emerald-400 rounded-t transition-all"
                        style={{ height: `${pHeight}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 truncate max-w-[40px] text-center">
                      {item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Distributions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Roles */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800">
              <h4 className="font-bold font-heading text-white text-sm mb-4 flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>User Role Distribution</span>
              </h4>
              <div className="space-y-3">
                {data?.role_distribution &&
                  Object.entries(data.role_distribution).map(([role, count]: any) => (
                    <div key={role} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{role}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{count}</span>
                        <span className="text-[10px] text-slate-500">accounts</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* City Distribution */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800">
              <h4 className="font-bold font-heading text-white text-sm mb-4 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Geographic Clusters</span>
              </h4>
              <div className="space-y-3">
                {data?.city_distribution?.map((c: any) => (
                  <div key={c.city} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{c.city}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-emerald-400">{c.count}</span>
                      <span className="text-[10px] text-slate-500">listings</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Funnel */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800">
              <h4 className="font-bold font-heading text-white text-sm mb-4 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Compliance Pipeline</span>
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Total Legal Documents:</span>
                  <span className="font-bold text-white">{data?.verification_statistics?.total || 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <span>Verified Clean:</span>
                  <span className="font-bold">{data?.verification_statistics?.verified || 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <span>Pending Moderation:</span>
                  <span className="font-bold">{data?.verification_statistics?.pending || 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <span>Rejected / Resubmit:</span>
                  <span className="font-bold">{data?.verification_statistics?.rejected || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
