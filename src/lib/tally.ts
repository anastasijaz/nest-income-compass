type FixLike = { status: string; completed_by: string | null };
type TxnLike = { kind: string; amount: number; paid_by: string | null };

/** Per-person work tally: finished tasks (by whoever completed them) and costs paid. */
export function tally(memberIds: string[], fixes: FixLike[], txns: TxnLike[]) {
  const out: Record<string, { tasksDone: number; paid: number }> = {};
  for (const id of memberIds) out[id] = { tasksDone: 0, paid: 0 };
  for (const f of fixes) {
    if (f.status === "done" && f.completed_by) (out[f.completed_by] ??= { tasksDone: 0, paid: 0 }).tasksDone++;
  }
  for (const t of txns) {
    if (t.kind === "cost" && t.paid_by) (out[t.paid_by] ??= { tasksDone: 0, paid: 0 }).paid += Number(t.amount);
  }
  return out;
}
