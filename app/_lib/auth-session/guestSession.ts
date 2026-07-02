import type {
  AuthState,
  GuestSession,
  SessionStorage,
  UserSession,
} from "./types";

export const GUEST_SESSION_STORAGE_KEY = "sole-matrix:guest-session:v1";

export function createGuestSession(
  createId: () => string = createGuestId,
): GuestSession {
  return {
    kind: "guest",
    guestId: createId(),
    hasCompletedDiagnosis: false,
  };
}

export function beginGuestSession(
  storage?: SessionStorage,
  createId?: () => string,
): GuestSession {
  const existing = storage ? readGuestSession(storage) : null;
  if (existing) return existing;

  const session = createGuestSession(createId);
  persistGuestSession(storage, session);
  return session;
}

export function completeGuestDiagnosis(
  session: GuestSession,
  storage?: SessionStorage,
): GuestSession {
  const reusable = { ...session, hasCompletedDiagnosis: false };
  persistGuestSession(storage, reusable);
  return reusable;
}

export function canGuestDiagnose(_session: GuestSession): boolean {
  return true;
}

export function readGuestSession(
  storage: SessionStorage,
): GuestSession | null {
  try {
    const raw = storage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return null;
    if (
      value["kind"] !== "guest" ||
      typeof value["guestId"] !== "string" ||
      !/^guest_[a-zA-Z0-9_-]{6,80}$/.test(value["guestId"]) ||
      typeof value["hasCompletedDiagnosis"] !== "boolean"
    ) {
      return null;
    }
    return {
      kind: "guest",
      guestId: value["guestId"],
      hasCompletedDiagnosis: false,
    };
  } catch {
    return null;
  }
}

export function createUserAuthState(session: UserSession): AuthState {
  return { status: "user", session };
}

export function isSupabaseBrowserConfigured(env: {
  url?: string | undefined;
  anonKey?: string | undefined;
}): boolean {
  return Boolean(env.url?.trim() && env.anonKey?.trim());
}

function persistGuestSession(
  storage: SessionStorage | undefined,
  session: GuestSession,
): void {
  if (!storage) return;
  try {
    storage.setItem(GUEST_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable in private browsing or a restricted WebView.
  }
}

function createGuestId(): string {
  const randomId = globalThis.crypto?.randomUUID?.().replaceAll("-", "");
  return `guest_${randomId ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
