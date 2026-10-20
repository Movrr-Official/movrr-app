/** Convert a named-zone wall time to an unambiguous instant; independent of server TZ. */
export function communityInstant(
  local: string,
  zone: string,
  occurrence?: string,
): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))
    throw new Error("Choose a valid date and time.");
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const [year, month, day, hour, minute] = local.split(/[-T:]/).map(Number);
  const anchor = Date.UTC(year, month - 1, day, hour, minute);
  const matches: number[] = [];
  for (let offset = -14 * 60; offset <= 14 * 60; offset += 15) {
    const value = anchor - offset * 60000;
    const parts = Object.fromEntries(
      formatter.formatToParts(value).map((p) => [p.type, p.value]),
    );
    if (
      `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` === local
    )
      matches.push(value);
  }
  matches.sort((a, b) => a - b);
  if (!matches.length)
    throw new Error(
      "This local time does not exist because the clocks change. Choose another time.",
    );
  if (matches.length > 1 && !["first", "second"].includes(occurrence ?? ""))
    throw new Error("This time occurs twice. Choose the first or second occurrence.");
  return new Date(
    matches[occurrence === "second" ? matches.length - 1 : 0],
  ).toISOString();
}
export function localCommunityTime(instant: string, zone = "Europe/Amsterdam") {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(instant))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
