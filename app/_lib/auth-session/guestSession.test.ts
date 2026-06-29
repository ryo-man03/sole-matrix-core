import { createModeAwareRecommendation } from "../core-v1/modeRecommendation";
import type { BalancedScore, CandidateProfile, RyoScore } from "../core-v1/types";
import {
  GUEST_SESSION_STORAGE_KEY,
  beginGuestSession,
  canGuestDiagnose,
  completeGuestDiagnosis,
  createUserAuthState,
  isSupabaseBrowserConfigured,
  readGuestSession,
} from "./guestSession";
import type { AuthState, SessionStorage } from "./types";

function memoryStorage(): SessionStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

describe("auth and guest session boundary", () => {
  it("allows one guest diagnosis and restores the UX state", () => {
    const storage = memoryStorage();
    const guest = beginGuestSession(storage, () => "guest_abcdef12");

    expect(canGuestDiagnose(guest)).toBe(true);
    const completed = completeGuestDiagnosis(guest, storage);
    expect(canGuestDiagnose(completed)).toBe(false);
    expect(readGuestSession(storage)).toEqual(completed);
    expect(beginGuestSession(storage, () => "guest_unused0")).toEqual(completed);
  });

  it("persists no guest history or personal identity", () => {
    const storage = memoryStorage();
    completeGuestDiagnosis(
      beginGuestSession(storage, () => "guest_abcdef12"),
      storage,
    );
    const persisted = storage.values.get(GUEST_SESSION_STORAGE_KEY)!;

    expect(JSON.parse(persisted)).toEqual({
      kind: "guest",
      guestId: "guest_abcdef12",
      hasCompletedDiagnosis: true,
    });
    expect(persisted).not.toContain("history");
    expect(persisted).not.toContain("displayName");
    expect(persisted).not.toContain("userId");
  });

  it("keeps user and guest states disjoint", () => {
    const guestState: AuthState = {
      status: "guest",
      session: {
        kind: "guest",
        guestId: "guest_abcdef12",
        hasCompletedDiagnosis: false,
      },
    };
    const userState = createUserAuthState({
      kind: "user",
      userId: "ryo_01",
      displayName: "Ryo",
    });

    expect(guestState.session.kind).toBe("guest");
    expect(userState).toMatchObject({ status: "user", session: { kind: "user" } });
    expect(userState).not.toEqual(guestState);
  });

  it("works without Supabase browser configuration", () => {
    expect(isSupabaseBrowserConfigured({})).toBe(false);
    expect(isSupabaseBrowserConfigured({ url: "", anonKey: "" })).toBe(false);
    expect(
      isSupabaseBrowserConfigured({
        url: "https://example.supabase.co",
        anonKey: "anon",
      }),
    ).toBe(true);
  });

  it("does not change Core Decision based on auth state", () => {
    const candidate: CandidateProfile = {
      id: "candidate",
      name: "Reebok Classic Leather",
      source: "local",
      description: "classic leather",
      tags: ["classic", "low_tech", "heritage"],
      vector: {
        culture: 80,
        styleFit: 80,
        simplicity: 80,
        street: 60,
        volume: 30,
        comfort: 70,
        durability: 75,
        priceLevel: 45,
      },
      budgetFit: 85,
      risk: "low",
      informationCompleteness: 90,
      readiness: "ready_local",
      priceYen: 12_000,
    };
    const balancedScore: BalancedScore = {
      total: 80,
      featureFit: 80,
      tagMatch: 80,
      budgetFit: 85,
      versatility: 82,
      informationConfidence: 90,
    };
    const ryoScore: RyoScore = {
      total: 84,
      preferenceFit: 84,
      culturalFit: 86,
      classicRetroFit: 90,
      streetFit: 70,
      calmStyleFit: 82,
      enthusiastValue: 82,
    };
    const recommend = () =>
      createModeAwareRecommendation({
        mode: "ryo",
        candidate,
        balancedScore,
        ryoScore,
      });

    const beforeAuth = recommend();
    createUserAuthState({ kind: "user", userId: "ryo_01" });
    const afterAuth = recommend();
    expect(afterAuth.decision).toBe(beforeAuth.decision);
    expect(afterAuth.ryoScore).toBe(beforeAuth.ryoScore);
  });
});
