import type { OwnedSneaker } from "../core/types";

export const sampleOwnedSneakersByProfile: Record<string, OwnedSneaker[]> = {
  demo_profile_clean_classic: [
    {
      sneakerId: "demo_owned_canvas_low",
      roleTags: ["classic", "canvas", "low_tech", "minimal"],
      wearFrequency: "high",
    },
    {
      sneakerId: "demo_owned_white_court",
      roleTags: ["minimal", "classic"],
      wearFrequency: "medium",
    },
  ],
  demo_profile_street_volume: [
    {
      sneakerId: "demo_owned_basketball_high",
      roleTags: ["street", "basketball", "retro"],
      wearFrequency: "medium",
    },
    {
      sneakerId: "demo_owned_chunky_runner",
      roleTags: ["chunky", "street", "comfortable"],
      wearFrequency: "low",
    },
  ],
  demo_profile_comfort_runner: [
    {
      sneakerId: "demo_owned_daily_runner",
      roleTags: ["running", "comfortable"],
      wearFrequency: "high",
    },
    {
      sneakerId: "demo_owned_trail_pair",
      roleTags: ["trail", "outdoor", "durable"],
      wearFrequency: "medium",
    },
  ],
  demo_profile_muted_heritage: [
    {
      sneakerId: "demo_owned_retro_suede",
      roleTags: ["retro", "classic", "heritage"],
      wearFrequency: "high",
    },
  ],
};
