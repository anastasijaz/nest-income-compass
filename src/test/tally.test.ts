import { describe, expect, it } from "vitest";
import { tally } from "@/lib/tally";

describe("tally", () => {
  it("credits a finished task to whoever completed it, not the assignee", () => {
    const t = tally(
      ["a", "b"],
      [
        { status: "done", completed_by: "b" },
        { status: "todo", completed_by: null },
      ],
      [],
    );
    expect(t["b"]!.tasksDone).toBe(1);
    expect(t["a"]!.tasksDone).toBe(0);
  });
  it("sums costs by who paid them and ignores income", () => {
    const t = tally(
      ["a"],
      [],
      [
        { kind: "cost", amount: 100.5, paid_by: "a" },
        { kind: "cost", amount: 20, paid_by: "a" },
        { kind: "income", amount: 900, paid_by: "a" },
      ],
    );
    expect(t["a"]!.paid).toBe(120.5);
  });
});
