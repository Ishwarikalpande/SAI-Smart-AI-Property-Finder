import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Shield,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  X,
} from 'lucide-react';
import { fetchAuditLogs } from '../api/adminApi';
import { Badge } from '../components/Badge';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(25);
  const [selectedAction, setSelectedAction] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await fetchAuditLogs(limit, offset, selectedAction || undefined);
      if (res) {
        setLogs(res.logs || []);
        setTotal(res.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [offset, limit, selectedAction]);

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAction(e.target.value);
    setOffset(0);
  };

  const getActionBadgeVariant = (action: string): 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'neutral' => {
    const act = (action || '').toUpperCase();
    if (act.includes('APPROVE') || act.includes('VERIF') || act.includes('SUCCESS')) return 'success';
    if (act.includes('DELETE') || act.includes('SUSPEND') || act.includes('REJECT') || act.includes('BLOCK')) return 'danger';
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIFY')) return 'warning';
    if (act.includes('LOGIN') || act.includes('AUTH') || act.includes('TOKEN')) return 'info';
    if (act.includes('BROADCAST') || act.includes('AI') || act.includes('NOTIF')) return 'purple';
    return 'neutral';
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.user_email?.toLowerCase().includes(term) ||
      log.user_name?.toLowerCase().includes(term) ||
      log.entity_type?.toLowerCase().includes(term) ||
      log.ip_address?.toLowerCase().includes(term)
    );
  });

  const downloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sai_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-white">System Audit Trail</h1>
              <p className="text-sm text-slate-400">
                Immutable chronological log of platform administration events, authentication, and moderation decisions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={downloadJSON}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor, action, entity, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedAction}
              onChange={handleActionChange}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Actions ({total})</option>
              <option value="LOGIN">User Logins</option>
              <option value="APPROVE_PROPERTY">Property Approvals</option>
              <option value="REJECT_PROPERTY">Property Rejections</option>
              <option value="VERIFY_DOCUMENT">Document Verifications</option>
              <option value="UPDATE_KYC">KYC Status Updates</option>
              <option value="BROADCAST">Broadcast Notifications</option>
              <option value="UPDATE_SETTINGS">Settings Changes</option>
              <option value="SUSPEND_USER">User Suspensions</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Rows:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setOffset(0);
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2" />
                    <p>Loading database audit records...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching audit log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {log.created_at ? new Date(log.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      }) : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-white">{log.user_name || 'System Auto'}</p>
                        <p className="text-[11px] text-slate-400">{log.user_email || 'internal@sai.system'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.entity_type ? (
                        <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                          {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{offset + 1}</span> to{' '}
            <span className="font-semibold text-white">
              {Math.min(offset + limit, total)}
            </span>{' '}
            of <span className="font-semibold text-white">{total}</span> audit records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-white">
              Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit) || 1}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white">Audit Event Details #{selectedLog.id}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400">Action:</span>
                  <p className="font-semibold text-white mt-0.5">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-400">Target Entity:</span>
                  <p className="font-semibold text-white mt-0.5">
                    {selectedLog.entity_type} #{selectedLog.entity_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Actor Name:</span>
                  <p className="font-semibold text-white mt-0.5">{selectedLog.user_name || 'System'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Actor Email:</span>
                  <p className="font-semibold text-white mt-0.5">{selectedLog.user_email || 'internal@sai.system'}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Payload / Details:</span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-[11px] overflow-x-auto max-h-48 whitespace-pre-wrap">
                  {typeof selectedLog.details === 'object'
                    ? JSON.stringify(selectedLog.details, null, 2)
                    : selectedLog.details || 'No additional payload recorded.'}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AuditLogsPage;
