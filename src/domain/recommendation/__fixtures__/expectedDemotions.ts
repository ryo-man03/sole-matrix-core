export const expectedDemotions = {
  caseA: {
    A1_canvas_high_overlap: [],
    A2_expensive_collab: [],
    A3_comfortable_simple_runner: [],
  },
  caseB: {
    B1_chunky_street: [],
    B2_clean_lowtech_safe: [],
    B3_trail_discovery: [],
  },
  caseC: {
    C1_comfort_runner: [],
    C2_culture_low_comfort: [],
    C3_premium_comfort: [],
  },
  caseD: {
    D1_high_overlap_buy_to_wait: ["HIGH_CLOSET_OVERLAP"],
  },
  caseE: {
    E1_low_price_fit_buy_to_wait: ["LOW_PRICE_FIT"],
  },
  caseF: {
    F1_low_comfort_buy_to_wait: ["LOW_COMFORT"],
  },
  caseG: {
    G1_low_durability_buy_to_wait: ["LOW_DURABILITY"],
  },
} as const;
