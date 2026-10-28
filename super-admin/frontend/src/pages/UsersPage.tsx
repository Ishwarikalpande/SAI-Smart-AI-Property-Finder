import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Shield,
  Clock,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';
import { fetchAdminUsers, toggleUserStatus, deleteUser, fetchAdminUserDetail } from '../api/adminApi';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected User Modal Detail
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'success';
    action: (reason?: string) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    action: async () => {},
  });
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers({
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
        page,
        page_size: pageSize,
      });
      setUsers(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleToggleStatus = (user: any) => {
    const isActivating = !user.is_active;
    setConfirmModal({
      isOpen: true,
      title: isActivating ? 'Restore User Account' : 'Suspend User Account',
      message: isActivating
        ? `Are you sure you want to reactivate account ${user.email}? They will regain full platform access.`
        : `Are you sure you want to suspend account ${user.email}? They will be immediately blocked from signing in.`,
      type: isActivating ? 'success' : 'danger',
      action: async (reason?: string) => {
        setActionLoading(true);
        try {
          await toggleUserStatus(user.id, isActivating, reason);
          await loadUsers();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleDeleteUser = (user: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete User',
      message: `Are you sure you want to permanently delete ${user.name} (${user.email})? This action is irreversible.`,
      type: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          await deleteUser(user.id);
          await loadUsers();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleViewDetail = async (userId: number) => {
    setDetailLoading(true);
    try {
      const details = await fetchAdminUserDetail(userId);
      setSelectedUser(details);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Owners (Sellers)</option>
            <option value="agent">Agents</option>
            <option value="builder">Builders</option>
            <option value="super_admin">Super Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          <span className="text-xs text-slate-400 font-medium">
            Total: <strong>{total}</strong> users
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">KYC Status</th>
                <th className="py-3.5 px-4">Properties</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                          {u.phone && <p className="text-[11px] text-slate-500">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={u.role} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={u.is_active ? 'ACTIVE' : 'SUSPENDED'} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={u.kyc_status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-white">
                      {u.properties_count} listed
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetail(u.id)}
                          title="View Complete Profile"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.is_active ? 'Suspend User' : 'Restore User'}
                          className={`p-1.5 rounded-lg transition ${
                            u.is_active
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {u.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        {u.role !== 'super_admin' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Delete User"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing Page <strong>{page}</strong> of <strong>{Math.ceil(total / pageSize) || 1}</strong>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= total}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Inspection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-extrabold flex items-center justify-center text-lg">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-white">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-400">{selectedUser.email} &bull; {selectedUser.phone || 'No phone'}</p>
                </div>
              </div>
              <Badge status={selectedUser.role} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Status</span>
                <p className="text-xs font-semibold text-white mt-1">
                  {selectedUser.is_active ? 'Active' : 'Suspended'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Inquiries</span>
                <p className="text-xs font-semibold text-white mt-1">
                  {selectedUser.stats?.enquiries_count || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Site Visits</span>
                <p className="text-xs font-semibold text-white mt-1">
                  {selectedUser.stats?.site_visits_count || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Saved</span>
                <p className="text-xs font-semibold text-white mt-1">
                  {selectedUser.stats?.favorites_count || 0}
                </p>
              </div>
            </div>

            {/* Profile Specifics */}
            {selectedUser.profile && Object.keys(selectedUser.profile).length > 0 && (
              <div className="mb-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">Role Profile Metadata</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedUser.profile).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-slate-500 capitalize">{k.replace('_', ' ')}:</span>{' '}
                      <span className="text-slate-200 font-medium">{String(v || '-')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submitted Documents */}
            <div className="mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Verification Documents ({selectedUser.documents?.length || 0})
              </h4>
              <div className="space-y-2">
                {selectedUser.documents && selectedUser.documents.length > 0 ? (
                  selectedUser.documents.map((d: any) => (
                    <div key={d.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{d.document_type.toUpperCase()}: {d.file_name}</p>
                        <p className="text-[11px] text-slate-500">Uploaded: {new Date(d.uploaded_at).toLocaleDateString()}</p>
                      </div>
                      <Badge status={d.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No verification documents submitted yet</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        loading={actionLoading}
        onConfirm={confirmModal.action}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
