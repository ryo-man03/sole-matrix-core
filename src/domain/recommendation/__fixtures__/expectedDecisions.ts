export const expectedDecisions = {
  caseA: {
    A1_canvas_high_overlap: {
      rawDecision: "WAIT",
      finalDecision: "WAIT",
    },
    A2_expensive_collab: {
      rawDecision: "WAIT",
      finalDecision: "WAIT",
    },
    A3_comfortable_simple_runner: {
      rawDecision: "BUY",
      finalDecision: "BUY",
    },
  },
  caseB: {
    B1_chunky_street: {
      rawDecision: "BUY",
      finalDecision: "BUY",
    },
    B2_clean_lowtech_safe: {
      rawDecision: "WAIT",
      finalDecision: "WAIT",
    },
    B3_trail_discovery: {
      rawDecision: "BUY",
      finalDecision: "BUY",
    },
  },
  caseC: {
    C1_comfort_runner: {
      rawDecision: "BUY",
      finalDecision: "BUY",
    },
    C2_culture_low_comfort: {
      rawDecision: "WAIT",
      finalDecision: "WAIT",
    },
    C3_premium_comfort: {
      rawDecision: "WAIT",
      finalDecision: "WAIT",
    },
  },
  caseD: {
    D1_high_overlap_buy_to_wait: {
      rawDecision: "BUY",
      finalDecision: "WAIT",
    },
  },
  caseE: {
    E1_low_price_fit_buy_to_wait: {
      rawDecision: "BUY",
      finalDecision: "WAIT",
    },
  },
  caseF: {
    F1_low_comfort_buy_to_wait: {
      rawDecision: "STRONG_BUY",
      finalDecision: "WAIT",
    },
  },
  caseG: {
    G1_low_durability_buy_to_wait: {
      rawDecision: "STRONG_BUY",
      finalDecision: "WAIT",
    },
  },
} as const;
