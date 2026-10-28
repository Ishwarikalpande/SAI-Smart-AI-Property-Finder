import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Sparkles,
  Eye,
  Trash2,
  AlertTriangle,
  MapPin,
  FileText,
  DollarSign,
  Layers,
} from 'lucide-react';
import {
  fetchProperties,
  fetchPropertyDetail,
  approveProperty,
  rejectProperty,
  suspendProperty,
  togglePropertyFeature,
  deleteProperty,
} from '../api/adminApi';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

export const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Property detail modal
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirmation modal
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

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await fetchProperties({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        property_type: typeFilter !== 'all' ? typeFilter : undefined,
        search: search.trim() || undefined,
        page,
        page_size: pageSize,
      });
      setProperties(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProperties();
  };

  const handleApprove = (prop: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Listing',
      message: `Approve listing "${prop.title}"? It will be marked verified and available across all buyer search results.`,
      type: 'success',
      action: async () => {
        setActionLoading(true);
        try {
          await approveProperty(prop.id);
          await loadProperties();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReject = (prop: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Property Listing',
      message: `Provide rejection reason for "${prop.title}". The creator will be notified to revise documentation.`,
      type: 'danger',
      showInput: true,
      inputPlaceholder: 'Reason for rejection (e.g. illegible sale deed, price mismatch)...',
      action: async (reason?: string) => {
        setActionLoading(true);
        try {
          await rejectProperty(prop.id, reason);
          await loadProperties();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleSuspend = (prop: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Suspend Property Listing',
      message: `Are you sure you want to suspend listing "${prop.title}"? It will be immediately hidden from public searches.`,
      type: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          await suspendProperty(prop.id);
          await loadProperties();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleToggleFeature = async (prop: any) => {
    try {
      await togglePropertyFeature(prop.id);
      await loadProperties();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (prop: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Property',
      message: `Permanently delete listing "${prop.title}"? All uploaded images and associated records will be removed.`,
      type: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          await deleteProperty(prop.id);
          await loadProperties();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleViewDetail = async (propId: number) => {
    setDetailLoading(true);
    try {
      const details = await fetchPropertyDetail(propId);
      setSelectedProperty(details);
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
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, locality, city..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available (Approved)</option>
            <option value="pending">Pending Review</option>
            <option value="under_review">Under Review</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="commercial">Commercial</option>
            <option value="plot">Plot</option>
            <option value="penthouse">Penthouse</option>
            <option value="studio">Studio</option>
          </select>

          <span className="text-xs text-slate-400 font-medium">
            Total: <strong>{total}</strong> listings
          </span>
        </div>
      </div>

      {/* Properties Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Property</th>
                <th className="py-3.5 px-4">Price &amp; Specs</th>
                <th className="py-3.5 px-4">Creator</th>
                <th className="py-3.5 px-4">Listing Status</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Featured</th>
                <th className="py-3.5 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
                    Loading properties...
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    No properties match filters
                  </td>
                </tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white line-clamp-1">{p.title}</span>
                          {p.badge && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{p.locality}, {p.city}</span>
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-emerald-400 text-xs">{p.price_display}</p>
                      <p className="text-[11px] text-slate-400">
                        {p.bhk ? `${p.bhk} BHK • ` : ''}{p.area_sqft} sq.ft • {p.property_type}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-medium text-slate-200">{p.creator_name}</p>
                      <Badge status={p.creator_role} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={p.is_verified ? 'VERIFIED' : p.verification_status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleFeature(p)}
                        title={p.sponsored ? 'Remove Featured Status' : 'Promote to Featured'}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                          p.sponsored
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{p.sponsored ? 'Featured' : 'Standard'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleViewDetail(p.id)}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApprove(p)}
                          title="Approve Listing"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(p)}
                          title="Reject Listing"
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSuspend(p)}
                          title="Suspend Listing"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          title="Delete Listing"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing Page <strong>{page}</strong> of <strong>{Math.ceil(total / pageSize) || 1}</strong></span>
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

      {/* Property Detail Inspection Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold font-heading text-white">{selectedProperty.title}</h3>
                  <Badge status={selectedProperty.status} />
                  <Badge status={selectedProperty.is_verified ? 'VERIFIED' : 'PENDING'} />
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{selectedProperty.address || `${selectedProperty.locality}, ${selectedProperty.city}`}</span>
                </p>
              </div>
              <p className="text-xl font-bold text-emerald-400">{selectedProperty.price_display}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Configuration</span>
                <p className="text-xs font-semibold text-white mt-1">{selectedProperty.bhk || 0} BHK ({selectedProperty.property_type})</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Carpet Area</span>
                <p className="text-xs font-semibold text-white mt-1">{selectedProperty.area_sqft} sq.ft</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Views Recorded</span>
                <p className="text-xs font-semibold text-white mt-1">{selectedProperty.views_count} views</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Furnishing</span>
                <p className="text-xs font-semibold text-white mt-1 capitalize">{selectedProperty.furnishing}</p>
              </div>
            </div>

            {selectedProperty.description && (
              <div className="mb-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedProperty.description}</p>
              </div>
            )}

            {/* Verification Documents */}
            <div className="mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Attached Documents ({selectedProperty.documents?.length || 0})
              </h4>
              <div className="space-y-2">
                {selectedProperty.documents && selectedProperty.documents.length > 0 ? (
                  selectedProperty.documents.map((d: any) => (
                    <div key={d.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{d.document_type.toUpperCase()}: {d.file_name}</p>
                        <p className="text-[11px] text-slate-500">Uploaded {new Date(d.uploaded_at).toLocaleDateString()}</p>
                      </div>
                      <Badge status={d.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No legal documents submitted for this property</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedProperty(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
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
        showInput={confirmModal.showInput}
        inputPlaceholder={confirmModal.inputPlaceholder}
        loading={actionLoading}
        onConfirm={confirmModal.action}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
