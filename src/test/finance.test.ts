import { describe, it, expect } from "vitest";
import { amountInput, formatEUR, isOverdue, parseAmount, summarize } from "@/lib/finance";

describe("finance rules", () => {
  it("formats EUR as 1.234,56 €", () => {
    expect(formatEUR(1234.56).replace(/\u00a0/g, " ")).toBe("1.234,56 €");
  });
  it("covers costs when income equals costs", () => {
    expect(
      summarize([
        { kind: "income", amount: 100, date: "2026-01-01" },
        { kind: "cost", amount: 100, date: "2026-01-02" },
      ]).covering,
    ).toBe(true);
  });
  it("does not cover when costs exceed income, with coverage %", () => {
    const s = summarize([
      { kind: "income", amount: 850, date: "2026-01-01" },
      { kind: "cost", amount: 1000, date: "2026-01-02" },
    ]);
    expect(s.covering).toBe(false);
    expect(s.coverage).toBe(85);
    expect(s.net).toBe(-150);
  });
  it("flags unpaid taxes past due as overdue", () => {
    expect(isOverdue({ status: "unpaid", due_date: "2026-01-01" }, "2026-02-01")).toBe(true);
    expect(isOverdue({ status: "paid", due_date: "2026-01-01" }, "2026-02-01")).toBe(false);
  });
});

describe("amount input", () => {
  it("parses German and phone-keypad amounts", () => {
    expect(parseAmount("1.234,56")).toBe(1234.56);
    expect(parseAmount("1234,5")).toBe(1234.5);
    expect(parseAmount("12.50")).toBe(12.5);
    expect(parseAmount("1.200")).toBe(1200);
    expect(parseAmount("1.200.000")).toBe(1200000);
    expect(parseAmount(" 950 € ")).toBe(950);
    expect(parseAmount("")).toBeNaN();
  });
  it("round-trips stored amounts through the input format", () => {
    expect(amountInput(1200.5)).toBe("1200,50");
    expect(parseAmount(amountInput(1200.5))).toBe(1200.5);
    expect(amountInput(null)).toBe("");
  });
});
