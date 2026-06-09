# 09. Test Fixture Lock

## 1. 結論

Core v0.1では、fixtureと期待値をTypeScriptで固定する。  
Markdown表だけで終わらせない。

## 2. 作成するfixtureファイル

```txt
src/domain/recommendation/__fixtures__/samplePreferenceProfiles.ts
src/domain/recommendation/__fixtures__/sampleSneakerVectors.ts
src/domain/recommendation/__fixtures__/sampleOwnedSneakers.ts
src/domain/recommendation/__fixtures__/expectedScoreBreakdowns.ts
src/domain/recommendation/__fixtures__/expectedDecisions.ts
src/domain/recommendation/__fixtures__/expectedDemotions.ts
src/domain/recommendation/__fixtures__/expectedSnapshots.ts
```

## 3. `samplePreferenceProfiles.ts`

```ts
export const samplePreferenceProfiles = {
  "caseA": {
    "userId": "sample_user_a",
    "vector": {
      "culture": 60,
      "styleFit": 80,
      "simplicity": 85,
      "street": 30,
      "volume": 20,
      "comfort": 65,
      "durability": 70
    },
    "policy": {
      "priceSensitivity": 85,
      "overlapSensitivity": 80,
      "explorationTolerance": 30
    },
    "axisImportance": {
      "culture": 60,
      "styleFit": 80,
      "simplicity": 85,
      "street": 40,
      "volume": 40,
      "comfort": 70,
      "durability": 65
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseB": {
    "userId": "sample_user_b",
    "vector": {
      "culture": 55,
      "styleFit": 60,
      "simplicity": 35,
      "street": 90,
      "volume": 85,
      "comfort": 55,
      "durability": 50
    },
    "policy": {
      "priceSensitivity": 45,
      "overlapSensitivity": 50,
      "explorationTolerance": 80
    },
    "axisImportance": {
      "culture": 45,
      "styleFit": 60,
      "simplicity": 35,
      "street": 95,
      "volume": 95,
      "comfort": 45,
      "durability": 40
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseC": {
    "userId": "sample_user_c",
    "vector": {
      "culture": 40,
      "styleFit": 60,
      "simplicity": 55,
      "street": 30,
      "volume": 40,
      "comfort": 90,
      "durability": 90
    },
    "policy": {
      "priceSensitivity": 80,
      "overlapSensitivity": 60,
      "explorationTolerance": 35
    },
    "axisImportance": {
      "culture": 30,
      "styleFit": 60,
      "simplicity": 50,
      "street": 30,
      "volume": 40,
      "comfort": 100,
      "durability": 95
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseD": {
    "userId": "sample_user_d",
    "vector": {
      "culture": 70,
      "styleFit": 80,
      "simplicity": 80,
      "street": 40,
      "volume": 25,
      "comfort": 75,
      "durability": 75
    },
    "policy": {
      "priceSensitivity": 25,
      "overlapSensitivity": 100,
      "explorationTolerance": 30
    },
    "axisImportance": {
      "culture": 60,
      "styleFit": 85,
      "simplicity": 80,
      "street": 40,
      "volume": 35,
      "comfort": 70,
      "durability": 70
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseE": {
    "userId": "sample_user_e",
    "vector": {
      "culture": 70,
      "styleFit": 80,
      "simplicity": 75,
      "street": 50,
      "volume": 40,
      "comfort": 80,
      "durability": 80
    },
    "policy": {
      "priceSensitivity": 100,
      "overlapSensitivity": 20,
      "explorationTolerance": 40
    },
    "axisImportance": {
      "culture": 60,
      "styleFit": 80,
      "simplicity": 70,
      "street": 50,
      "volume": 40,
      "comfort": 70,
      "durability": 70
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseF": {
    "userId": "sample_user_f",
    "vector": {
      "culture": 80,
      "styleFit": 85,
      "simplicity": 70,
      "street": 60,
      "volume": 50,
      "comfort": 40,
      "durability": 80
    },
    "policy": {
      "priceSensitivity": 15,
      "overlapSensitivity": 20,
      "explorationTolerance": 30
    },
    "axisImportance": {
      "culture": 80,
      "styleFit": 85,
      "simplicity": 65,
      "street": 60,
      "volume": 50,
      "comfort": 25,
      "durability": 75
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseG": {
    "userId": "sample_user_g",
    "vector": {
      "culture": 80,
      "styleFit": 85,
      "simplicity": 70,
      "street": 60,
      "volume": 50,
      "comfort": 80,
      "durability": 40
    },
    "policy": {
      "priceSensitivity": 15,
      "overlapSensitivity": 20,
      "explorationTolerance": 30
    },
    "axisImportance": {
      "culture": 80,
      "styleFit": 85,
      "simplicity": 65,
      "street": 60,
      "volume": 50,
      "comfort": 75,
      "durability": 25
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  }
} as const;
```

## 4. `sampleSneakerVectors.ts`

```ts
export const sampleSneakerVectors = {
  "caseA": {
    "A1_canvas_high_overlap": {
      "name": "Canvas Low-Tech High Overlap",
      "vector": {
        "culture": 65,
        "styleFit": 85,
        "simplicity": 90,
        "street": 25,
        "volume": 20,
        "comfort": 55,
        "durability": 65,
        "priceLevel": 35
      },
      "tags": [
        "low_tech",
        "canvas",
        "classic",
        "minimal"
      ],
      "budgetFit": 80
    },
    "A2_expensive_collab": {
      "name": "Expensive Retro Collab",
      "vector": {
        "culture": 85,
        "styleFit": 75,
        "simplicity": 50,
        "street": 75,
        "volume": 60,
        "comfort": 45,
        "durability": 50,
        "priceLevel": 90
      },
      "tags": [
        "collab",
        "retro",
        "street"
      ],
      "budgetFit": 80
    },
    "A3_comfortable_simple_runner": {
      "name": "Comfortable Simple Runner",
      "vector": {
        "culture": 45,
        "styleFit": 75,
        "simplicity": 80,
        "street": 35,
        "volume": 35,
        "comfort": 85,
        "durability": 80,
        "priceLevel": 55
      },
      "tags": [
        "running",
        "minimal",
        "comfortable"
      ],
      "budgetFit": 80
    }
  },
  "caseB": {
    "B1_chunky_street": {
      "name": "Chunky Street Basketball",
      "vector": {
        "culture": 60,
        "styleFit": 65,
        "simplicity": 25,
        "street": 95,
        "volume": 90,
        "comfort": 65,
        "durability": 60,
        "priceLevel": 65
      },
      "tags": [
        "street",
        "chunky",
        "basketball"
      ],
      "budgetFit": 80
    },
    "B2_clean_lowtech_safe": {
      "name": "Clean Low-Tech Safe Choice",
      "vector": {
        "culture": 50,
        "styleFit": 80,
        "simplicity": 90,
        "street": 25,
        "volume": 20,
        "comfort": 70,
        "durability": 65,
        "priceLevel": 40
      },
      "tags": [
        "minimal",
        "classic",
        "low_tech"
      ],
      "budgetFit": 80
    },
    "B3_trail_discovery": {
      "name": "Trail Outdoor Discovery",
      "vector": {
        "culture": 55,
        "styleFit": 55,
        "simplicity": 45,
        "street": 75,
        "volume": 70,
        "comfort": 80,
        "durability": 75,
        "priceLevel": 55
      },
      "tags": [
        "trail",
        "outdoor",
        "chunky"
      ],
      "budgetFit": 80
    }
  },
  "caseC": {
    "C1_comfort_runner": {
      "name": "Comfort Runner",
      "vector": {
        "culture": 55,
        "styleFit": 70,
        "simplicity": 65,
        "street": 35,
        "volume": 45,
        "comfort": 92,
        "durability": 88,
        "priceLevel": 70
      },
      "tags": [
        "running",
        "comfortable",
        "durable"
      ],
      "budgetFit": 75
    },
    "C2_culture_low_comfort": {
      "name": "Culture High Low Comfort",
      "vector": {
        "culture": 95,
        "styleFit": 55,
        "simplicity": 45,
        "street": 65,
        "volume": 60,
        "comfort": 35,
        "durability": 45,
        "priceLevel": 40
      },
      "tags": [
        "heritage",
        "retro",
        "basketball"
      ],
      "budgetFit": 75
    },
    "C3_premium_comfort": {
      "name": "Premium Comfort Model",
      "vector": {
        "culture": 60,
        "styleFit": 75,
        "simplicity": 60,
        "street": 40,
        "volume": 50,
        "comfort": 90,
        "durability": 85,
        "priceLevel": 95
      },
      "tags": [
        "comfortable",
        "premium",
        "running"
      ],
      "budgetFit": 75
    }
  },
  "caseD": {
    "D1_high_overlap_buy_to_wait": {
      "name": "High Overlap Buy To Wait",
      "vector": {
        "culture": 70,
        "styleFit": 82,
        "simplicity": 82,
        "street": 38,
        "volume": 25,
        "comfort": 80,
        "durability": 78,
        "priceLevel": 35
      },
      "tags": [
        "low_tech",
        "canvas",
        "classic",
        "minimal"
      ],
      "budgetFit": 90
    }
  },
  "caseE": {
    "E1_low_price_fit_buy_to_wait": {
      "name": "Low Price Fit Buy To Wait",
      "vector": {
        "culture": 72,
        "styleFit": 82,
        "simplicity": 76,
        "street": 52,
        "volume": 42,
        "comfort": 90,
        "durability": 88,
        "priceLevel": 100
      },
      "tags": [
        "premium",
        "comfortable",
        "classic"
      ],
      "budgetFit": 70
    }
  },
  "caseF": {
    "F1_low_comfort_buy_to_wait": {
      "name": "Low Comfort Buy To Wait",
      "vector": {
        "culture": 82,
        "styleFit": 86,
        "simplicity": 72,
        "street": 62,
        "volume": 52,
        "comfort": 35,
        "durability": 90,
        "priceLevel": 30
      },
      "tags": [
        "heritage",
        "street",
        "classic"
      ],
      "budgetFit": 90
    }
  },
  "caseG": {
    "G1_low_durability_buy_to_wait": {
      "name": "Low Durability Buy To Wait",
      "vector": {
        "culture": 82,
        "styleFit": 86,
        "simplicity": 72,
        "street": 62,
        "volume": 52,
        "comfort": 90,
        "durability": 40,
        "priceLevel": 30
      },
      "tags": [
        "heritage",
        "street",
        "classic"
      ],
      "budgetFit": 90
    }
  }
} as const;
```

## 5. `sampleOwnedSneakers.ts`

```ts
export const sampleOwnedSneakers = {
  "caseA": [
    {
      "sneakerId": "owned_chuck",
      "roleTags": [
        "low_tech",
        "canvas",
        "classic",
        "minimal"
      ],
      "wearFrequency": "high"
    }
  ],
  "caseB": [
    {
      "sneakerId": "owned_minimal",
      "roleTags": [
        "minimal",
        "low_tech",
        "canvas"
      ],
      "wearFrequency": "medium"
    }
  ],
  "caseC": [
    {
      "sneakerId": "owned_runner",
      "roleTags": [
        "running",
        "comfortable"
      ],
      "wearFrequency": "high"
    }
  ],
  "caseD": [
    {
      "sneakerId": "owned_lowtech_canvas",
      "roleTags": [
        "low_tech",
        "canvas",
        "classic",
        "minimal"
      ],
      "wearFrequency": "high"
    }
  ],
  "caseE": [],
  "caseF": [],
  "caseG": []
} as const;
```

## 6. `expectedScoreBreakdowns.ts`

```ts
export const expectedScoreBreakdowns = {
  "caseA": {
    "A1_canvas_high_overlap": {
      "cultureScore": 95.0,
      "styleScore": 95.0,
      "simplicityScore": 95.0,
      "streetScore": 95.0,
      "volumeScore": 100.0,
      "comfortScore": 55.0,
      "durabilityScore": 65.0,
      "tagBonus": 100.0,
      "featureFitScore": 83.92,
      "priceScore": 68.1,
      "overlapPenalty": 100.0,
      "nonOverlapScore": 0.0,
      "finalScore": 72.68,
      "axisWeightsApplied": {
        "culture": 0.1151,
        "styleFit": 0.204,
        "simplicity": 0.1412,
        "street": 0.0785,
        "volume": 0.0628,
        "comfort": 0.1883,
        "durability": 0.1404,
        "tagBonus": 0.0697
      }
    },
    "A2_expensive_collab": {
      "cultureScore": 75.0,
      "styleScore": 95.0,
      "simplicityScore": 65.0,
      "streetScore": 55.0,
      "volumeScore": 60.0,
      "comfortScore": 45.0,
      "durabilityScore": 50.0,
      "tagBonus": 0.0,
      "featureFitScore": 60.77,
      "priceScore": 49.4,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 62.65,
      "axisWeightsApplied": {
        "culture": 0.1151,
        "styleFit": 0.204,
        "simplicity": 0.1412,
        "street": 0.0785,
        "volume": 0.0628,
        "comfort": 0.1883,
        "durability": 0.1404,
        "tagBonus": 0.0697
      }
    },
    "A3_comfortable_simple_runner": {
      "cultureScore": 85.0,
      "styleScore": 95.0,
      "simplicityScore": 95.0,
      "streetScore": 95.0,
      "volumeScore": 85.0,
      "comfortScore": 85.0,
      "durabilityScore": 80.0,
      "tagBonus": 25.0,
      "featureFitScore": 84.35,
      "priceScore": 61.3,
      "overlapPenalty": 32.5,
      "nonOverlapScore": 67.5,
      "finalScore": 78.52,
      "axisWeightsApplied": {
        "culture": 0.1151,
        "styleFit": 0.204,
        "simplicity": 0.1412,
        "street": 0.0785,
        "volume": 0.0628,
        "comfort": 0.1883,
        "durability": 0.1404,
        "tagBonus": 0.0697
      }
    }
  },
  "caseB": {
    "B1_chunky_street": {
      "cultureScore": 95.0,
      "styleScore": 95.0,
      "simplicityScore": 90.0,
      "streetScore": 95.0,
      "volumeScore": 95.0,
      "comfortScore": 65.0,
      "durabilityScore": 60.0,
      "tagBonus": 75.0,
      "featureFitScore": 83.93,
      "priceScore": 68.3,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 82.72,
      "axisWeightsApplied": {
        "culture": 0.1084,
        "styleFit": 0.1882,
        "simplicity": 0.097,
        "street": 0.1378,
        "volume": 0.1103,
        "comfort": 0.1625,
        "durability": 0.1198,
        "tagBonus": 0.076
      }
    },
    "B2_clean_lowtech_safe": {
      "cultureScore": 95.0,
      "styleScore": 80.0,
      "simplicityScore": 45.0,
      "streetScore": 35.0,
      "volumeScore": 35.0,
      "comfortScore": 70.0,
      "durabilityScore": 65.0,
      "tagBonus": 0.0,
      "featureFitScore": 57.56,
      "priceScore": 72.8,
      "overlapPenalty": 40.0,
      "nonOverlapScore": 60.0,
      "finalScore": 60.55,
      "axisWeightsApplied": {
        "culture": 0.1084,
        "styleFit": 0.1882,
        "simplicity": 0.097,
        "street": 0.1378,
        "volume": 0.1103,
        "comfort": 0.1625,
        "durability": 0.1198,
        "tagBonus": 0.076
      }
    },
    "B3_trail_discovery": {
      "cultureScore": 100.0,
      "styleScore": 95.0,
      "simplicityScore": 90.0,
      "streetScore": 85.0,
      "volumeScore": 85.0,
      "comfortScore": 80.0,
      "durabilityScore": 75.0,
      "tagBonus": 25.0,
      "featureFitScore": 82.42,
      "priceScore": 70.1,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 81.96,
      "axisWeightsApplied": {
        "culture": 0.1084,
        "styleFit": 0.1882,
        "simplicity": 0.097,
        "street": 0.1378,
        "volume": 0.1103,
        "comfort": 0.1625,
        "durability": 0.1198,
        "tagBonus": 0.076
      }
    }
  },
  "caseC": {
    "C1_comfort_runner": {
      "cultureScore": 85.0,
      "styleScore": 90.0,
      "simplicityScore": 90.0,
      "streetScore": 95.0,
      "volumeScore": 95.0,
      "comfortScore": 92.0,
      "durabilityScore": 88.0,
      "tagBonus": 75.0,
      "featureFitScore": 89.29,
      "priceScore": 52.6,
      "overlapPenalty": 55.0,
      "nonOverlapScore": 45.0,
      "finalScore": 78.26,
      "axisWeightsApplied": {
        "culture": 0.0858,
        "styleFit": 0.1769,
        "simplicity": 0.1072,
        "street": 0.0715,
        "volume": 0.0643,
        "comfort": 0.2413,
        "durability": 0.1814,
        "tagBonus": 0.0715
      }
    },
    "C2_culture_low_comfort": {
      "cultureScore": 45.0,
      "styleScore": 95.0,
      "simplicityScore": 90.0,
      "streetScore": 65.0,
      "volumeScore": 80.0,
      "comfortScore": 35.0,
      "durabilityScore": 45.0,
      "tagBonus": 0.0,
      "featureFitScore": 56.71,
      "priceScore": 62.2,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 62.03,
      "axisWeightsApplied": {
        "culture": 0.0858,
        "styleFit": 0.1769,
        "simplicity": 0.1072,
        "street": 0.0715,
        "volume": 0.0643,
        "comfort": 0.2413,
        "durability": 0.1814,
        "tagBonus": 0.0715
      }
    },
    "C3_premium_comfort": {
      "cultureScore": 80.0,
      "styleScore": 85.0,
      "simplicityScore": 95.0,
      "streetScore": 90.0,
      "volumeScore": 90.0,
      "comfortScore": 90.0,
      "durabilityScore": 85.0,
      "tagBonus": 50.0,
      "featureFitScore": 85.02,
      "priceScore": 44.6,
      "overlapPenalty": 55.0,
      "nonOverlapScore": 45.0,
      "finalScore": 73.74,
      "axisWeightsApplied": {
        "culture": 0.0858,
        "styleFit": 0.1769,
        "simplicity": 0.1072,
        "street": 0.0715,
        "volume": 0.0643,
        "comfort": 0.2413,
        "durability": 0.1814,
        "tagBonus": 0.0715
      }
    }
  },
  "caseD": {
    "D1_high_overlap_buy_to_wait": {
      "cultureScore": 100.0,
      "styleScore": 98.0,
      "simplicityScore": 98.0,
      "streetScore": 98.0,
      "volumeScore": 100.0,
      "comfortScore": 80.0,
      "durabilityScore": 78.0,
      "tagBonus": 100.0,
      "featureFitScore": 92.21,
      "priceScore": 86.5,
      "overlapPenalty": 100.0,
      "nonOverlapScore": 0.0,
      "finalScore": 81.96,
      "axisWeightsApplied": {
        "culture": 0.1145,
        "styleFit": 0.2108,
        "simplicity": 0.1353,
        "street": 0.0781,
        "volume": 0.059,
        "comfort": 0.1873,
        "durability": 0.1457,
        "tagBonus": 0.0694
      }
    }
  },
  "caseE": {
    "E1_low_price_fit_buy_to_wait": {
      "cultureScore": 98.0,
      "styleScore": 98.0,
      "simplicityScore": 99.0,
      "streetScore": 98.0,
      "volumeScore": 98.0,
      "comfortScore": 90.0,
      "durabilityScore": 88.0,
      "tagBonus": 75.0,
      "featureFitScore": 93.56,
      "priceScore": 30.0,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 82.76,
      "axisWeightsApplied": {
        "culture": 0.1152,
        "styleFit": 0.2042,
        "simplicity": 0.1257,
        "street": 0.0873,
        "volume": 0.0628,
        "comfort": 0.1885,
        "durability": 0.1466,
        "tagBonus": 0.0698
      }
    }
  },
  "caseF": {
    "F1_low_comfort_buy_to_wait": {
      "cultureScore": 98.0,
      "styleScore": 99.0,
      "simplicityScore": 98.0,
      "streetScore": 98.0,
      "volumeScore": 98.0,
      "comfortScore": 35.0,
      "durabilityScore": 90.0,
      "tagBonus": 75.0,
      "featureFitScore": 87.7,
      "priceScore": 88.2,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 89.02,
      "axisWeightsApplied": {
        "culture": 0.1397,
        "styleFit": 0.2175,
        "simplicity": 0.1235,
        "street": 0.0985,
        "volume": 0.0716,
        "comfort": 0.1209,
        "durability": 0.1567,
        "tagBonus": 0.0716
      }
    }
  },
  "caseG": {
    "G1_low_durability_buy_to_wait": {
      "cultureScore": 98.0,
      "styleScore": 99.0,
      "simplicityScore": 98.0,
      "streetScore": 98.0,
      "volumeScore": 98.0,
      "comfortScore": 90.0,
      "durabilityScore": 40.0,
      "tagBonus": 75.0,
      "featureFitScore": 89.66,
      "priceScore": 88.2,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 90.43,
      "axisWeightsApplied": {
        "culture": 0.1372,
        "styleFit": 0.2137,
        "simplicity": 0.1214,
        "street": 0.0967,
        "volume": 0.0704,
        "comfort": 0.1979,
        "durability": 0.0923,
        "tagBonus": 0.0704
      }
    }
  }
} as const;
```

## 7. `expectedDecisions.ts`

```ts
export const expectedDecisions = {
  "caseA": {
    "A1_canvas_high_overlap": {
      "rawDecision": "WAIT",
      "finalDecision": "WAIT"
    },
    "A2_expensive_collab": {
      "rawDecision": "WAIT",
      "finalDecision": "WAIT"
    },
    "A3_comfortable_simple_runner": {
      "rawDecision": "BUY",
      "finalDecision": "BUY"
    }
  },
  "caseB": {
    "B1_chunky_street": {
      "rawDecision": "BUY",
      "finalDecision": "BUY"
    },
    "B2_clean_lowtech_safe": {
      "rawDecision": "WAIT",
      "finalDecision": "WAIT"
    },
    "B3_trail_discovery": {
      "rawDecision": "BUY",
      "finalDecision": "BUY"
    }
  },
  "caseC": {
    "C1_comfort_runner": {
      "rawDecision": "BUY",
      "finalDecision": "BUY"
    },
    "C2_culture_low_comfort": {
      "rawDecision": "WAIT",
      "finalDecision": "WAIT"
    },
    "C3_premium_comfort": {
      "rawDecision": "WAIT",
      "finalDecision": "WAIT"
    }
  },
  "caseD": {
    "D1_high_overlap_buy_to_wait": {
      "rawDecision": "BUY",
      "finalDecision": "WAIT"
    }
  },
  "caseE": {
    "E1_low_price_fit_buy_to_wait": {
      "rawDecision": "BUY",
      "finalDecision": "WAIT"
    }
  },
  "caseF": {
    "F1_low_comfort_buy_to_wait": {
      "rawDecision": "STRONG_BUY",
      "finalDecision": "WAIT"
    }
  },
  "caseG": {
    "G1_low_durability_buy_to_wait": {
      "rawDecision": "STRONG_BUY",
      "finalDecision": "WAIT"
    }
  }
} as const;
```

## 8. `expectedDemotions.ts`

```ts
export const expectedDemotions = {
  "caseA": {
    "A1_canvas_high_overlap": [],
    "A2_expensive_collab": [],
    "A3_comfortable_simple_runner": []
  },
  "caseB": {
    "B1_chunky_street": [],
    "B2_clean_lowtech_safe": [],
    "B3_trail_discovery": []
  },
  "caseC": {
    "C1_comfort_runner": [],
    "C2_culture_low_comfort": [],
    "C3_premium_comfort": []
  },
  "caseD": {
    "D1_high_overlap_buy_to_wait": [
      "HIGH_CLOSET_OVERLAP"
    ]
  },
  "caseE": {
    "E1_low_price_fit_buy_to_wait": [
      "LOW_PRICE_FIT"
    ]
  },
  "caseF": {
    "F1_low_comfort_buy_to_wait": [
      "LOW_COMFORT"
    ]
  },
  "caseG": {
    "G1_low_durability_buy_to_wait": [
      "LOW_DURABILITY"
    ]
  }
} as const;
```

## 9. `expectedSnapshots.ts`

```ts
export const expectedSnapshots = {
  "caseA": {
    "A1_canvas_high_overlap": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_a",
        "vector": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 30,
          "volume": 20,
          "comfort": 65,
          "durability": 70
        },
        "policy": {
          "priceSensitivity": 85,
          "overlapSensitivity": 80,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 40,
          "volume": 40,
          "comfort": 70,
          "durability": 65
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "A1_canvas_high_overlap",
        "name": "Canvas Low-Tech High Overlap",
        "vector": {
          "culture": 65,
          "styleFit": 85,
          "simplicity": 90,
          "street": 25,
          "volume": 20,
          "comfort": 55,
          "durability": 65,
          "priceLevel": 35
        },
        "tags": [
          "low_tech",
          "canvas",
          "classic",
          "minimal"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_chuck",
          "roleTags": [
            "low_tech",
            "canvas",
            "classic",
            "minimal"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "low_tech",
        "classic",
        "minimal",
        "canvas"
      ],
      "scoreBreakdown": {
        "cultureScore": 95.0,
        "styleScore": 95.0,
        "simplicityScore": 95.0,
        "streetScore": 95.0,
        "volumeScore": 100.0,
        "comfortScore": 55.0,
        "durabilityScore": 65.0,
        "tagBonus": 100.0,
        "featureFitScore": 83.92,
        "priceScore": 68.1,
        "overlapPenalty": 100.0,
        "nonOverlapScore": 0.0,
        "finalScore": 72.68,
        "axisWeightsApplied": {
          "culture": 0.1151,
          "styleFit": 0.204,
          "simplicity": 0.1412,
          "street": 0.0785,
          "volume": 0.0628,
          "comfort": 0.1883,
          "durability": 0.1404,
          "tagBonus": 0.0697
        }
      },
      "rawDecision": "WAIT",
      "finalDecision": "WAIT",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "A2_expensive_collab": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_a",
        "vector": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 30,
          "volume": 20,
          "comfort": 65,
          "durability": 70
        },
        "policy": {
          "priceSensitivity": 85,
          "overlapSensitivity": 80,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 40,
          "volume": 40,
          "comfort": 70,
          "durability": 65
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "A2_expensive_collab",
        "name": "Expensive Retro Collab",
        "vector": {
          "culture": 85,
          "styleFit": 75,
          "simplicity": 50,
          "street": 75,
          "volume": 60,
          "comfort": 45,
          "durability": 50,
          "priceLevel": 90
        },
        "tags": [
          "collab",
          "retro",
          "street"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_chuck",
          "roleTags": [
            "low_tech",
            "canvas",
            "classic",
            "minimal"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "low_tech",
        "classic",
        "minimal",
        "canvas"
      ],
      "scoreBreakdown": {
        "cultureScore": 75.0,
        "styleScore": 95.0,
        "simplicityScore": 65.0,
        "streetScore": 55.0,
        "volumeScore": 60.0,
        "comfortScore": 45.0,
        "durabilityScore": 50.0,
        "tagBonus": 0.0,
        "featureFitScore": 60.77,
        "priceScore": 49.4,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 62.65,
        "axisWeightsApplied": {
          "culture": 0.1151,
          "styleFit": 0.204,
          "simplicity": 0.1412,
          "street": 0.0785,
          "volume": 0.0628,
          "comfort": 0.1883,
          "durability": 0.1404,
          "tagBonus": 0.0697
        }
      },
      "rawDecision": "WAIT",
      "finalDecision": "WAIT",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "A3_comfortable_simple_runner": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_a",
        "vector": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 30,
          "volume": 20,
          "comfort": 65,
          "durability": 70
        },
        "policy": {
          "priceSensitivity": 85,
          "overlapSensitivity": 80,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 40,
          "volume": 40,
          "comfort": 70,
          "durability": 65
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "A3_comfortable_simple_runner",
        "name": "Comfortable Simple Runner",
        "vector": {
          "culture": 45,
          "styleFit": 75,
          "simplicity": 80,
          "street": 35,
          "volume": 35,
          "comfort": 85,
          "durability": 80,
          "priceLevel": 55
        },
        "tags": [
          "running",
          "minimal",
          "comfortable"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_chuck",
          "roleTags": [
            "low_tech",
            "canvas",
            "classic",
            "minimal"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "low_tech",
        "classic",
        "minimal",
        "canvas"
      ],
      "scoreBreakdown": {
        "cultureScore": 85.0,
        "styleScore": 95.0,
        "simplicityScore": 95.0,
        "streetScore": 95.0,
        "volumeScore": 85.0,
        "comfortScore": 85.0,
        "durabilityScore": 80.0,
        "tagBonus": 25.0,
        "featureFitScore": 84.35,
        "priceScore": 61.3,
        "overlapPenalty": 32.5,
        "nonOverlapScore": 67.5,
        "finalScore": 78.52,
        "axisWeightsApplied": {
          "culture": 0.1151,
          "styleFit": 0.204,
          "simplicity": 0.1412,
          "street": 0.0785,
          "volume": 0.0628,
          "comfort": 0.1883,
          "durability": 0.1404,
          "tagBonus": 0.0697
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "BUY",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseB": {
    "B1_chunky_street": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_b",
        "vector": {
          "culture": 55,
          "styleFit": 60,
          "simplicity": 35,
          "street": 90,
          "volume": 85,
          "comfort": 55,
          "durability": 50
        },
        "policy": {
          "priceSensitivity": 45,
          "overlapSensitivity": 50,
          "explorationTolerance": 80
        },
        "axisImportance": {
          "culture": 45,
          "styleFit": 60,
          "simplicity": 35,
          "street": 95,
          "volume": 95,
          "comfort": 45,
          "durability": 40
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "B1_chunky_street",
        "name": "Chunky Street Basketball",
        "vector": {
          "culture": 60,
          "styleFit": 65,
          "simplicity": 25,
          "street": 95,
          "volume": 90,
          "comfort": 65,
          "durability": 60,
          "priceLevel": 65
        },
        "tags": [
          "street",
          "chunky",
          "basketball"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_minimal",
          "roleTags": [
            "minimal",
            "low_tech",
            "canvas"
          ],
          "wearFrequency": "medium"
        }
      ],
      "preferredTags": [
        "street",
        "chunky",
        "basketball",
        "skate"
      ],
      "scoreBreakdown": {
        "cultureScore": 95.0,
        "styleScore": 95.0,
        "simplicityScore": 90.0,
        "streetScore": 95.0,
        "volumeScore": 95.0,
        "comfortScore": 65.0,
        "durabilityScore": 60.0,
        "tagBonus": 75.0,
        "featureFitScore": 83.93,
        "priceScore": 68.3,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 82.72,
        "axisWeightsApplied": {
          "culture": 0.1084,
          "styleFit": 0.1882,
          "simplicity": 0.097,
          "street": 0.1378,
          "volume": 0.1103,
          "comfort": 0.1625,
          "durability": 0.1198,
          "tagBonus": 0.076
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "BUY",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "B2_clean_lowtech_safe": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_b",
        "vector": {
          "culture": 55,
          "styleFit": 60,
          "simplicity": 35,
          "street": 90,
          "volume": 85,
          "comfort": 55,
          "durability": 50
        },
        "policy": {
          "priceSensitivity": 45,
          "overlapSensitivity": 50,
          "explorationTolerance": 80
        },
        "axisImportance": {
          "culture": 45,
          "styleFit": 60,
          "simplicity": 35,
          "street": 95,
          "volume": 95,
          "comfort": 45,
          "durability": 40
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "B2_clean_lowtech_safe",
        "name": "Clean Low-Tech Safe Choice",
        "vector": {
          "culture": 50,
          "styleFit": 80,
          "simplicity": 90,
          "street": 25,
          "volume": 20,
          "comfort": 70,
          "durability": 65,
          "priceLevel": 40
        },
        "tags": [
          "minimal",
          "classic",
          "low_tech"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_minimal",
          "roleTags": [
            "minimal",
            "low_tech",
            "canvas"
          ],
          "wearFrequency": "medium"
        }
      ],
      "preferredTags": [
        "street",
        "chunky",
        "basketball",
        "skate"
      ],
      "scoreBreakdown": {
        "cultureScore": 95.0,
        "styleScore": 80.0,
        "simplicityScore": 45.0,
        "streetScore": 35.0,
        "volumeScore": 35.0,
        "comfortScore": 70.0,
        "durabilityScore": 65.0,
        "tagBonus": 0.0,
        "featureFitScore": 57.56,
        "priceScore": 72.8,
        "overlapPenalty": 40.0,
        "nonOverlapScore": 60.0,
        "finalScore": 60.55,
        "axisWeightsApplied": {
          "culture": 0.1084,
          "styleFit": 0.1882,
          "simplicity": 0.097,
          "street": 0.1378,
          "volume": 0.1103,
          "comfort": 0.1625,
          "durability": 0.1198,
          "tagBonus": 0.076
        }
      },
      "rawDecision": "WAIT",
      "finalDecision": "WAIT",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "B3_trail_discovery": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_b",
        "vector": {
          "culture": 55,
          "styleFit": 60,
          "simplicity": 35,
          "street": 90,
          "volume": 85,
          "comfort": 55,
          "durability": 50
        },
        "policy": {
          "priceSensitivity": 45,
          "overlapSensitivity": 50,
          "explorationTolerance": 80
        },
        "axisImportance": {
          "culture": 45,
          "styleFit": 60,
          "simplicity": 35,
          "street": 95,
          "volume": 95,
          "comfort": 45,
          "durability": 40
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "B3_trail_discovery",
        "name": "Trail Outdoor Discovery",
        "vector": {
          "culture": 55,
          "styleFit": 55,
          "simplicity": 45,
          "street": 75,
          "volume": 70,
          "comfort": 80,
          "durability": 75,
          "priceLevel": 55
        },
        "tags": [
          "trail",
          "outdoor",
          "chunky"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_minimal",
          "roleTags": [
            "minimal",
            "low_tech",
            "canvas"
          ],
          "wearFrequency": "medium"
        }
      ],
      "preferredTags": [
        "street",
        "chunky",
        "basketball",
        "skate"
      ],
      "scoreBreakdown": {
        "cultureScore": 100.0,
        "styleScore": 95.0,
        "simplicityScore": 90.0,
        "streetScore": 85.0,
        "volumeScore": 85.0,
        "comfortScore": 80.0,
        "durabilityScore": 75.0,
        "tagBonus": 25.0,
        "featureFitScore": 82.42,
        "priceScore": 70.1,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 81.96,
        "axisWeightsApplied": {
          "culture": 0.1084,
          "styleFit": 0.1882,
          "simplicity": 0.097,
          "street": 0.1378,
          "volume": 0.1103,
          "comfort": 0.1625,
          "durability": 0.1198,
          "tagBonus": 0.076
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "BUY",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseC": {
    "C1_comfort_runner": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_c",
        "vector": {
          "culture": 40,
          "styleFit": 60,
          "simplicity": 55,
          "street": 30,
          "volume": 40,
          "comfort": 90,
          "durability": 90
        },
        "policy": {
          "priceSensitivity": 80,
          "overlapSensitivity": 60,
          "explorationTolerance": 35
        },
        "axisImportance": {
          "culture": 30,
          "styleFit": 60,
          "simplicity": 50,
          "street": 30,
          "volume": 40,
          "comfort": 100,
          "durability": 95
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "C1_comfort_runner",
        "name": "Comfort Runner",
        "vector": {
          "culture": 55,
          "styleFit": 70,
          "simplicity": 65,
          "street": 35,
          "volume": 45,
          "comfort": 92,
          "durability": 88,
          "priceLevel": 70
        },
        "tags": [
          "running",
          "comfortable",
          "durable"
        ],
        "budgetFit": 75
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_runner",
          "roleTags": [
            "running",
            "comfortable"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "comfortable",
        "durable",
        "running"
      ],
      "scoreBreakdown": {
        "cultureScore": 85.0,
        "styleScore": 90.0,
        "simplicityScore": 90.0,
        "streetScore": 95.0,
        "volumeScore": 95.0,
        "comfortScore": 92.0,
        "durabilityScore": 88.0,
        "tagBonus": 75.0,
        "featureFitScore": 89.29,
        "priceScore": 52.6,
        "overlapPenalty": 55.0,
        "nonOverlapScore": 45.0,
        "finalScore": 78.26,
        "axisWeightsApplied": {
          "culture": 0.0858,
          "styleFit": 0.1769,
          "simplicity": 0.1072,
          "street": 0.0715,
          "volume": 0.0643,
          "comfort": 0.2413,
          "durability": 0.1814,
          "tagBonus": 0.0715
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "BUY",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "C2_culture_low_comfort": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_c",
        "vector": {
          "culture": 40,
          "styleFit": 60,
          "simplicity": 55,
          "street": 30,
          "volume": 40,
          "comfort": 90,
          "durability": 90
        },
        "policy": {
          "priceSensitivity": 80,
          "overlapSensitivity": 60,
          "explorationTolerance": 35
        },
        "axisImportance": {
          "culture": 30,
          "styleFit": 60,
          "simplicity": 50,
          "street": 30,
          "volume": 40,
          "comfort": 100,
          "durability": 95
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "C2_culture_low_comfort",
        "name": "Culture High Low Comfort",
        "vector": {
          "culture": 95,
          "styleFit": 55,
          "simplicity": 45,
          "street": 65,
          "volume": 60,
          "comfort": 35,
          "durability": 45,
          "priceLevel": 40
        },
        "tags": [
          "heritage",
          "retro",
          "basketball"
        ],
        "budgetFit": 75
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_runner",
          "roleTags": [
            "running",
            "comfortable"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "comfortable",
        "durable",
        "running"
      ],
      "scoreBreakdown": {
        "cultureScore": 45.0,
        "styleScore": 95.0,
        "simplicityScore": 90.0,
        "streetScore": 65.0,
        "volumeScore": 80.0,
        "comfortScore": 35.0,
        "durabilityScore": 45.0,
        "tagBonus": 0.0,
        "featureFitScore": 56.71,
        "priceScore": 62.2,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 62.03,
        "axisWeightsApplied": {
          "culture": 0.0858,
          "styleFit": 0.1769,
          "simplicity": 0.1072,
          "street": 0.0715,
          "volume": 0.0643,
          "comfort": 0.2413,
          "durability": 0.1814,
          "tagBonus": 0.0715
        }
      },
      "rawDecision": "WAIT",
      "finalDecision": "WAIT",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "C3_premium_comfort": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_c",
        "vector": {
          "culture": 40,
          "styleFit": 60,
          "simplicity": 55,
          "street": 30,
          "volume": 40,
          "comfort": 90,
          "durability": 90
        },
        "policy": {
          "priceSensitivity": 80,
          "overlapSensitivity": 60,
          "explorationTolerance": 35
        },
        "axisImportance": {
          "culture": 30,
          "styleFit": 60,
          "simplicity": 50,
          "street": 30,
          "volume": 40,
          "comfort": 100,
          "durability": 95
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "C3_premium_comfort",
        "name": "Premium Comfort Model",
        "vector": {
          "culture": 60,
          "styleFit": 75,
          "simplicity": 60,
          "street": 40,
          "volume": 50,
          "comfort": 90,
          "durability": 85,
          "priceLevel": 95
        },
        "tags": [
          "comfortable",
          "premium",
          "running"
        ],
        "budgetFit": 75
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_runner",
          "roleTags": [
            "running",
            "comfortable"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "comfortable",
        "durable",
        "running"
      ],
      "scoreBreakdown": {
        "cultureScore": 80.0,
        "styleScore": 85.0,
        "simplicityScore": 95.0,
        "streetScore": 90.0,
        "volumeScore": 90.0,
        "comfortScore": 90.0,
        "durabilityScore": 85.0,
        "tagBonus": 50.0,
        "featureFitScore": 85.02,
        "priceScore": 44.6,
        "overlapPenalty": 55.0,
        "nonOverlapScore": 45.0,
        "finalScore": 73.74,
        "axisWeightsApplied": {
          "culture": 0.0858,
          "styleFit": 0.1769,
          "simplicity": 0.1072,
          "street": 0.0715,
          "volume": 0.0643,
          "comfort": 0.2413,
          "durability": 0.1814,
          "tagBonus": 0.0715
        }
      },
      "rawDecision": "WAIT",
      "finalDecision": "WAIT",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseD": {
    "D1_high_overlap_buy_to_wait": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_d",
        "vector": {
          "culture": 70,
          "styleFit": 80,
          "simplicity": 80,
          "street": 40,
          "volume": 25,
          "comfort": 75,
          "durability": 75
        },
        "policy": {
          "priceSensitivity": 25,
          "overlapSensitivity": 100,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 60,
          "styleFit": 85,
          "simplicity": 80,
          "street": 40,
          "volume": 35,
          "comfort": 70,
          "durability": 70
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "D1_high_overlap_buy_to_wait",
        "name": "High Overlap Buy To Wait",
        "vector": {
          "culture": 70,
          "styleFit": 82,
          "simplicity": 82,
          "street": 38,
          "volume": 25,
          "comfort": 80,
          "durability": 78,
          "priceLevel": 35
        },
        "tags": [
          "low_tech",
          "canvas",
          "classic",
          "minimal"
        ],
        "budgetFit": 90
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_lowtech_canvas",
          "roleTags": [
            "low_tech",
            "canvas",
            "classic",
            "minimal"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "low_tech",
        "classic",
        "minimal",
        "canvas"
      ],
      "scoreBreakdown": {
        "cultureScore": 100.0,
        "styleScore": 98.0,
        "simplicityScore": 98.0,
        "streetScore": 98.0,
        "volumeScore": 100.0,
        "comfortScore": 80.0,
        "durabilityScore": 78.0,
        "tagBonus": 100.0,
        "featureFitScore": 92.21,
        "priceScore": 86.5,
        "overlapPenalty": 100.0,
        "nonOverlapScore": 0.0,
        "finalScore": 81.96,
        "axisWeightsApplied": {
          "culture": 0.1145,
          "styleFit": 0.2108,
          "simplicity": 0.1353,
          "street": 0.0781,
          "volume": 0.059,
          "comfort": 0.1873,
          "durability": 0.1457,
          "tagBonus": 0.0694
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "WAIT",
      "demotions": [
        "HIGH_CLOSET_OVERLAP"
      ],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseE": {
    "E1_low_price_fit_buy_to_wait": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_e",
        "vector": {
          "culture": 70,
          "styleFit": 80,
          "simplicity": 75,
          "street": 50,
          "volume": 40,
          "comfort": 80,
          "durability": 80
        },
        "policy": {
          "priceSensitivity": 100,
          "overlapSensitivity": 20,
          "explorationTolerance": 40
        },
        "axisImportance": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 70,
          "street": 50,
          "volume": 40,
          "comfort": 70,
          "durability": 70
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "E1_low_price_fit_buy_to_wait",
        "name": "Low Price Fit Buy To Wait",
        "vector": {
          "culture": 72,
          "styleFit": 82,
          "simplicity": 76,
          "street": 52,
          "volume": 42,
          "comfort": 90,
          "durability": 88,
          "priceLevel": 100
        },
        "tags": [
          "premium",
          "comfortable",
          "classic"
        ],
        "budgetFit": 70
      },
      "ownedSneakers": [],
      "preferredTags": [
        "premium",
        "comfortable",
        "classic"
      ],
      "scoreBreakdown": {
        "cultureScore": 98.0,
        "styleScore": 98.0,
        "simplicityScore": 99.0,
        "streetScore": 98.0,
        "volumeScore": 98.0,
        "comfortScore": 90.0,
        "durabilityScore": 88.0,
        "tagBonus": 75.0,
        "featureFitScore": 93.56,
        "priceScore": 30.0,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 82.76,
        "axisWeightsApplied": {
          "culture": 0.1152,
          "styleFit": 0.2042,
          "simplicity": 0.1257,
          "street": 0.0873,
          "volume": 0.0628,
          "comfort": 0.1885,
          "durability": 0.1466,
          "tagBonus": 0.0698
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "WAIT",
      "demotions": [
        "LOW_PRICE_FIT"
      ],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseF": {
    "F1_low_comfort_buy_to_wait": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_f",
        "vector": {
          "culture": 80,
          "styleFit": 85,
          "simplicity": 70,
          "street": 60,
          "volume": 50,
          "comfort": 40,
          "durability": 80
        },
        "policy": {
          "priceSensitivity": 15,
          "overlapSensitivity": 20,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 80,
          "styleFit": 85,
          "simplicity": 65,
          "street": 60,
          "volume": 50,
          "comfort": 25,
          "durability": 75
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "F1_low_comfort_buy_to_wait",
        "name": "Low Comfort Buy To Wait",
        "vector": {
          "culture": 82,
          "styleFit": 86,
          "simplicity": 72,
          "street": 62,
          "volume": 52,
          "comfort": 35,
          "durability": 90,
          "priceLevel": 30
        },
        "tags": [
          "heritage",
          "street",
          "classic"
        ],
        "budgetFit": 90
      },
      "ownedSneakers": [],
      "preferredTags": [
        "heritage",
        "street",
        "classic"
      ],
      "scoreBreakdown": {
        "cultureScore": 98.0,
        "styleScore": 99.0,
        "simplicityScore": 98.0,
        "streetScore": 98.0,
        "volumeScore": 98.0,
        "comfortScore": 35.0,
        "durabilityScore": 90.0,
        "tagBonus": 75.0,
        "featureFitScore": 87.7,
        "priceScore": 88.2,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 89.02,
        "axisWeightsApplied": {
          "culture": 0.1397,
          "styleFit": 0.2175,
          "simplicity": 0.1235,
          "street": 0.0985,
          "volume": 0.0716,
          "comfort": 0.1209,
          "durability": 0.1567,
          "tagBonus": 0.0716
        }
      },
      "rawDecision": "STRONG_BUY",
      "finalDecision": "WAIT",
      "demotions": [
        "LOW_COMFORT"
      ],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseG": {
    "G1_low_durability_buy_to_wait": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_g",
        "vector": {
          "culture": 80,
          "styleFit": 85,
          "simplicity": 70,
          "street": 60,
          "volume": 50,
          "comfort": 80,
          "durability": 40
        },
        "policy": {
          "priceSensitivity": 15,
          "overlapSensitivity": 20,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 80,
          "styleFit": 85,
          "simplicity": 65,
          "street": 60,
          "volume": 50,
          "comfort": 75,
          "durability": 25
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "G1_low_durability_buy_to_wait",
        "name": "Low Durability Buy To Wait",
        "vector": {
          "culture": 82,
          "styleFit": 86,
          "simplicity": 72,
          "street": 62,
          "volume": 52,
          "comfort": 90,
          "durability": 40,
          "priceLevel": 30
        },
        "tags": [
          "heritage",
          "street",
          "classic"
        ],
        "budgetFit": 90
      },
      "ownedSneakers": [],
      "preferredTags": [
        "heritage",
        "street",
        "classic"
      ],
      "scoreBreakdown": {
        "cultureScore": 98.0,
        "styleScore": 99.0,
        "simplicityScore": 98.0,
        "streetScore": 98.0,
        "volumeScore": 98.0,
        "comfortScore": 90.0,
        "durabilityScore": 40.0,
        "tagBonus": 75.0,
        "featureFitScore": 89.66,
        "priceScore": 88.2,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 90.43,
        "axisWeightsApplied": {
          "culture": 0.1372,
          "styleFit": 0.2137,
          "simplicity": 0.1214,
          "street": 0.0967,
          "volume": 0.0704,
          "comfort": 0.1979,
          "durability": 0.0923,
          "tagBonus": 0.0704
        }
      },
      "rawDecision": "STRONG_BUY",
      "finalDecision": "WAIT",
      "demotions": [
        "LOW_DURABILITY"
      ],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  }
} as const;
```

## 10. Case Aの確定説明

```txt
A1_canvas_high_overlapは所有靴との被りが強いため、finalScoreが下がりWAITになる。
ただしrawDecision時点でWAITなのでDemotionは発生しない。
```

## 11. fixture変更ルール

fixtureの期待値は、実装に合わせて勝手に変えない。  
テストが落ちた場合、まず実装が仕様から外れていないか確認する。
