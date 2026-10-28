import React, { useState } from "react";
import { X, Calendar, Clock, Phone, Mail, User, CheckCircle, Send, AlertTriangle } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { sendEnquiry, replyToEnquiry } from "../../api/enquiries";
import { scheduleSiteVisit } from "../../api/siteVisits";

// ── ENQUIRY MODAL ──────────────────────────────────────────────────
export function EnquiryModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  initialUser,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  propertyTitle: string;
  initialUser?: { name?: string; phone?: string; email?: string } | null;
  onSuccess?: (msg: string) => void;
}) {
  const { tr } = useI18n();
  const [name, setName] = useState(initialUser?.name || "");
  const [phone, setPhone] = useState(
    initialUser?.phone ? initialUser.phone.replace(/\D/g, "").slice(-10) : ""
  );
  const [email, setEmail] = useState(initialUser?.email || "");
  const [message, setMessage] = useState(
    `Hello, I am interested in "${propertyTitle}". Please contact me with more information.`
  );
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendEnquiry({
        property_id: propertyId,
        message: `${message} (Contact: ${name}, Phone: ${phone}, Email: ${email})`,
      });
      setSubmitted(true);
      onSuccess?.(tr.enquirySuccess);
    } catch (err: any) {
      setError(err?.message || tr.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 overflow-hidden z-10 border border-[#D9E5E3]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <X size={16} className="text-slate-600" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{tr.enquirySuccess}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{tr.enquirySuccessDesc}</p>
            <button
              onClick={onClose}
              className="bg-[#006D6A] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#004F4D] transition-colors"
            >
              {tr.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <span className="text-[11px] font-bold text-[#008F8C] uppercase tracking-wider bg-[#E6F4F2] px-3 py-1 rounded-full">
                {tr.contactOwner}
              </span>
              <h2 className="text-xl font-black text-slate-800 mt-2">{tr.enquiryTitle}</h2>
              <p className="text-slate-500 text-xs mt-1 truncate">{propertyTitle}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">{tr.yourName}</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-50 border border-[#D9E5E3] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{tr.yourPhone}</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-500 select-none pointer-events-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        title="Please enter a valid 10-digit mobile number"
                        className="w-full bg-slate-50 border border-[#D9E5E3] rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                      />
                    </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{tr.yourEmail}</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rahul@email.com"
                      className="w-full bg-slate-50 border border-[#D9E5E3] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">{tr.yourMessage}</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-[#D9E5E3] rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006D6A] text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-[#004F4D] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={16} />
              <span>{loading ? tr.loading : tr.sendEnquiryBtn}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── SITE VISIT BOOKING MODAL ───────────────────────────────────────
export function SiteVisitModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  propertyTitle: string;
  onSuccess?: (msg: string) => void;
}) {
  const { tr } = useI18n();
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("morning");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("Please select a date for your visit");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const scheduledAt = `${date}T${slot === "morning" ? "10:00:00" : slot === "afternoon" ? "14:00:00" : "16:00:00"}`;
      await scheduleSiteVisit({
        property_id: propertyId,
        scheduled_at: scheduledAt,
        notes: notes ? `${notes} [Slot: ${slot}]` : `Slot: ${slot}`,
      });
      setConfirmed(true);
      onSuccess?.(tr.visitSuccess);
    } catch (err: any) {
      setError(err?.message || tr.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 overflow-hidden z-10 border border-[#D9E5E3]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <X size={16} className="text-slate-600" />
        </button>

        {confirmed ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{tr.visitSuccess}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{tr.visitSuccessDesc}</p>
            <div className="bg-[#E6F4F2] text-[#006D6A] rounded-2xl p-4 mb-6 text-sm font-semibold">
              <p>📅 {date}</p>
              <p>⏰ {slot === "morning" ? tr.slotMorning : slot === "afternoon" ? tr.slotAfternoon : tr.slotEvening}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-[#006D6A] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#004F4D] transition-colors"
            >
              {tr.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <span className="text-[11px] font-bold text-[#008F8C] uppercase tracking-wider bg-[#E6F4F2] px-3 py-1 rounded-full">
                {tr.scheduleVisit}
              </span>
              <h2 className="text-xl font-black text-slate-800 mt-2">{tr.visitTitle}</h2>
              <p className="text-slate-500 text-xs mt-1 truncate">{propertyTitle}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4 mb-5">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">{tr.selectDate}</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-[#D9E5E3] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">{tr.selectTime}</label>
                <div className="space-y-2">
                  {[
                    { id: "morning", label: tr.slotMorning },
                    { id: "afternoon", label: tr.slotAfternoon },
                    { id: "evening", label: tr.slotEvening },
                  ].map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-xs font-semibold ${
                        slot === s.id
                          ? "border-[#006D6A] bg-[#E6F4F2] text-[#006D6A]"
                          : "border-[#D9E5E3] bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        checked={slot === s.id}
                        onChange={() => setSlot(s.id)}
                        className="accent-[#006D6A]"
                      />
                      <Clock size={14} className={slot === s.id ? "text-[#006D6A]" : "text-slate-400"} />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">{tr.visitNotes}</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={tr.visitNotesPh}
                  className="w-full bg-slate-50 border border-[#D9E5E3] rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006D6A] text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-[#004F4D] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Calendar size={16} />
              <span>{loading ? tr.loading : tr.confirmVisitBtn}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── TOAST NOTIFICATION ─────────────────────────────────────────────
export function ToastAlert({
  message,
  type = "success",
  onClose,
}: {
  message: string | null;
  type?: "success" | "error" | "info";
  onClose: () => void;
}) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10 animate-fade-in">
      {type === "success" ? (
        <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
      ) : type === "error" ? (
        <AlertTriangle size={18} className="text-rose-400 flex-shrink-0" />
      ) : (
        <Clock size={18} className="text-cyan-400 flex-shrink-0" />
      )}
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/60 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}

// ── ENQUIRY REPLY MODAL ─────────────────────────────────────────────
export function EnquiryReplyModal({
  isOpen,
  onClose,
  enquiry,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  enquiry: { id: string | number; name?: string; buyer_name?: string; message?: string; listing?: string } | null;
  onSuccess?: (replyText: string) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !enquiry) return null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await replyToEnquiry(enquiry.id, replyText);
      onSuccess?.(replyText);
      setReplyText("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 overflow-hidden z-10 border border-[#D9E5E3]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <X size={16} className="text-slate-600" />
        </button>

        <div className="mb-5">
          <span className="text-[11px] font-bold text-[#006D6A] uppercase tracking-wider bg-[#E6F4F2] px-3 py-1 rounded-full">
            Reply to Lead
          </span>
          <h2 className="text-xl font-black text-slate-800 mt-2">
            Reply to {enquiry.buyer_name || enquiry.name || "Buyer"}
          </h2>
          {enquiry.listing && (
            <p className="text-slate-400 text-xs mt-0.5">Regarding: {enquiry.listing}</p>
          )}
        </div>

        <div className="bg-slate-50 border border-[#D9E5E3] rounded-2xl p-4 mb-4 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inquiry Message</p>
          <p className="text-xs text-slate-700 italic">"{enquiry.message || "I am interested in this property."}"</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSendReply}>
          <div className="mb-4">
            <label className="text-xs font-bold text-slate-600 block mb-1">Your Response Message</label>
            <textarea
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response here (e.g., share brochure details, confirm pricing, or propose a visit)..."
              className="w-full bg-slate-50 border border-[#D9E5E3] rounded-2xl p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !replyText.trim()}
              className="flex-1 bg-[#006D6A] text-white font-bold py-3 rounded-xl shadow-[0_4px_16px_rgba(0,109,106,0.3)] hover:bg-[#004F4D] transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              <Send size={14} />
              <span>{loading ? "Sending..." : "Send Reply"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
