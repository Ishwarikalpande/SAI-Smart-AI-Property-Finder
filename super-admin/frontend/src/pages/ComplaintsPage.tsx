import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle,
  Clock,
  Eye,
  ShieldAlert,
  Send,
  MessageSquare,
} from 'lucide-react';
import { fetchComplaints, updateComplaintStatus } from '../api/adminApi';
import { Badge } from '../components/Badge';

export const ComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Active Complaint Details Modal
  const [activeComplaint, setActiveComplaint] = useState<any | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [resolution, setResolution] = useState('');
  const [newStatus, setNewStatus] = useState('UNDER_REVIEW');
  const [updating, setUpdating] = useState(false);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await fetchComplaints({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setComplaints(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, categoryFilter]);

  const handleOpenDetail = (c: any) => {
    setActiveComplaint(c);
    setInternalNotes(c.internal_notes || '');
    setResolution(c.resolution || '');
    setNewStatus(c.status);
  };

  const handleSaveStatus = async () => {
    if (!activeComplaint) return;
    setUpdating(true);
    try {
      await updateComplaintStatus(activeComplaint.id, newStatus, internalNotes, resolution);
      setActiveComplaint(null);
      await loadComplaints();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filters */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Ticket Statuses</option>
            <option value="OPEN">Open Tickets</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Grievance Categories</option>
            <option value="fake_listing">Fake Listing</option>
            <option value="fraud">Fraud / Scam</option>
            <option value="incorrect_price">Incorrect Price / Info</option>
            <option value="user_behavior">Agent / Owner Behavior</option>
            <option value="document_issue">Document Issue</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">Total Grievances: <strong>{complaints.length}</strong></span>
      </div>

      {/* Complaints Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Complainant</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Target Property</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-sm">Loading complaints...</td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 text-sm">No complaints recorded</td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-400">
                      #{c.id}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-semibold text-white">{c.user_name}</p>
                      <p className="text-[11px] text-slate-400">{c.user_email || 'Guest'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-semibold text-slate-200">{c.subject}</p>
                      <span className="text-[10px] uppercase font-bold text-indigo-400">{c.category}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {c.property_title || (c.property_id ? `Listing #${c.property_id}` : 'General Platform')}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={c.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(c)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {activeComplaint.category}
                </span>
                <h3 className="text-xl font-bold font-heading text-white mt-1.5">{activeComplaint.subject}</h3>
                <p className="text-xs text-slate-400">
                  Reported by {activeComplaint.user_name} ({activeComplaint.user_email}) on {new Date(activeComplaint.created_at).toLocaleString()}
                </p>
              </div>
              <Badge status={activeComplaint.status} />
            </div>

            <div className="my-5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Grievance Description</h4>
              <p className="text-sm text-slate-200 leading-relaxed">{activeComplaint.description}</p>
            </div>

            <div className="space-y-4 my-5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Internal Investigation Notes (Admin Only)
                </label>
                <textarea
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Private internal notes regarding phone call or investigation..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Resolution Text (Sent to Complainant)
                </label>
                <textarea
                  rows={2}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Official resolution summary provided to the user..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Update Ticket Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setActiveComplaint(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={updating}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30"
              >
                {updating ? 'Saving Changes...' : 'Save Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
