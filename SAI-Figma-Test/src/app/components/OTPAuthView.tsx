import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  ShieldCheck,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit2,
  Lock,
} from "lucide-react";
import { SaiLogo } from "./SaiLogo";
import { sendEmailOTP, resendEmailOTP, verifyEmailOTP } from "../../api/auth";
import { maskEmail } from "./ForgotPasswordModal";

interface OTPAuthViewProps {
  navigate: (page: any) => void;
  pendingRole?: string | null;
  initialEmail?: string;
  onSuccess?: (role: string) => void;
}

export const OTPAuthView: React.FC<OTPAuthViewProps> = ({
  navigate,
  pendingRole = "buyer",
  initialEmail = "",
  onSuccess,
}) => {
  const [step, setStep] = useState<"request" | "verify">(
    initialEmail && initialEmail.includes("@") ? "verify" : "request"
  );
  const [email, setEmail] = useState(initialEmail || "");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [expiresInSeconds, setExpiresInSeconds] = useState(300); // 5 minutes
  const [isExpired, setIsExpired] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // 5-minute expiration timer
  useEffect(() => {
    if (step !== "verify" || expiresInSeconds <= 0) {
      if (step === "verify" && expiresInSeconds <= 0) {
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

  // Auto-focus first input on step change
  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // If initialEmail was provided, automatically dispatch OTP on first load
  useEffect(() => {
    if (initialEmail && initialEmail.includes("@") && step === "verify" && cooldown === 0) {
      handleSendOTP(initialEmail);
    }
  }, []);

  const handleSendOTP = async (targetEmail?: string) => {
    const emailToUse = (targetEmail || email).trim().toLowerCase();
    if (!emailToUse || !emailToUse.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await sendEmailOTP(emailToUse, "login");
      setStep("verify");
      setCooldown(res.cooldown_seconds || 60);
      setExpiresInSeconds(300);
      setIsExpired(false);
      setOtpDigits(["", "", "", "", "", ""]);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setSuccessMessage(res.message || `OTP dispatched to ${emailToUse}`);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Failed to dispatch verification email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0 || loading) return;
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await resendEmailOTP(cleanEmail);
      setCooldown(res.cooldown_seconds || 60);
      setExpiresInSeconds(300);
      setIsExpired(false);
      setOtpDigits(["", "", "", "", "", ""]);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setSuccessMessage(res.message || "A new OTP has been sent to your registered email address.");
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (val: string, index: number) => {
    // Only accept numeric digits
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned && val !== "") return;

    setErrorMessage(null);
    const newDigits = [...otpDigits];
    newDigits[index] = cleaned.slice(-1); // Take last digit
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are populated
    if (cleaned && index === 5) {
      const fullOtp = newDigits.join("");
      if (fullOtp.length === 6) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);

    if (pasted.length === 6) {
      handleVerifyOTP(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerifyOTP = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpDigits.join("")).trim();
    if (code.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    if (isExpired) {
      setErrorMessage("OTP has expired. Please request a new OTP.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const roleToUse = pendingRole || "buyer";
      const tokenData = await verifyEmailOTP(email.trim().toLowerCase(), code, roleToUse);
      setSuccessMessage("OTP verified successfully.");

      setTimeout(() => {
        const destRole = tokenData.role === "super_admin" ? "admin" : tokenData.role || "buyer";
        if (onSuccess) {
          onSuccess(destRole);
        } else {
          navigate(destRole as any);
        }
      }, 800);
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

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const roleBadgeLabel =
    pendingRole === "seller"
      ? "Owner Portal"
      : pendingRole === "agent"
      ? "Agent Portal"
      : pendingRole === "builder"
      ? "Builder Portal"
      : "Buyer Portal";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => (step === "verify" ? setStep("request") : navigate("login"))}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#006D6A] font-semibold mb-5 transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>{step === "verify" ? "Change Email" : "Back to Login"}</span>
        </button>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,109,106,0.12)] border border-[#D9E5E3] p-7 sm:p-9 relative overflow-hidden">
          {/* Top Brand Decorative Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <SaiLogo size="lg" showText={false} />
            </div>

            <span className="notranslate text-2xl font-black text-slate-900 tracking-tight block">
              SAI
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#006D6A] block mt-0.5">
              Smart AI Property Finder
            </span>

            <div className="inline-flex items-center gap-1.5 bg-[#E6F4F2] text-[#006D6A] text-[11px] font-extrabold px-3 py-1 rounded-full mt-3 border border-[#006D6A]/20">
              <ShieldCheck size={13} />
              <span>{roleBadgeLabel}</span>
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs font-semibold">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* ── STEP 1: ENTER EMAIL & DISPATCH OTP ── */}
          {step === "request" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-black text-slate-800 mb-1">Verify Your Email</h3>
                <p className="text-xs text-slate-500">
                  Enter your registered email address to receive a 6-digit OTP.
                </p>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    disabled={loading}
                    className="w-full bg-slate-50 border border-[#D9E5E3] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008F8C]/40 focus:border-[#008F8C] transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSendOTP()}
                disabled={loading || !email.trim()}
                className="w-full bg-[#006D6A] hover:bg-[#004F4D] text-white font-extrabold py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigate("login")}
                  className="text-xs text-slate-500 hover:text-[#006D6A] font-bold hover:underline"
                >
                  Password Login Instead
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: VERIFY 6-DIGIT OTP ── */}
          {step === "verify" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">Verify Your Email</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter the 6-digit OTP sent to your registered email address.
                </p>
              </div>

              {/* Active Masked Email Target Badge */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
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
                  onClick={() => setStep("request")}
                  title="Change email"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#006D6A] hover:text-[#004F4D] hover:underline bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors"
                >
                  <Edit2 size={12} />
                  <span>Change Email</span>
                </button>
              </div>

              {/* Dev Preview Helper Banner when SMTP is not configured */}
              {devOtp && (
                <div className="bg-[#E6F4F2] border border-[#006D6A]/30 rounded-2xl p-3 flex items-center justify-between text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#006D6A]">Dev Preview OTP:</span>
                    <code className="font-mono bg-white px-2 py-0.5 rounded-lg border border-[#006D6A]/20 font-black text-slate-800 tracking-wider">
                      {devOtp}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devOtp.split("").slice(0, 6);
                      setOtpDigits(digits);
                      handleVerifyOTP(devOtp);
                    }}
                    className="text-[#006D6A] font-extrabold hover:text-[#004F4D] underline cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

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

                <div className="grid grid-cols-6 gap-2 sm:gap-2.5" onPaste={handlePaste}>
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
                      className={`h-13 sm:h-14 text-center font-black text-xl sm:text-2xl rounded-2xl border transition-all ${
                        digit
                          ? "border-[#008F8C] bg-[#E6F4F2]/50 text-[#004F4D] shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-800 focus:bg-white"
                      } focus:outline-none focus:ring-2 focus:ring-[#008F8C]/40 focus:border-[#008F8C]`}
                    />
                  ))}
                </div>
              </div>

              {/* Primary Action Button: Verify OTP */}
              <button
                type="button"
                onClick={() => handleVerifyOTP()}
                disabled={loading || otpDigits.some((d) => !d) || isExpired}
                className="w-full bg-[#006D6A] hover:bg-[#004F4D] text-white font-extrabold py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg active:scale-[0.99]"
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

              {/* Resend OTP & Cooldown Counter */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Didn't receive code?</span>

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

          {/* Security Guarantee Footnote */}
          <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <Lock size={11} className="text-[#008F8C]" />
            <span>256-Bit Salted SHA Encryption · Never Shared</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPAuthView;
