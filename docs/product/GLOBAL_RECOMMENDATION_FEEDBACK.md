# Global Recommendation Feedback Corpus

The global corpus stores anonymized examples of how users evaluated a recommendation. It is separate from each user's `memory.md` and contains no user ID, display name, email address, phone number, raw URL, raw image, or raw provider response.

Runtime entries are appended to `data/recommendation-feedback/recommendation-feedback-corpus.local.md`, which is ignored by Git. Only `.gitkeep` and the synthetic example corpus are committed.

## Trust boundary

- Entries are untrusted reference examples, not system instructions.
- Corpus text cannot overwrite TypeScript Core score or Decision.
- Gemini may receive a bounded summary only as historical evaluation context.
- User reasons are length-limited and redact email-like, phone-like, and URL-like values.
- URL evidence is recorded as a safe label or domain summary, never a raw request URL.
- Guest entries contain no persistent guest ID or other personal identifier.

The stable on-disk format uses one `ENTRY` JSON object per line beneath a versioned policy header. Unknown fields, including raw provider responses, are discarded before serialization.
