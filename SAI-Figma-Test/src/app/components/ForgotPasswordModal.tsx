import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  Lock,
  ChevronLeft,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Edit2,
} from "lucide-react";
import { sendEmailOTP, resendEmailOTP, verifyEmailOTP, resetPassword } from "../../api/auth";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onPasswordResetComplete?: (email: string) => void;
}

type FlowStep = "enter_email" | "verify_otp" | "create_password" | "success";

/** Masks email matching format: ishwari******@gmail.com */
export function maskEmail(rawEmail: string): string {
  if (!rawEmail || !rawEmail.includes("@")) return rawEmail;
  const [localPart, domain] = rawEmail.split("@");
  if (localPart.length <= 2) {
    return `${localPart}******@${domain}`;
  }
  const prefixLength = Math.min(7, Math.max(2, Math.floor(localPart.length / 2)));
  const prefix = localPart.slice(0, prefixLength);
  return `${prefix}******@${domain}`;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = "",
  onPasswordResetComplete,
}) => {
  const [step, setStep] = useState<FlowStep>("enter_email");
  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Timer states
  const [cooldown, setCooldown] = useState(0);
  const [expiresInSeconds, setExpiresInSeconds] = useState(300); // 5 minutes
  const [isExpired, setIsExpired] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("enter_email");
      setEmail(initialEmail || "");
      setOtpDigits(["", "", "", "", "", ""]);
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorMessage(null);
      setSuccessMessage(null);
      setCooldown(0);
      setExpiresInSeconds(300);
      setIsExpired(false);
    }
  }, [isOpen, initialEmail]);

  // 60-second Resend Cooldown Timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // 5-minute OTP Expiration Timer
  useEffect(() => {
    if (step !== "verify_otp" || expiresInSeconds <= 0) {
      if (step === "verify_otp" && expiresInSeconds <= 0) {
        setIsExpired(true);
        setErrorMessage("OTP has expired. Please request a new OTP.");
      }
      return;
    }
    const timer = setInterval(() => {
      setExpiresInSeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          setErrorMessage("OTP has expired. Please request a new OTP.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, expiresInSeconds]);

  // Auto-focus first input when reaching verify_otp step
  useEffect(() => {
    if (step === "verify_otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 120);
    }
  }, [step]);

  if (!isOpen) return null;

  // ── 1. SEND OTP ──────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await sendEmailOTP(cleanEmail, "forgot_password");
      setSuccessMessage(res.message || "OTP sent successfully to your registered email address.");
      setCooldown(res.cooldown_seconds || 60);
      setExpiresInSeconds(300);
      setIsExpired(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setStep("verify_otp");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to send OTP. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── 2. RESEND OTP ────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (cooldown > 0 || loading) return;
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await resendEmailOTP(cleanEmail);
      setSuccessMessage(res.message || "A new OTP has been sent to your registered email address.");
      setCooldown(res.cooldown_seconds || 60);
      setExpiresInSeconds(300);
      setIsExpired(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── 3. OTP INPUT CONTROLS (Auto-advance, Backspace, Paste) ───────────
  const handleDigitChange = (val: string, index: number) => {
    // Only allow numeric input
    const numeric = val.replace(/\D/g, "");
    if (!numeric && val !== "") return;

    setErrorMessage(null);
    const updated = [...otpDigits];
    updated[index] = numeric.slice(-1);
    setOtpDigits(updated);

    // Typing a number moves to next box
    if (numeric && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits populated
    if (numeric && index === 5) {
      const completeCode = updated.join("");
      if (completeCode.length === 6) {
        handleVerifyOTP(completeCode);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        // Backspace moves to previous box
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      updated[i] = pasted[i];
    }
    setOtpDigits(updated);

    if (pasted.length === 6) {
      handleVerifyOTP(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // ── 4. VERIFY OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = async (codeOverride?: string) => {
    const code = (codeOverride || otpDigits.join("")).trim();
    if (code.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP.");
      return;
    }

    if (isExpired) {
      setErrorMessage("OTP has expired. Please request a new OTP.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifyEmailOTP(email.trim().toLowerCase(), code);
      setSuccessMessage("OTP verified successfully.");
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setTimeout(() => {
        setSuccessMessage(null);
        setStep("create_password");
      }, 700);
    } catch (err: any) {
      const msg = err?.message || "Invalid OTP. Please try again.";
      if (msg.toLowerCase().includes("expired")) {
        setIsExpired(true);
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── 5. RESET PASSWORD ────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setErrorMessage("Password must contain at least one uppercase letter (A-Z).");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setErrorMessage("Password must contain at least one digit (0-9).");
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(newPassword)) {
      setErrorMessage("Password must contain at least one special character (!@#$%^&*...).");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await resetPassword(resetToken, newPassword);
      setSuccessMessage("Password Updated Successfully");
      setStep("success");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,109,106,0.22)] border border-[#D9E5E3] max-w-md w-full overflow-hidden relative">
        {/* Modal Top Bar */}
        <div className="px-7 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="notranslate text-xl font-black text-slate-900 tracking-tight">SAI</span>
            <span className="text-[10px] font-bold text-[#006D6A] bg-[#E6F4F2] px-2.5 py-0.5 rounded-full border border-[#006D6A]/20 uppercase tracking-wider">
              Email OTP Verification
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-7">
          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs font-semibold">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && step !== "success" && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* ════ STEP 1: ENTER REGISTERED EMAIL ════ */}
          {step === "enter_email" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">Forgot Password</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your registered email address to receive a secure 6-digit verification OTP.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  Registered Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                    placeholder="Enter registered email"
                    disabled={loading}
                    className="w-full bg-slate-50 border border-[#D9E5E3] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006D6A]/30 focus:border-[#006D6A] transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading || !email.trim()}
                className="w-full bg-[#006D6A] hover:bg-[#004F4D] text-white font-extrabold py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Checking Account & Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-500 hover:text-[#006D6A] font-bold hover:underline"
                >
                  Remember password? Return to Login
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 2: ENTER OTP & VERIFY ════ */}
          {step === "verify_otp" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">Verify Your Email</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter the 6-digit OTP sent to your registered email address.
                </p>
              </div>

              {/* Masked Email Card + Change Email */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    Email
                  </span>
                  <span className="font-extrabold text-slate-800 text-sm font-mono tracking-tight truncate block">
                    {maskEmail(email)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("enter_email")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#006D6A] hover:text-[#004F4D] hover:underline bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors"
                >
                  <Edit2 size={12} />
                  <span>Change Email</span>
                </button>
              </div>

              {/* 6 Digit Input Boxes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    OTP Input
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <Clock size={12} className={isExpired ? "text-red-500" : "text-[#006D6A]"} />
                    <span className={isExpired ? "text-red-600 font-extrabold" : ""}>
                      {isExpired ? "Expired" : `Valid: ${formatTimer(expiresInSeconds)}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(e.target.value, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      disabled={loading || isExpired}
                      className={`h-12 text-center font-black text-xl rounded-2xl border transition-all ${
                        digit
                          ? "border-[#008F8C] bg-[#E6F4F2]/50 text-[#004F4D] shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-800 focus:bg-white"
                      } focus:outline-none focus:ring-2 focus:ring-[#008F8C]/40 focus:border-[#008F8C]`}
                    />
                  ))}
                </div>
              </div>

              {/* Verify OTP Button */}
              <button
                type="button"
                onClick={() => handleVerifyOTP()}
                disabled={loading || otpDigits.some((d) => !d) || isExpired}
                className="w-full bg-[#006D6A] hover:bg-[#004F4D] text-white font-extrabold py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Verify OTP</span>
                  </>
                )}
              </button>

              {/* Resend OTP Cooldown Counter */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Didn't receive code?</span>

                {cooldown > 0 ? (
                  <span className="font-bold text-slate-400">
                    Resend OTP in <span className="font-mono text-[#006D6A] font-extrabold">{cooldown} seconds</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="font-extrabold text-[#006D6A] hover:text-[#004F4D] hover:underline flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ════ STEP 3: CREATE NEW PASSWORD & CONFIRM PASSWORD ════ */}
          {step === "create_password" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">Create New Password</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your email has been verified. Enter and confirm your new secure password.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                    disabled={loading}
                    className="w-full bg-slate-50 border border-[#D9E5E3] rounded-2xl pl-10 pr-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006D6A]/30 focus:border-[#006D6A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Requirements Checklist */}
                <div className="grid grid-cols-2 gap-1.5 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${newPassword.length >= 8 ? "bg-emerald-500 text-white font-black" : "bg-slate-200 text-slate-500"}`}>
                      {newPassword.length >= 8 ? "✓" : "•"}
                    </span>
                    <span>Min. 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${/[A-Z]/.test(newPassword) ? "bg-emerald-500 text-white font-black" : "bg-slate-200 text-slate-500"}`}>
                      {/[A-Z]/.test(newPassword) ? "✓" : "•"}
                    </span>
                    <span>1 Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${/[0-9]/.test(newPassword) ? "bg-emerald-500 text-white font-black" : "bg-slate-200 text-slate-500"}`}>
                      {/[0-9]/.test(newPassword) ? "✓" : "•"}
                    </span>
                    <span>1 Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(newPassword) ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(newPassword) ? "bg-emerald-500 text-white font-black" : "bg-slate-200 text-slate-500"}`}>
                      {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(newPassword) ? "✓" : "•"}
                    </span>
                    <span>1 Special char (!@#$)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={loading}
                    className="w-full bg-slate-50 border border-[#D9E5E3] rounded-2xl pl-10 pr-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006D6A]/30 focus:border-[#006D6A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-[#006D6A] hover:bg-[#004F4D] text-white font-extrabold py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ════ STEP 4: PASSWORD UPDATED SUCCESSFULLY ════ */}
          {step === "success" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">
                  Password Updated Successfully
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your password has been changed securely. You can now log in using your new credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onPasswordResetComplete) {
                    onPasswordResetComplete(email);
                  }
                }}
                className="w-full bg-[#006D6A] hover:bg-[#004F4D] text-white font-extrabold py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Login</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
