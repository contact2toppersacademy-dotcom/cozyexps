import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export interface GoogleUserProfile {
  name: string;
  email: string;
  picture?: string;
}

export const SCOPES = ['https://www.googleapis.com/auth/drive.appdata'];

const GIS_SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

const USER_PROFILE_KEY = 'cozyledger_user_profile_v1';

// In-memory access token cache ONLY (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningInFlag = false;

const envClientId = ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '').trim();

// Initialize Firebase Auth popup helper only when not overridden by a custom VITE_GOOGLE_CLIENT_ID
const firebaseApp = !envClientId
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null;
const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

interface GisTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GisTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string; hint?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: GisTokenResponse) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => GisTokenClient;
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

export function loadSavedUserProfile(): GoogleUserProfile | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GoogleUserProfile;
    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return cachedAccessToken;
}

export function clearCachedToken(): void {
  cachedAccessToken = null;
}

export function initAuth(
  onAuthReady: (user: GoogleUserProfile | null, token: string | null) => void
): () => void {
  if (envClientId || !firebaseAuth) {
    onAuthReady(loadSavedUserProfile(), cachedAccessToken);
    return () => {};
  }

  return onAuthStateChanged(firebaseAuth, (fbUser) => {
    if (isSigningInFlag) return;
    if (fbUser && fbUser.email) {
      const profile: GoogleUserProfile = {
        name: fbUser.displayName || fbUser.email.split('@')[0],
        email: fbUser.email,
        picture: fbUser.photoURL || undefined,
      };
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      onAuthReady(profile, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      localStorage.removeItem(USER_PROFILE_KEY);
      onAuthReady(null, null);
    }
  });
}

async function signInWithGIS(): Promise<{ user: GoogleUserProfile; accessToken: string }> {
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('Google Sign-In is still loading. Please try again in a moment.');
  }

  const existingProfile = loadSavedUserProfile();
  const tokenResp = await new Promise<GisTokenResponse>((resolve, reject) => {
    let settled = false;
    const client = oauth2.initTokenClient({
      client_id: envClientId,
      scope: GIS_SCOPES,
      callback: (resp) => {
        if (settled) return;
        settled = true;
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error));
          return;
        }
        resolve(resp);
      },
      error_callback: (err) => {
        if (settled) return;
        settled = true;
        reject(new Error(err?.message || 'Google sign-in popup was closed or blocked.'));
      },
    });

    client.requestAccessToken({
      prompt: existingProfile ? '' : 'select_account consent',
      hint: existingProfile?.email,
    });
  });

  if (!tokenResp.access_token) {
    throw new Error('Could not obtain Google Drive permission.');
  }

  cachedAccessToken = tokenResp.access_token;

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${cachedAccessToken}` },
  });
  if (!profileRes.ok) {
    throw new Error('Signed in, but could not load your Google profile.');
  }

  const info = (await profileRes.json()) as {
    name?: string;
    email?: string;
    picture?: string;
  };
  if (!info.email) {
    throw new Error('Google account email is unavailable.');
  }

  const user: GoogleUserProfile = {
    name: info.name || info.email.split('@')[0],
    email: info.email,
    picture: info.picture,
  };
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  return { user, accessToken: cachedAccessToken };
}

export async function signInWithGoogle(): Promise<{
  user: GoogleUserProfile;
  accessToken: string;
}> {
  if (envClientId || !firebaseAuth) {
    return signInWithGIS();
  }

  try {
    isSigningInFlag = true;
    const result = await signInWithPopup(firebaseAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken || !result.user.email) {
      throw new Error('Could not get Google Drive permission. Please allow Drive access and try again.');
    }
    cachedAccessToken = credential.accessToken;
    const user: GoogleUserProfile = {
      name: result.user.displayName || result.user.email.split('@')[0],
      email: result.user.email,
      picture: result.user.photoURL || undefined,
    };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
    return { user, accessToken: cachedAccessToken };
  } finally {
    isSigningInFlag = false;
  }
}

export async function signOutGoogle(): Promise<void> {
  const token = cachedAccessToken;
  cachedAccessToken = null;
  localStorage.removeItem(USER_PROFILE_KEY);

  if (firebaseAuth) {
    await firebaseAuth.signOut();
  }
  if (token && window.google?.accounts?.oauth2) {
    await new Promise<void>((resolve) => {
      window.google!.accounts!.oauth2!.revoke(token, () => resolve());
    });
  }
}
