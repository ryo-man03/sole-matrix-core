export type UserSession = {
  kind: "user";
  userId: string;
  displayName?: string;
};

export type GuestSession = {
  kind: "guest";
  guestId: string;
  hasCompletedDiagnosis: boolean;
};

export type AuthState =
  | { status: "loading" }
  | { status: "guest"; session: GuestSession }
  | { status: "user"; session: UserSession }
  | { status: "signed_out" };

export type SessionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
