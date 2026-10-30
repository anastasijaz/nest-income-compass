export function isFixedExpense(t: { kind: string; is_fixed_expense?: boolean }) {
  return t.kind === "cost" && t.is_fixed_expense === true;
}
