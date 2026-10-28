// Client-side OAuth Client for Official Google Sign-In and Sign in with Apple

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

let googleScriptLoadingPromise: Promise<void> | null = null;
let appleScriptLoadingPromise: Promise<void> | null = null;

export function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts) {
    return Promise.resolve();
  }
  if (googleScriptLoadingPromise) {
    return googleScriptLoadingPromise;
  }
  googleScriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Sign-In SDK")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In SDK. Check network connection."));
    document.head.appendChild(script);
  });
  return googleScriptLoadingPromise;
}

export function loadAppleScript(): Promise<void> {
  if (window.AppleID?.auth) {
    return Promise.resolve();
  }
  if (appleScriptLoadingPromise) {
    return appleScriptLoadingPromise;
  }
  appleScriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Apple Sign-In SDK")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Apple Sign-In SDK. Check network connection."));
    document.head.appendChild(script);
  });
  return appleScriptLoadingPromise;
}

export interface GoogleAuthResult {
  id_token?: string;
  code?: string;
}

export async function initiateGoogleSignIn(clientId: string): Promise<GoogleAuthResult> {
  if (!clientId || !clientId.trim()) {
    throw new Error("CONFIG_MISSING: Google Client ID is not configured. Please set GOOGLE_CLIENT_ID in your environment.");
  }

  try {
    await loadGoogleScript();
  } catch (err: any) {
    throw new Error("NETWORK_FAILURE: Could not connect to Google services. Please check your internet connection.");
  }

  if (!window.google?.accounts?.id && !window.google?.accounts?.oauth2) {
    throw new Error("Google Identity SDK failed to initialize.");
  }

  // Use Google Identity Services OAuth 2.0 Code or ID Token Client
  return new Promise<GoogleAuthResult>((resolve, reject) => {
    let resolved = false;

    try {
      // If code client is available, get code
      if (window.google.accounts.oauth2?.initCodeClient) {
        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: (response: any) => {
            if (response.error) {
              if (response.error === "popup_closed_by_user" || response.error === "access_denied") {
                reject(new Error("USER_CANCELLED: Google sign-in was cancelled by user."));
              } else {
                reject(new Error(`AUTH_FAILED: ${response.error}`));
              }
              return;
            }
            resolved = true;
            resolve({ code: response.code });
          },
          error_callback: (err: any) => {
            if (err.type === "popup_closed") {
              reject(new Error("USER_CANCELLED: Google sign-in popup was closed."));
            } else {
              reject(new Error(`AUTH_FAILED: ${err.message || "Google sign-in failed."}`));
            }
          }
        });
        client.requestCode();
      } else {
        // Fallback to Google ID Token OneTap / Popup
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              resolved = true;
              resolve({ id_token: response.credential });
            } else {
              reject(new Error("AUTH_FAILED: No identity credential returned by Google."));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            reject(new Error("Google sign-in prompt could not be displayed. Please check popup blockers."));
          } else if (notification.isSkippedMoment()) {
            if (!resolved) {
              reject(new Error("USER_CANCELLED: Google sign-in was skipped or cancelled."));
            }
          } else if (notification.isDismissedMoment()) {
            if (!resolved) {
              reject(new Error("USER_CANCELLED: Google sign-in was dismissed."));
            }
          }
        });
      }
    } catch (e: any) {
      reject(new Error(`Google Sign-In initialization failed: ${e.message}`));
    }
  });
}

export interface AppleAuthResult {
  identity_token: string;
  code?: string;
  user?: {
    name?: { firstName?: string; lastName?: string };
    email?: string;
  };
}

export async function initiateAppleSignIn(
  clientId: string,
  redirectURI: string
): Promise<AppleAuthResult> {
  if (!clientId || !clientId.trim()) {
    throw new Error("CONFIG_MISSING: Apple Client ID is not configured. Please set APPLE_CLIENT_ID in your environment.");
  }

  try {
    await loadAppleScript();
  } catch (err: any) {
    throw new Error("NETWORK_FAILURE: Could not connect to Apple services. Please check your internet connection.");
  }

  if (!window.AppleID?.auth) {
    throw new Error("Apple Sign-In SDK failed to initialize.");
  }

  try {
    const nonce = Math.random().toString(36).substring(2, 15);
    window.AppleID.auth.init({
      clientId: clientId,
      scope: "name email",
      redirectURI: redirectURI || window.location.origin,
      state: `sai_apple_${Date.now()}`,
      nonce: nonce,
      usePopup: true,
    });

    const response = await window.AppleID.auth.signIn();
    if (!response || !response.authorization?.id_token) {
      throw new Error("AUTH_FAILED: Apple did not return an identity token.");
    }

    return {
      identity_token: response.authorization.id_token,
      code: response.authorization.code,
      user: response.user,
    };
  } catch (err: any) {
    if (err.error === "popup_closed_by_user" || err.message?.includes("popup_closed")) {
      throw new Error("USER_CANCELLED: Apple sign-in popup was closed by user.");
    }
    if (err.error === "user_cancelled_authorize") {
      throw new Error("USER_CANCELLED: Apple authorization was cancelled.");
    }
    throw new Error(err.message || "Apple Sign-In failed.");
  }
}
