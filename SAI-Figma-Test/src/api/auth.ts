import { apiRequest, setStoredToken, setStoredRefreshToken, getStoredRefreshToken } from "./client";

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "buyer" | "seller" | "agent" | "builder" | "super_admin";
  is_active: boolean;
  is_totp_enabled?: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  role: string;
  user_id: number;
  name: string;
  email: string;
}

export interface AdminLoginResponse {
  status?: string;
  temp_token?: string;
  email?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  role?: string;
  user_id?: number;
  name?: string;
}

export interface TwoFASetupResponse {
  totp_secret: string;
  otpauth_url: string;
  qr_code_base64: string;
  recovery_codes: string[];
}

export async function login(email: string, password: string, role?: string): Promise<TokenResponse> {
  const data = await apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
  setStoredToken(data.access_token);
  if (data.refresh_token) {
    setStoredRefreshToken(data.refresh_token);
  }
  try {
    if (data.name) localStorage.setItem("sai_user_name", data.name);
    if (data.email) localStorage.setItem("sai_user_email", data.email);
    if (data.role) localStorage.setItem("sai_user_role", data.role);
  } catch {}
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: string,
  phone?: string,
  otp?: string
): Promise<UserResponse> {
  const data = await apiRequest<UserResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role, phone, otp }),
  });
  try {
    if (data.name) localStorage.setItem("sai_user_name", data.name);
    if (data.email) localStorage.setItem("sai_user_email", data.email);
    if (data.phone) localStorage.setItem("sai_user_phone", data.phone);
    if (data.role) localStorage.setItem("sai_user_role", data.role);
  } catch {}
  return data;
}

export async function getMe(): Promise<UserResponse> {
  return apiRequest<UserResponse>("/auth/me");
}

export async function logout() {
  const refreshToken = getStoredRefreshToken();
  try {
    if (refreshToken) {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } catch {}
  setStoredToken(null);
  setStoredRefreshToken(null);
  try {
    localStorage.removeItem("sai_user_name");
    localStorage.removeItem("sai_user_email");
    localStorage.removeItem("sai_user_phone");
    localStorage.removeItem("sai_user_role");
  } catch {}
}

export async function refreshAccessToken(): Promise<TokenResponse | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;
  try {
    const data = await apiRequest<TokenResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    setStoredToken(data.access_token);
    if (data.refresh_token) {
      setStoredRefreshToken(data.refresh_token);
    }
    return data;
  } catch {
    setStoredToken(null);
    setStoredRefreshToken(null);
    return null;
  }
}

export interface OAuthConfigResponse {
  google_configured: boolean;
  google_client_id: string;
  apple_configured: boolean;
  apple_client_id: string;
  require_oauth_otp: boolean;
}

export interface OAuthAuthResponse {
  success: boolean;
  requires_otp?: boolean;
  requires_linking?: boolean;
  temp_token?: string;
  link_token?: string;
  message?: string;
  masked_email?: string;
  provider?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  role?: string;
  user_id?: number;
  name?: string;
  email?: string;
}

export async function getOAuthConfig(): Promise<OAuthConfigResponse> {
  return apiRequest<OAuthConfigResponse>("/auth/oauth/config");
}

export async function googleLogin(
  params: {
    token?: string;
    id_token?: string;
    code?: string;
    role?: string;
    redirect_uri?: string;
    email?: string;
    name?: string;
    google_id?: string;
  }
): Promise<OAuthAuthResponse> {
  const data = await apiRequest<OAuthAuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (data.access_token) {
    setStoredToken(data.access_token);
    if (data.refresh_token) {
      setStoredRefreshToken(data.refresh_token);
    }
    try {
      if (data.name) localStorage.setItem("sai_user_name", data.name);
      if (data.email) localStorage.setItem("sai_user_email", data.email);
      if (data.role) localStorage.setItem("sai_user_role", data.role);
    } catch {}
  }
  return data;
}

export async function appleLogin(
  params: {
    identity_token?: string;
    code?: string;
    role?: string;
    email?: string;
    name?: string;
    apple_id?: string;
  }
): Promise<OAuthAuthResponse> {
  const data = await apiRequest<OAuthAuthResponse>("/auth/apple", {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (data.access_token) {
    setStoredToken(data.access_token);
    if (data.refresh_token) {
      setStoredRefreshToken(data.refresh_token);
    }
    try {
      if (data.name) localStorage.setItem("sai_user_name", data.name);
      if (data.email) localStorage.setItem("sai_user_email", data.email);
      if (data.role) localStorage.setItem("sai_user_role", data.role);
    } catch {}
  }
  return data;
}

export async function verifyOAuthOTP(tempToken: string, otp: string): Promise<OAuthAuthResponse> {
  const data = await apiRequest<OAuthAuthResponse>("/auth/oauth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ temp_token: tempToken, otp }),
  });
  if (data.access_token) {
    setStoredToken(data.access_token);
    if (data.refresh_token) {
      setStoredRefreshToken(data.refresh_token);
    }
  }
  return data;
}

export async function resendOAuthOTP(tempToken: string): Promise<SendOTPResponse> {
  return apiRequest<SendOTPResponse>("/auth/oauth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ temp_token: tempToken }),
  });
}

export async function confirmOAuthLink(
  linkToken: string,
  otp?: string,
  password?: string
): Promise<OAuthAuthResponse> {
  const data = await apiRequest<OAuthAuthResponse>("/auth/oauth/link-confirm", {
    method: "POST",
    body: JSON.stringify({ link_token: linkToken, otp, password }),
  });
  if (data.access_token) {
    setStoredToken(data.access_token);
    if (data.refresh_token) {
      setStoredRefreshToken(data.refresh_token);
    }
  }
  return data;
}

export async function resendOAuthLinkOTP(linkToken: string): Promise<SendOTPResponse> {
  return apiRequest<SendOTPResponse>("/auth/oauth/link-resend-otp", {
    method: "POST",
    body: JSON.stringify({ link_token: linkToken }),
  });
}

export async function forgotPassword(email: string): Promise<{ message: string; dev_reset_token?: string }> {
  return apiRequest<{ message: string; dev_reset_token?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const data = await apiRequest<AdminLoginResponse>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.access_token) {
    setStoredToken(data.access_token);
    try {
      localStorage.setItem("sai_user_name", data.name || "Super Admin");
      localStorage.setItem("sai_user_email", data.email || email);
      localStorage.setItem("sai_user_role", "super_admin");
    } catch {}
  }
  return data;
}

export async function admin2FASetup(email: string, password: string): Promise<TwoFASetupResponse> {
  return apiRequest<TwoFASetupResponse>("/auth/admin/2fa/setup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function admin2FAVerify(email: string, code: string, tempToken?: string): Promise<TokenResponse> {
  const data = await apiRequest<TokenResponse>("/auth/admin/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ email, code, temp_token: tempToken }),
  });
  setStoredToken(data.access_token);
  try {
    localStorage.setItem("sai_user_name", data.name || "Super Admin");
    localStorage.setItem("sai_user_email", data.email || email);
    localStorage.setItem("sai_user_role", "super_admin");
  } catch {}
  return data;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  cooldown_seconds?: number;
  expires_in_minutes?: number;
  dev_otp?: string;
  email_dispatched?: boolean;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  reset_token?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  role?: string;
  user_id?: number;
  name?: string;
  email?: string;
}

export async function sendEmailOTP(
  email: string,
  purpose: string = "verification",
  name?: string,
  role?: string
): Promise<SendOTPResponse> {
  return apiRequest<SendOTPResponse>("/auth/otp/send", {
    method: "POST",
    body: JSON.stringify({ email, purpose, name, role }),
  });
}

export async function resendEmailOTP(
  email: string,
  purpose: string = "verification"
): Promise<SendOTPResponse> {
  return apiRequest<SendOTPResponse>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email, purpose }),
  });
}

export async function verifyEmailOTP(
  email: string,
  otp: string,
  role?: string,
  name?: string
): Promise<VerifyOTPResponse> {
  const data = await apiRequest<VerifyOTPResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp, role, name }),
  });
  if (data.access_token) {
    setStoredToken(data.access_token);
  }
  if (data.refresh_token) {
    setStoredRefreshToken(data.refresh_token);
  }
  try {
    if (data.name) localStorage.setItem("sai_user_name", data.name);
    else if (name) localStorage.setItem("sai_user_name", name);
    if (data.email) localStorage.setItem("sai_user_email", data.email);
    else if (email) localStorage.setItem("sai_user_email", email);
    if (data.role) localStorage.setItem("sai_user_role", data.role);
    else if (role) localStorage.setItem("sai_user_role", role);
  } catch {}
  return data;
}

