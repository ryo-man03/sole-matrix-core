import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseServerClient, getAuthenticatedUser } from "../../infrastructure/auth/supabase/server";
import { authorizeDataSteward } from "./authorization";

vi.mock("../../infrastructure/auth/supabase/server", () => ({
  getAuthenticatedUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

describe("server-side data steward authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("defaults to unauthenticated without a server-verified user", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ configured: true, user: null });
    expect(await authorizeDataSteward()).toEqual({ authorized: false, reason: "unauthenticated" });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("denies a normal authenticated user", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ configured: true, user: { id: "user-1" } as never });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc: vi.fn().mockResolvedValue({ data: false, error: null }) } as never);
    expect(await authorizeDataSteward()).toEqual({ authorized: false, reason: "forbidden" });
  });

  it("authorizes only the actor returned by server auth when the DB role check passes", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ configured: true, user: { id: "user-1" } as never });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc: vi.fn().mockResolvedValue({ data: true, error: null }) } as never);
    expect(await authorizeDataSteward()).toEqual({ authorized: true, actorId: "user-1" });
  });

  it("fails closed when the role database is unavailable", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ configured: true, user: { id: "user-1" } as never });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "missing migration" } }) } as never);
    expect(await authorizeDataSteward()).toEqual({ authorized: false, reason: "role_unavailable" });
  });
});
