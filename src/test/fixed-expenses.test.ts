import { describe, expect, it } from "vitest";
import { isFixedExpense } from "@/lib/fixed-expenses";
import { summarize } from "@/lib/finance";
import { tally } from "@/lib/tally";
import { validateReceiptData } from "@/lib/receipt-data";

describe("fixed expenses", () => {
  const expenses = [
    {
      kind: "cost",
      is_fixed_expense: true,
      category: "energy",
      amount: 120.5,
      date: "2026-10-01",
      paid_by: "a",
    },
    {
      kind: "cost",
      is_fixed_expense: true,
      category: "heating",
      amount: 80,
      date: "2026-10-02",
      paid_by: "a",
    },
    {
      kind: "cost",
      is_fixed_expense: false,
      category: "repairs",
      amount: 50,
      date: "2026-10-03",
      paid_by: "a",
    },
  ];
  it("separates energy and heating from ordinary costs", () => {
    expect(expenses.filter(isFixedExpense).map((t) => t.category)).toEqual(["energy", "heating"]);
    expect(expenses.filter((t) => !isFixedExpense(t)).map((t) => t.category)).toEqual(["repairs"]);
  });
  it("counts fixed expenses once in property costs", () => {
    expect(summarize(expenses).costs).toBe(250.5);
  });
  it("counts fixed expenses in the payer tally", () => {
    expect(tally(["a"], [], expenses)["a"]?.paid).toBe(250.5);
  });
  it("preserves extracted date, amount and purpose", () => {
    const receipt = {
      vendor: "EPS",
      date: "2026-10-15",
      total: 1234.56,
      purpose: "Electricity",
      category: "energy",
      currency: "EUR",
    };
    expect(validateReceiptData(receipt)).toEqual(receipt);
  });
  it("keeps Serbian currency separate rather than treating it as euros", () => {
    expect(
      validateReceiptData({
        vendor: "EPS",
        date: "2026-10-15",
        total: 5600,
        purpose: "Electricity",
        category: "energy",
        currency: "RSD",
      }).currency,
    ).toBe("RSD");
  });
  it("clears invalid invoice dates", () => {
    expect(
      validateReceiptData({
        vendor: null,
        date: "2026-02-30",
        total: null,
        purpose: null,
        category: "other",
        currency: null,
      }).date,
    ).toBeNull();
  });
});
