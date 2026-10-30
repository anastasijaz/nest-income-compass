import { describe, expect, it } from "vitest";
import { computeStats } from "./stats";

const t = (
  kind: string,
  amount: number,
  date: string,
  extra: Partial<{ fix_id: string; category: string; property_id: string }> = {},
) => ({
  kind,
  amount,
  date,
  property_id: extra.property_id ?? "a",
  fix_id: extra.fix_id ?? null,
  category: extra.category ?? "other",
});

describe("computeStats", () => {
  it("finds the month the running total turns positive", () => {
    const s = computeStats(
      [
        t("cost", 1000, "2026-01-05"),
        t("income", 600, "2026-02-01"),
        t("income", 600, "2026-03-01"),
      ],
      [{ id: "a", name: "A" }],
      "2026-01-01",
      "2026-03-31",
    );
    expect(s.breakEvenMonth).toBe("Mar 26");
  });
  it("counts fix-linked and repair costs as fix spend", () => {
    const s = computeStats(
      [
        t("cost", 100, "2026-01-01", { fix_id: "f" }),
        t("cost", 50, "2026-01-01", { category: "repairs" }),
        t("cost", 70, "2026-01-01", { category: "energy" }),
      ],
      [{ id: "a", name: "A" }],
      "2026-01-01",
      "2026-01-31",
    );
    expect(s.fixCosts).toBe(150);
  });
  it("averages net per property", () => {
    const s = computeStats(
      [t("income", 1000, "2026-01-01")],
      [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
      ],
      "2026-01-01",
      "2026-01-31",
    );
    expect(s.avgNetPerProperty).toBe(500);
  });
});
