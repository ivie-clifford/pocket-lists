import { describe, expect, it } from "vitest";
import { toTemplateDrafts } from "@/components/pocket/QuickAdd";
import { parsePastedList } from "@/lib/pocket/parse";

describe("pasting into a template", () => {
  it("omits dates but keeps text and priority", () => {
    const parsed = parsePastedList("P1 | Passport | Today\nCharger\nSocks | Tomorrow", "2026-11-06");
    const drafts = toTemplateDrafts(parsed);
    expect(drafts).toEqual([{ text: "Passport", priority: 1 }, { text: "Charger" }, { text: "Socks" }]);
    expect(drafts.some((d) => "due" in d || "dueKind" in d)).toBe(false);
  });
});
