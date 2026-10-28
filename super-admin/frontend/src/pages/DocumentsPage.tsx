import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  fetchDocuments,
  verifyDocument,
  rejectDocument,
  requestDocumentCorrection,
} from '../api/adminApi';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Document Inspection Modal
  const [inspectedDoc, setInspectedDoc] = useState<any | null>(null);

  // Confirm Modal state
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

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments({
        account_type: accountTypeFilter !== 'all' ? accountTypeFilter : undefined,
        document_type: documentTypeFilter !== 'all' ? documentTypeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [statusFilter, accountTypeFilter, documentTypeFilter]);

  const handleVerify = (doc: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Verify Legal Document',
      message: `Mark document "${doc.file_name}" (${doc.document_type}) as authenticated and verified?`,
      type: 'success',
      action: async () => {
        setActionLoading(true);
        try {
          await verifyDocument(doc.id);
          await loadDocuments();
          if (inspectedDoc && inspectedDoc.id === doc.id) {
            setInspectedDoc(null);
          }
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReject = (doc: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Legal Document',
      message: `Specify rejection reason for "${doc.file_name}". This will be permanently recorded in the verification audit history.`,
      type: 'danger',
      showInput: true,
      inputPlaceholder: 'Reason for rejection (e.g. invalid stamp duty seal, missing page 3)...',
      action: async (reason?: string) => {
        setActionLoading(true);
        try {
          await rejectDocument(doc.id, reason || 'Document rejected by Super Admin');
          await loadDocuments();
          if (inspectedDoc && inspectedDoc.id === doc.id) {
            setInspectedDoc(null);
          }
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleRequestCorrection = (doc: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Request Document Correction',
      message: `Ask user to resubmit a clear scan or corrected copy for "${doc.file_name}".`,
      type: 'warning',
      showInput: true,
      inputPlaceholder: 'Correction instructions (e.g. upload high-resolution 300dpi scan)...',
      action: async (reason?: string) => {
        setActionLoading(true);
        try {
          await requestDocumentCorrection(doc.id, reason || 'Please resubmit clearer copy');
          await loadDocuments();
          if (inspectedDoc && inspectedDoc.id === doc.id) {
            setInspectedDoc(null);
          }
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filters */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadDocuments();
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by user, file name..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="RESUBMISSION_REQUIRED">Resubmission Required</option>
          </select>

          <select
            value={accountTypeFilter}
            onChange={(e) => setAccountTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="seller">Owner / Seller</option>
            <option value="agent">Agent</option>
            <option value="builder">Builder</option>
            <option value="buyer">Buyer</option>
          </select>

          <span className="text-xs text-slate-400 font-medium">
            Total: <strong>{documents.length}</strong> documents
          </span>
        </div>
      </div>

      {/* Documents Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Uploaded By</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Related Listing</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4">Upload Date</th>
                <th className="py-3.5 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    No documents matching criteria
                  </td>
                </tr>
              ) : (
                documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white truncate max-w-xs">{d.file_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{(d.file_size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-200 text-xs">{d.user_name}</p>
                      <Badge status={d.account_type} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono uppercase text-slate-300">
                      {d.document_type}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {d.property_title || (d.property_id ? `Property #${d.property_id}` : 'Identity Proof')}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={d.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setInspectedDoc(d)}
                          title="Inspect AI Analysis &amp; File"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVerify(d)}
                          title="Verify Document"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(d)}
                          title="Reject Document"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRequestCorrection(d)}
                          title="Request Correction"
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition"
                        >
                          <RotateCcw className="w-4 h-4" />
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

      {/* Inspect Document Modal */}
      {inspectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold font-heading text-white">{inspectedDoc.file_name}</h3>
                <p className="text-xs text-slate-400">
                  Uploaded by {inspectedDoc.user_name} ({inspectedDoc.user_email}) on {new Date(inspectedDoc.uploaded_at).toLocaleString()}
                </p>
              </div>
              <Badge status={inspectedDoc.status} />
            </div>

            {/* Document Attributes */}
            <div className="grid grid-cols-3 gap-3 my-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Document Type</span>
                <p className="text-white font-semibold mt-1 uppercase font-mono">{inspectedDoc.document_type}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Account Role</span>
                <p className="text-white font-semibold mt-1 capitalize">{inspectedDoc.account_type}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">File Size</span>
                <p className="text-white font-semibold mt-1">{(inspectedDoc.file_size / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            {/* AI Extracted OCR Data */}
            <div className="mb-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center space-x-2 mb-2 text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">AI OCR Extraction Data</h4>
              </div>
              {inspectedDoc.extracted_data && Object.keys(inspectedDoc.extracted_data).length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(inspectedDoc.extracted_data).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 font-mono text-[10px] block">{k}</span>
                      <span className="text-white font-medium">{String(v || '-')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No structured fields extracted</p>
              )}
            </div>

            {/* Consistency Checks */}
            <div className="mb-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Automated Checks</h4>
              {inspectedDoc.checks_data && Object.keys(inspectedDoc.checks_data).length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  {Object.entries(inspectedDoc.checks_data).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                      <span className="text-slate-300 capitalize">{k.replace('_', ' ')}</span>
                      <span className="text-emerald-400 font-bold text-xs">{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No automated check flags recorded</p>
              )}
            </div>

            {inspectedDoc.rejection_reason && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                <strong>Rejection Reason:</strong> {inspectedDoc.rejection_reason}
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setInspectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRequestCorrection(inspectedDoc)}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold"
                >
                  Request Correction
                </button>
                <button
                  onClick={() => handleReject(inspectedDoc)}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleVerify(inspectedDoc)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30"
                >
                  Verify Document
                </button>
              </div>
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
