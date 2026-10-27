import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { RideRewardStatus } from "@/components/rider/RideRewardStatus";
import type { RideSummary } from "@/lib/platform/riderSelfService";
const base = {
  rideSessionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  session: { verification_result: { status: "verified" } },
  settlement: { status: "pending" },
  totalPoints: null,
  committedPoints: null,
  rewardLifecycle: {
    correlationId: "support-ref",
    estimatedReward: {
      version: 1,
      points: 12,
      confidence: "valid",
      policyVersion: "movrr-combined-v3",
      movementVersion: "accepted-segments-v1",
      basisDigest: "a".repeat(64),
      capturedAt: "2026-10-26T12:00:00Z",
      exclusions: ["final_verification"],
    },
  },
} as unknown as RideSummary;
it("shows provisional points separately from processing in English and Dutch", () => {
  const en = renderToStaticMarkup(<RideRewardStatus summary={base} />);
  expect(en).toContain("Estimated MOVRR points");
  expect(en).toContain("~12");
  expect(en).toContain("Calculating points");
  const nl = renderToStaticMarkup(
    <RideRewardStatus summary={base} locale="nl" />,
  );
  expect(nl).toContain("Geschatte MOVRR-punten");
  expect(nl).toContain("Punten berekenen");
});
it("preserves partial credited points instead of replacing them with the estimate", () => {
  const html = renderToStaticMarkup(
    <RideRewardStatus summary={{ ...base, committedPoints: 4 }} />,
  );
  expect(html).toContain("Credited MOVRR points");
  expect(html).toContain("additional checks remain unresolved");
  expect(html).not.toContain("~12");
});
it("explains an adjusted ledger-backed final award and retains the estimate", () => {
  const html = renderToStaticMarkup(
    <RideRewardStatus
      summary={{
        ...base,
        totalPoints: 8,
        settlement: { ...base.settlement, status: "settled" },
        rewardLifecycle: {
          ...base.rewardLifecycle!,
          adjustmentReason: "ride_allowance",
        },
      }}
    />,
  );
  expect(html).toContain("Points adjusted and credited");
  expect(html).toContain("Original estimate");
  expect(html).toContain("remaining ride allowance");
  expect(html).not.toContain("~8");
});

it.each([
  ['pending','manual_review','Review required','Beoordeling nodig'],
  ['awaiting_verification','verified','Review required','Beoordeling nodig'],
  ['failed','verified','Processing delayed','Verwerking vertraagd'],
])('keeps committed points visible with %s / %s', (status, verification, en, nl) => {
  const summary = {...base, committedPoints:4, session:{...base.session,verification_result:{status:verification}},settlement:{...base.settlement,status}} as RideSummary;
  for (const [locale,label] of [['en',en],['nl',nl]] as const) {
    const html=renderToStaticMarkup(<RideRewardStatus summary={summary} locale={locale}/>);
    expect(html).toContain(label);
    expect(html).not.toContain('~12');
    expect(html).toContain(locale==='en'?'Credited MOVRR points':'Toegekende MOVRR-punten');
  }
});
