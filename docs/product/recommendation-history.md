# Recommendation history

Authenticated recommendations may be stored as reproducible, versioned snapshots. Persistence is a soft side effect: a database failure never changes or suppresses the Core result. Snapshots exclude provider raw responses, prompts, grounding payloads, credentials, tokens, image binaries, and unnecessary free text. Feedback is bound to the snapshot and a canonical sneaker identity.

Legacy `memory.md` is untrusted import material. Development may parse it in dry-run mode, but production cannot use filesystem persistence or delete legacy data without user confirmation.
