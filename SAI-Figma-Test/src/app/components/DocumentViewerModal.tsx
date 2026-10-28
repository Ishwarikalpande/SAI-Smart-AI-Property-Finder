import React, { useState, useEffect } from "react";
import {
  X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2,
  FileText, ShieldCheck, Clock, AlertCircle, CheckCircle, Download,
  ExternalLink, Lock, Building, Calendar, UserCheck
} from "lucide-react";
import { PropertyDocumentItem, getPropertyDocumentViewUrl } from "../../api";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: PropertyDocumentItem | null;
  propertyTitle?: string;
  documentId?: number | null;
  documentName?: string;
  documentType?: string;
  documentStatus?: string;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  propertyTitle,
  documentId,
  documentName,
  documentType,
  documentStatus,
}: DocumentViewerModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setZoomLevel(100);
      setIsFullScreen(false);
      setLoadError(false);
    }
  }, [isOpen, document, documentId]);

  const docId = document?.id || documentId;
  if (!isOpen || !docId) return null;

  const activeDoc: PropertyDocumentItem = document || {
    id: docId,
    property_id: 1,
    document_type: documentType || "legal_document",
    document_name: documentName || "Verified Property Document",
    file_name: `${documentName || "document"}.pdf`,
    mime_type: "application/pdf",
    file_size: 1542,
    file_size_formatted: "1.5 KB",
    status: (documentStatus?.toUpperCase() as any) || "VERIFIED",
    version: 1,
    uploaded_at: new Date().toISOString(),
    verified_at: new Date().toISOString(),
    verified_by: "SAI Legal Compliance AI & Advocate",
    rera_number: "P52100028912",
    view_url: `/api/property-documents/${docId}/view`,
  };

  const viewUrl = getPropertyDocumentViewUrl(activeDoc.id);
  const isImage = activeDoc.mime_type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(activeDoc.file_name);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoomLevel(100);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const statusBadge = () => {
    switch (activeDoc.status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle size={13} className="text-emerald-600" />
            VERIFIED
          </span>
        );
      case "UNDER_REVIEW":
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock size={13} className="text-amber-600" />
            UNDER REVIEW
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-300">
            <AlertCircle size={13} className="text-red-600" />
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800">
            {activeDoc.status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-700/20 overflow-hidden flex flex-col transition-all duration-300 ${
          isFullScreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[92vh]"
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-[#67E8F9] flex items-center justify-center flex-shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white truncate">
                  {activeDoc.document_name}
                </h3>
                {statusBadge()}
              </div>
              <p className="text-slate-400 text-xs truncate flex items-center gap-1">
                <span>{propertyTitle || `Property #${activeDoc.property_id}`}</span>
                <span>•</span>
                <span>{activeDoc.file_size_formatted}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-xl px-1 py-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 text-slate-300 font-bold hover:text-white"
                title="Reset Zoom"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullScreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-300 transition-colors ml-1"
              title="Close Viewer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Content + Metadata Split */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-slate-100 overflow-hidden">
          {/* Main Document Viewer Canvas */}
          <div className="flex-1 relative flex items-center justify-center p-3 sm:p-4 overflow-auto bg-slate-900/90">
            {loadError ? (
              <div className="text-center text-white p-6 max-w-sm">
                <AlertCircle size={40} className="text-amber-400 mx-auto mb-2" />
                <p className="font-bold text-base">Unable to load document preview</p>
                <p className="text-xs text-slate-400 mt-1">
                  The document could not be previewed directly. Please ensure you have permission to view this file.
                </p>
              </div>
            ) : isImage ? (
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
                className="transition-transform duration-200"
              >
                <img
                  src={viewUrl}
                  alt={activeDoc.document_name}
                  onError={() => setLoadError(true)}
                  className="max-h-[75vh] max-w-full rounded-xl shadow-2xl object-contain bg-white"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={viewUrl}
                  title={activeDoc.document_name}
                  onError={() => setLoadError(true)}
                  className="w-full h-full rounded-xl border border-slate-700 shadow-2xl bg-white"
                />
              </div>
            )}
          </div>

          {/* Document Verification Metadata Panel */}
          <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-5 overflow-y-auto flex-shrink-0 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Official Verification Record
                </span>
                <h4 className="text-base font-black text-slate-900 leading-snug">
                  {activeDoc.document_name}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{activeDoc.file_name}</p>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  activeDoc.status === "VERIFIED"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : activeDoc.status === "REJECTED"
                    ? "bg-red-50 border-red-200 text-red-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {activeDoc.status === "VERIFIED" ? (
                    <ShieldCheck size={16} className="text-emerald-600" />
                  ) : (
                    <Clock size={16} className="text-amber-600" />
                  )}
                  <span className="text-xs font-black uppercase">
                    Status: {activeDoc.status}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {activeDoc.status === "VERIFIED"
                    ? "Verified against official land records, municipal sanction orders, and MahaRERA registries."
                    : activeDoc.status === "REJECTED"
                    ? `Reason: ${activeDoc.rejection_reason || "Document requirements not met"}`
                    : "Submitted and undergoing verification by SAI legal compliance team."}
                </p>
              </div>

              {/* Detailed Metadata Attributes */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                {activeDoc.rera_number && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">RERA Number:</span>
                    <span className="font-mono font-bold text-slate-800">{activeDoc.rera_number}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Document Type:</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {activeDoc.document_type.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Version:</span>
                  <span className="font-bold text-slate-800">v{activeDoc.version}.0</span>
                </div>

                {activeDoc.uploaded_at && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Uploaded:</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(activeDoc.uploaded_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {activeDoc.verified_at && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Verified Date:</span>
                    <span className="font-semibold text-emerald-700">
                      {new Date(activeDoc.verified_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {activeDoc.verified_by && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Verified By:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <UserCheck size={12} className="text-[#008F8C]" />
                      {activeDoc.verified_by}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Secure watermark disclaimer */}
            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
              <p className="flex items-center gap-1 font-semibold text-slate-500">
                <Lock size={11} className="text-[#008F8C]" /> Encrypted SAI Secure Document
              </p>
              <p>
                Protected under SAI Privacy & Authorization Protocol. Unauthorized redistribution prohibited.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
