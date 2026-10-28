import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle, Clock, Users, Megaphone } from 'lucide-react';
import { fetchBroadcasts, sendBroadcast } from '../api/adminApi';
import { Badge } from '../components/Badge';

export const NotificationsPage: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    target_role: 'all',
    notification_type: 'INFO',
    title: '',
    message: '',
  });

  const loadBroadcasts = async () => {
    setLoading(true);
    try {
      const data = await fetchBroadcasts();
      setBroadcasts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true);
    setSuccessMsg(null);
    try {
      const res = await sendBroadcast(form);
      setSuccessMsg(`Broadcast sent successfully to ${res.recipients_count} active user accounts!`);
      setForm({
        target_role: 'all',
        notification_type: 'INFO',
        title: '',
        message: '',
      });
      await loadBroadcasts();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Composer */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center space-x-2.5 mb-2 text-indigo-400">
          <Megaphone className="w-5 h-5" />
          <h3 className="text-base font-bold font-heading text-white">
            Dispatch Platform-Wide Broadcast
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Broadcast official platform announcements, system updates, and urgent security notices directly to user inboxes.
        </p>

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                Target Audience Role
              </label>
              <select
                value={form.target_role}
                onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Registered Users (Global Broadcast)</option>
                <option value="buyer">Buyers Only</option>
                <option value="seller">Owners / Sellers Only</option>
                <option value="agent">Agents Only</option>
                <option value="builder">Builders Only</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                Notification Type
              </label>
              <select
                value={form.notification_type}
                onChange={(e) => setForm({ ...form, notification_type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="INFO">INFO (General News)</option>
                <option value="WARNING">WARNING (Policy Changes)</option>
                <option value="SUCCESS">SUCCESS (Platform Milestones)</option>
                <option value="IMPORTANT">IMPORTANT (Compliance Alerts)</option>
                <option value="SYSTEM">SYSTEM (Maintenance Notices)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
              Notification Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled System Maintenance Notice: Oct 10"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
              Broadcast Message Body
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detailed notification content delivered to the recipient drawer..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Dispatching Broadcast...' : 'Broadcast to Users'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <h4 className="font-bold font-heading text-white text-sm flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Broadcast Transmission History</span>
          </h4>
          <span className="text-xs text-slate-400">Total Broadcasts: <strong>{broadcasts.length}</strong></span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[350px] overflow-y-auto">
          {loading ? (
            <p className="p-8 text-center text-slate-400 text-xs">Loading transmission history...</p>
          ) : broadcasts.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-xs">No broadcast notifications sent yet</p>
          ) : (
            broadcasts.map((b) => (
              <div key={b.id} className="p-4 hover:bg-slate-900/40 transition flex items-start justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge status={b.notification_type} size="sm" />
                    <span className="font-semibold text-white">{b.title}</span>
                  </div>
                  <p className="text-slate-300 mt-1 max-w-xl">{b.message}</p>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Delivered to <strong>{b.recipients_count}</strong> {b.target_role} accounts &bull; {new Date(b.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
