import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, Mail, Lock, AlertCircle, Clock, RefreshCw, X, CheckCircle2 } from "lucide-react";
import { verifyOAuthOTP, resendOAuthOTP, confirmOAuthLink, resendOAuthLinkOTP, OAuthAuthResponse } from "../../api/auth";

interface OAuthOTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "otp" | "link";
  provider: "Google" | "Apple";
  maskedEmail: string;
  tempToken?: string;
  linkToken?: string;
  targetRole?: string;
  onSuccess: (authData: OAuthAuthResponse) => void;
}

export const OAuthOTPModal: React.FC<OAuthOTPModalProps> = ({
  isOpen,
  onClose,
  mode,
  provider,
  maskedEmail,
  tempToken,
  linkToken,
  onSuccess,
}) => {
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [usePasswordForLink, setUsePasswordForLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [expiresInSeconds, setExpiresInSeconds] = useState(300); // 5 minutes

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOtpDigits(["", "", "", "", "", ""]);
      setPassword("");
      setError(null);
      setSuccessMsg(null);
      setCooldown(60);
      setExpiresInSeconds(300);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // 5-minute expiry countdown
  useEffect(() => {
    if (!isOpen || expiresInSeconds <= 0) return;
    const interval = setInterval(() => {
      setExpiresInSeconds((s) => {
        if (s <= 1) {
          setError("Verification OTP has expired. Please request a new code.");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, expiresInSeconds]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (char && !/^\d+$/.test(char)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setError(null);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(paste)) {
      const chars = paste.split("");
      setOtpDigits(chars);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otpDigits.join("");
    if (!usePasswordForLink && fullOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    if (usePasswordForLink && !password) {
      setError("Please enter your existing account password.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === "otp") {
        if (!tempToken) throw new Error("Missing verification token.");
        const res = await verifyOAuthOTP(tempToken, fullOtp);
        setSuccessMsg("Verification successful! Redirecting...");
        setTimeout(() => onSuccess(res), 600);
      } else {
        // mode === "link"
        if (!linkToken) throw new Error("Missing account linking session.");
        const res = await confirmOAuthLink(
          linkToken,
          usePasswordForLink ? undefined : fullOtp,
          usePasswordForLink ? password : undefined
        );
        setSuccessMsg(`Account successfully linked with ${provider}! Redirecting...`);
        setTimeout(() => onSuccess(res), 600);
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === "otp") {
        if (!tempToken) return;
        const res = await resendOAuthOTP(tempToken);
        setCooldown(res.cooldown_seconds || 60);
      } else {
        if (!linkToken) return;
        const res = await resendOAuthLinkOTP(linkToken);
        setCooldown(res.cooldown_seconds || 60);
      }
      setExpiresInSeconds(300);
      setSuccessMsg("A fresh 6-digit code has been dispatched to your email.");
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,109,106,0.2)] border border-[#D9E5E3] p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E6F4F2] text-[#006D6A] mb-3 shadow-inner">
            <ShieldCheck size={28} />
          </div>
          <h3 className="text-xl font-black text-slate-800">
            {mode === "link" ? `Link Your ${provider} Account` : "Email Verification"}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {mode === "link"
              ? `An account with this email already exists. Verify your identity to securely connect your ${provider} account.`
              : `SAI security policy requires verifying your ${provider} authenticated email.`}
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
            <Mail size={13} className="text-[#006D6A]" />
            <span>{maskedEmail}</span>
          </div>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs flex items-start gap-2">
            <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-green-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Verification Inputs */}
        {mode === "link" && (
          <div className="flex p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setUsePasswordForLink(false); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                !usePasswordForLink ? "bg-white text-[#006D6A] shadow" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Verify with Email OTP
            </button>
            <button
              type="button"
              onClick={() => { setUsePasswordForLink(true); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                usePasswordForLink ? "bg-white text-[#006D6A] shadow" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Verify with Password
            </button>
          </div>
        )}

        {usePasswordForLink ? (
          <div className="mb-5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Existing Account Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="Enter your SAI account password"
                className="w-full bg-slate-50 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 border border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
              />
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3 text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex justify-center gap-2 mb-3" onPaste={handlePaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={loading}
                  className="w-11 h-14 text-center text-xl font-black bg-slate-50 rounded-xl border border-[#D9E5E3] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006D6A] focus:border-transparent transition-all"
                />
              ))}
            </div>

            {/* Timer & Resend */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 mt-3">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock size={13} />
                <span>Expires in: <strong className="text-slate-700">{formatTimer(expiresInSeconds)}</strong></span>
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="text-[#006D6A] font-semibold hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-[#006D6A] text-white font-bold py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(0,109,106,0.3)] hover:bg-[#004F4D] transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Verifying &amp; Signing In...</span>
            </>
          ) : (
            <span>{mode === "link" ? "Confirm & Link Account" : "Verify & Sign In"}</span>
          )}
        </button>
      </div>
    </div>
  );
};
