export function resolveLatestTimestamp(values: Array<string | null | undefined>) {
  const timestamps = values
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter((value) => !Number.isNaN(value));

  if (!timestamps.length) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

export function getComplianceStatus(score: number) {
  if (score >= 85) return "healthy";
  if (score >= 60) return "watch";
  return "attention";
}
