import type { CandidateProfile } from "../core-v1/types";

const officialNameAliases: readonly [RegExp, string][] = [
  [/^new balance\s+cm996$/i, "New Balance CM996"],
  [/^adidas\s+samba\s+og$/i, "adidas Samba OG"],
  [/^nike\s+air\s+force\s+1\s+low\s+[\"']?white\s*[/ -]\s*white[\"']?$/i, "Nike Air Force 1 Low \"White/White\""],
  [/^converse\s+one\s+star$/i, "Converse One Star"],
  [/^puma\s+suede$/i, "PUMA Suede"],
  [/^puma\s+clyde$/i, "PUMA Clyde"],
];

export function normalizeOfficialSneakerName(value: string): string {
  const normalized = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  return officialNameAliases.find(([pattern]) => pattern.test(normalized))?.[1] ?? normalized;
}

export function normalizeCandidateOfficialName(candidate: CandidateProfile): CandidateProfile {
  const name = normalizeOfficialSneakerName(candidate.name);
  return name === candidate.name ? candidate : {
    ...candidate,
    name,
    ...(candidate.searchKeywords
      ? { searchKeywords: candidate.searchKeywords.map((keyword, index) => index === 0 ? name : keyword) }
      : {}),
  };
}
