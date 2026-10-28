import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  Eye,
  FileCheck,
} from 'lucide-react';
import { fetchKYCQueue, fetchKYCStats, verifyDocument, rejectDocument } from '../api/adminApi';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

export const KYCPage: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [accountType, setAccountType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'success';
    showInput?: boolean;
    inputPlaceholder?: string;
    action: (reason?: string) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    action: async () => {},
  });
  const [actionLoading, setActionLoading] = useState(false);

  const loadKYC = async () => {
    setLoading(true);
    try {
      const [qData, sData] = await Promise.all([
        fetchKYCQueue({
          account_type: accountType !== 'all' ? accountType : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        fetchKYCStats(),
      ]);
      setQueue(qData);
      setStats(sData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKYC();
  }, [accountType, statusFilter]);

  const handleApprove = (item: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve KYC Verification',
      message: `Approve identity document for ${item.user_name} (${item.document_type.toUpperCase()})? This grants the Verified User badge.`,
      type: 'success',
      action: async () => {
        setActionLoading(true);
        try {
          await verifyDocument(item.id);
          await loadKYC();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReject = (item: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject KYC Document',
      message: `Specify reason for rejecting ${item.user_name}'s KYC submission.`,
      type: 'danger',
      showInput: true,
      inputPlaceholder: 'Reason (e.g. illegible scan, mismatched name on PAN)...',
      action: async (reason?: string) => {
        setActionLoading(true);
        try {
          await rejectDocument(item.id, reason || 'KYC verification rejected');
          await loadKYC();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KYC KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Total Identity Submissions</p>
          <p className="text-2xl font-bold font-heading text-white mt-1">{stats.total}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
          <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">Pending KYC Review</p>
          <p className="text-2xl font-bold font-heading text-amber-300 mt-1">{stats.pending}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Verified Identities</p>
          <p className="text-2xl font-bold font-heading text-emerald-300 mt-1">{stats.verified}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-rose-500/20 bg-rose-500/5">
          <p className="text-[11px] uppercase tracking-wider text-rose-400 font-bold">Rejected Verification</p>
          <p className="text-2xl font-bold font-heading text-rose-300 mt-1">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Verification Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Owners</option>
            <option value="agent">Agents</option>
            <option value="builder">Builders</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">Queue Items: <strong>{queue.length}</strong></span>
      </div>

      {/* KYC Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Applicant</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Identity Document</th>
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">Loading KYC queue...</td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 text-sm">No KYC submissions in this filter</td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-white">{item.user_name}</p>
                        <p className="text-xs text-slate-400">{item.user_email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={item.account_type} />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono uppercase text-slate-200">
                      {item.document_type}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 truncate max-w-xs">
                      {item.file_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={item.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(item)}
                          title="Verify Identity"
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(item)}
                          title="Reject Identity"
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        showInput={confirmModal.showInput}
        inputPlaceholder={confirmModal.inputPlaceholder}
        loading={actionLoading}
        onConfirm={confirmModal.action}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
