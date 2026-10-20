export const RIDER_LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English" },
  { value: "nl-NL", label: "Dutch" },
];
export function normalizedRiderLocale(value: unknown): "en-US" | "nl-NL" {
  if (value == null) return "en-US";
  if (value === "en-US" || value === "nl-NL") return value;
  throw new Error("Saved rider language requires review");
}
