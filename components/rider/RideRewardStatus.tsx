import type { RideSummary } from "@/lib/platform/riderSelfService";
import {
  parseRewardEstimate,
  rewardLifecycle,
  lifecycleLabel,
} from "@/lib/contracts/rideRewardLifecycle";

export function RideRewardStatus({
  summary,
  locale = "en",
}: {
  summary: RideSummary;
  locale?: "en" | "nl";
}) {
  const estimate = parseRewardEstimate(
    summary.rewardLifecycle?.estimatedReward,
  );
  const state = rewardLifecycle({
    status: summary.settlement.status,
    sessionStatus: summary.session.status,
    verification: summary.session.verification_result?.status,
    awardStatus:
      typeof summary.settlement.award_status === "string"
        ? summary.settlement.award_status
        : null,
    finalPoints: summary.totalPoints,
    committedPoints: summary.committedPoints,
    estimatedPoints: estimate?.points,
    reason: summary.settlement.reason_code,
    updatedAt:
      typeof summary.settlement.updated_at === "string"
        ? summary.settlement.updated_at
        : null,
  });
  const points =
    summary.totalPoints ?? summary.committedPoints ?? estimate?.points;
  const provisional =
    summary.totalPoints == null &&
    summary.committedPoints == null &&
    estimate?.points != null;
  const label = provisional
    ? locale === "nl"
      ? "Geschatte MOVRR-punten"
      : "Estimated MOVRR points"
    : locale === "nl"
      ? "Toegekende MOVRR-punten"
      : "Credited MOVRR points";
  return (
    <div className="space-y-2" aria-live="polite">
      <p className="font-semibold">
        {label}:{" "}
        {points == null
          ? "—"
          : `${provisional ? "~" : ""}${points.toLocaleString(locale === "nl" ? "nl-NL" : "en-US")}`}
      </p>
      <p>{lifecycleLabel(state, locale)}</p>
      {provisional && (
        <p className="text-sm text-muted-foreground">
          {locale === "nl"
            ? "Voorlopige schatting. Je wallet toont alleen toegekende punten."
            : "Provisional estimate. Your wallet shows credited points only."}
        </p>
      )}
      {summary.committedPoints != null && summary.totalPoints == null && (
        <p>
          {locale === "nl"
            ? "Deze punten zijn toegekend; aanvullende controles zijn nog niet afgerond."
            : "These points are credited; additional checks remain unresolved."}
        </p>
      )}
      {state === "adjusted" && (
        <p>
          {locale === "nl" ? "Oorspronkelijke schatting" : "Original estimate"}:{" "}
          {estimate?.points}
        </p>
      )}
      {state === "adjusted" &&
        ["daily_allowance", "ride_allowance"].includes(
          summary.rewardLifecycle?.adjustmentReason ?? "",
        ) && (
          <p>
            {locale === "nl"
              ? "Je resterende ritlimiet of een beloningslimiet beperkte de beloning."
              : "Your remaining ride allowance or a reward limit reduced the reward."}
          </p>
        )}
      {state === "review_required" && (
        <p className="text-sm">
          {locale === "nl"
            ? "Referentie voor ondersteuning"
            : "Support reference"}
          : {summary.rewardLifecycle?.correlationId ?? summary.rideSessionId}
        </p>
      )}
    </div>
  );
}
