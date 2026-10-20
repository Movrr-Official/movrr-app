import { expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommunityFields } from "@/components/rider/CommunityFields";
it("renders named community inputs and a linked timezone explanation", () => {
  const html = renderToStaticMarkup(createElement(CommunityFields));
  expect(html).toContain('for="create-schedule"');
  expect(html).toContain('id="create-schedule"');
  expect(html).toContain('aria-describedby="create-time-help"');
  expect(html).toContain('id="create-time-help"');
  for (const name of [
    "meetingPoint",
    "maxParticipants",
    "category",
    "description",
    "timezone",
  ])
    expect(html).toMatch(
      new RegExp('<label[^>]*>[^<]+<(?:input|select|textarea)[^>]*name="' + name + '"'),
    );
});
