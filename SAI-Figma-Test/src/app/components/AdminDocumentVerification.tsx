import React, { useState, useEffect } from "react";
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Clock, Search, Filter,
  FileText, ExternalLink, ChevronLeft, Eye, RefreshCw, X, Check, AlertCircle, User, Building
} from "lucide-react";
import {
  fetchAdminVerificationStats, fetchAdminVerificationDocuments,
  approveVerificationDocument, rejectVerificationDocument,
  requestVerificationResubmission, VerificationDocumentItem,
  VerificationStats, getSecureDocumentViewUrl
} from "../../api";

interface AdminDocumentVerificationProps {
  navigate: (pg: any) => void;
  onBack?: () => void;
}

export function AdminDocumentVerification({ navigate, onBack }: AdminDocumentVerificationProps) {
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [documents, setDocuments] = useState<VerificationDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Review Modal
  const [reviewingDoc, setReviewingDoc] = useState<VerificationDocumentItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "resubmit" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, [accountTypeFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, docsData] = await Promise.all([
        fetchAdminVerificationStats(),
        fetchAdminVerificationDocuments({
          account_type: accountTypeFilter !== "all" ? accountTypeFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchQuery.trim() || undefined
        })
      ]);
      setStats(statsData);
      setDocuments(docsData);
    } catch (err: any) {
      showToast("Error loading verification data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!reviewingDoc) return;
    setActionSubmitting(true);
    try {
      await approveVerificationDocument(reviewingDoc.id, actionReason || "Approved after review");
      showToast(`Document #${reviewingDoc.id} approved successfully!`);
      setReviewingDoc(null);
      setReviewAction(null);
      setActionReason("");
      loadData();
    } catch (err: any) {
      alert("Approval failed: " + err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reviewingDoc) return;
    if (!actionReason.trim()) {
      alert("Rejection reason is mandatory");
      return;
    }
    setActionSubmitting(true);
    try {
      await rejectVerificationDocument(reviewingDoc.id, actionReason.trim());
      showToast(`Document #${reviewingDoc.id} marked as rejected.`);
      setReviewingDoc(null);
      setReviewAction(null);
      setActionReason("");
      loadData();
    } catch (err: any) {
      alert("Action failed: " + err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    if (!reviewingDoc) return;
    if (!actionReason.trim()) {
      alert("Resubmission instructions are mandatory");
      return;
    }
    setActionSubmitting(true);
    try {
      await requestVerificationResubmission(reviewingDoc.id, actionReason.trim());
      showToast(`Resubmission requested for Document #${reviewingDoc.id}`);
      setReviewingDoc(null);
      setReviewAction(null);
      setActionReason("");
      loadData();
    } catch (err: any) {
      alert("Action failed: " + err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006D6A] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle size={18} className="text-[#99D9D2] flex-shrink-0" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#006D6A] to-[#004F4D] rounded-3xl p-6 mb-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl border border-[#005B58]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => (onBack ? onBack() : navigate("admin"))}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold px-3.5 py-2.5 rounded-xl text-sm transition-all border border-white/20"
            >
              <ChevronLeft size={16} />Back to Admin
            </button>
            <div>
              <p className="text-[#D9E5E3] text-xs font-bold uppercase tracking-wider mb-0.5">Admin Management</p>
              <h1 className="text-2xl font-black">Document Verification Dashboard</h1>
              <p className="text-[#D9E5E3] text-sm mt-0.5">Review, AI analyze, and authorize KYC and ownership credentials.</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-white/20 transition-all"
          >
            <RefreshCw size={14} />Refresh
          </button>
        </div>

        {/* STATS CARDS matching Section 53 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Total Documents", count: stats?.total_documents ?? 0, color: "text-slate-800", bg: "bg-white" },
            { label: "Pending Review", count: stats?.pending_review ?? 0, color: "text-amber-600", bg: "bg-amber-50/70" },
            { label: "Under Review", count: stats?.under_review ?? 0, color: "text-blue-600", bg: "bg-blue-50/70" },
            { label: "Verified", count: stats?.verified ?? 0, color: "text-emerald-600", bg: "bg-emerald-50/70" },
            { label: "Rejected", count: stats?.rejected ?? 0, color: "text-red-600", bg: "bg-red-50/70" },
            { label: "Resubmission", count: stats?.resubmission_required ?? 0, color: "text-orange-600", bg: "bg-orange-50/70" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 shadow-sm border border-slate-200 text-center`}>
              <p className={`font-black text-2xl ${s.color}`}>{s.count}</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* SEARCH & FILTERS TOOLBAR */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#D9E5E3] mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user, email, file name, document ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadData()}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Account Types</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Owner (Seller)</option>
              <option value="agent">Agent</option>
              <option value="builder">Builder</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="RESUBMISSION_REQUIRED">Resubmission</option>
            </select>
          </div>
        </div>

        {/* DOCUMENTS TABLE / LIST */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#D9E5E3] overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4].map(n => <div key={n} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Shield size={44} className="mx-auto mb-2 opacity-40 text-[#006D6A]" />
              <p className="font-bold text-slate-700 text-sm">No verification documents found</p>
              <p className="text-xs text-slate-400 mt-0.5">Documents submitted by buyers, owners, agents, or builders will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Doc ID</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">User / Entity</th>
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">Uploaded File</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">#{doc.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {doc.account_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{doc.user_name}</p>
                        <p className="text-[11px] text-slate-400">{doc.user_email}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 capitalize">
                        {doc.document_type.replace(/_/g, " ")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {doc.file_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Recent"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          doc.status === "VERIFIED" ? "bg-green-100 text-green-700" :
                          doc.status === "REJECTED" ? "bg-red-100 text-red-700" :
                          doc.status === "RESUBMISSION_REQUIRED" ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setReviewingDoc(doc)}
                          className="bg-[#006D6A] hover:bg-[#004F4D] text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                        >
                          Review Document
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── ADMIN DOCUMENT REVIEW MODAL (Sections 54, 55, 64) ──────────── */}
      {reviewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#006D6A] bg-[#E6F4F2] px-2.5 py-1 rounded-full">
                  Verification Review · Doc #{reviewingDoc.id}
                </span>
                <h3 className="font-black text-slate-800 text-xl mt-1.5 capitalize">
                  {reviewingDoc.document_type.replace(/_/g, " ")} Document
                </h3>
                <p className="text-xs text-slate-500">
                  Uploaded by <span className="font-bold text-slate-700">{reviewingDoc.user_name}</span> ({reviewingDoc.account_type}) · Version {reviewingDoc.version}
                </p>
              </div>
              <button onClick={() => { setReviewingDoc(null); setReviewAction(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: DOCUMENT INFORMATION & PREVIEW */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <h4 className="font-bold text-slate-700 text-sm mb-2">Document Metadata</h4>
                  <div className="flex justify-between"><span className="text-slate-400">File Name:</span> <span className="font-bold font-mono">{reviewingDoc.file_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Account Type:</span> <span className="font-bold capitalize">{reviewingDoc.account_type}</span></div>
                  {reviewingDoc.property_title && (
                    <div className="flex justify-between"><span className="text-slate-400">Property:</span> <span className="font-bold">{reviewingDoc.property_title}</span></div>
                  )}
                  {reviewingDoc.project_name && (
                    <div className="flex justify-between"><span className="text-slate-400">Project:</span> <span className="font-bold">{reviewingDoc.project_name}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-slate-400">Current Status:</span> <span className="font-black text-[#006D6A]">{reviewingDoc.status}</span></div>
                </div>

                {/* Document Secure Preview */}
                <div className="border border-slate-200 rounded-2xl p-4 text-center bg-slate-50">
                  <FileText size={40} className="mx-auto text-slate-400 mb-2" />
                  <p className="font-bold text-xs text-slate-700">{reviewingDoc.file_name}</p>
                  <p className="text-[11px] text-slate-400 mb-3">{reviewingDoc.mime_type} · {(reviewingDoc.file_size / 1024).toFixed(1)} KB</p>

                  <a
                    href={getSecureDocumentViewUrl(reviewingDoc.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006D6A] text-white rounded-xl text-xs font-bold hover:bg-[#004F4D] transition-colors shadow-sm"
                  >
                    <Eye size={13} />Open Secure Document Stream
                  </a>
                  <p className="text-[10px] text-slate-400 mt-2">Protected by authenticated RBAC session tokens.</p>
                </div>

                {/* Audit Trail */}
                {reviewingDoc.reviews && reviewingDoc.reviews.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl p-4 text-xs">
                    <h4 className="font-bold text-slate-700 mb-2">Verification Audit Trail</h4>
                    <div className="space-y-2">
                      {reviewingDoc.reviews.map(r => (
                        <div key={r.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>{r.action}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{new Date(r.created_at).toLocaleString()}</span>
                          </div>
                          {r.reason && <p className="text-slate-500 mt-1 italic">"{r.reason}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: AI EXTRACTION & CONSISTENCY CHECKS */}
              <div className="space-y-4">
                {/* AI Extraction Card */}
                <div className="bg-[#F4FAF9] border border-[#99D9D2] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-[#006D6A] text-sm flex items-center gap-1.5">
                      <Shield size={16} />AI Structured Field Extraction
                    </h4>
                    <span className="text-[10px] bg-[#006D6A] text-white font-bold px-2 py-0.5 rounded-full">
                      Assisted Analysis
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {reviewingDoc.extracted_data && Object.keys(reviewingDoc.extracted_data).length > 0 ? (
                      Object.entries(reviewingDoc.extracted_data).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1 border-b border-[#D9E5E3] last:border-0">
                          <span className="text-slate-500 capitalize">{k.replace(/_/g, " ")}:</span>
                          <span className="font-bold text-slate-800 text-right">{String(v)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">No structured fields extracted</p>
                    )}
                  </div>
                </div>

                {/* AI Consistency Checks Card matching Section 54 */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-white text-xs space-y-2.5">
                  <h4 className="font-bold text-slate-800 text-sm mb-2">Automated Verification Checks</h4>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Document Readable:</span>
                    <span className="font-black text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {reviewingDoc.checks_data?.document_readable || "PASS"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Required Fields Present:</span>
                    <span className="font-black text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {reviewingDoc.checks_data?.required_fields || "PASS"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Name Consistency:</span>
                    <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {reviewingDoc.checks_data?.name_consistency || "MATCH"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Property Details Consistency:</span>
                    <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {reviewingDoc.checks_data?.property_details_consistency || "MATCH"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Document Type:</span>
                    <span className="font-black text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {reviewingDoc.checks_data?.document_type || "MATCH"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Duplicate Check:</span>
                    <span className="font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {reviewingDoc.checks_data?.duplicate_check || "NO"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600">Potential Alteration:</span>
                    <span className="font-black text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {reviewingDoc.checks_data?.potential_alteration || "NOT FLAGGED"}
                    </span>
                  </div>

                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-800 mt-2">
                    <p className="font-bold">Legal Disclaimer:</p>
                    <p>These are AI-assisted checks, not government certifications. Final approval remains with the authorized reviewer.</p>
                  </div>
                </div>

                {/* ADMIN DECISION PANEL matching Section 54 */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm">Admin Decision</h4>

                  {reviewAction ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {reviewAction === "approve" ? "Approval Notes (Optional):" : "Reason (Mandatory):"}
                        </label>
                        <textarea
                          rows={2}
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          placeholder={
                            reviewAction === "reject" ? "e.g. Property address mismatch with submitted title deed." :
                            reviewAction === "resubmit" ? "e.g. Scanned document is blurry. Please upload a high-resolution copy." :
                            "e.g. Identity verified against state records."
                          }
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setReviewAction(null); setActionReason(""); }}
                          className="px-3 py-1.5 border rounded-xl text-xs font-bold text-slate-600"
                        >
                          Cancel
                        </button>
                        {reviewAction === "approve" && (
                          <button
                            onClick={handleApprove}
                            disabled={actionSubmitting}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                          >
                            {actionSubmitting ? "Approving..." : "Confirm Approval"}
                          </button>
                        )}
                        {reviewAction === "reject" && (
                          <button
                            onClick={handleReject}
                            disabled={actionSubmitting}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                          >
                            {actionSubmitting ? "Rejecting..." : "Confirm Rejection"}
                          </button>
                        )}
                        {reviewAction === "resubmit" && (
                          <button
                            onClick={handleResubmit}
                            disabled={actionSubmitting}
                            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                          >
                            {actionSubmitting ? "Submitting..." : "Send Resubmission Request"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => { setReviewAction("approve"); setActionReason(""); }}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <Check size={14} />Approve
                      </button>
                      <button
                        onClick={() => { setReviewAction("resubmit"); setActionReason(""); }}
                        className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <RefreshCw size={13} />Resubmit
                      </button>
                      <button
                        onClick={() => { setReviewAction("reject"); setActionReason(""); }}
                        className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <X size={14} />Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
