import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Wrench, Euro } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PeriodFilter } from "@/components/app/PeriodFilter";
import { inputLg } from "@/components/app/fields";
import { formatEUR, inRange, periodRange, type Period } from "@/lib/finance";
import { fixesQuery, meQuery, membersQuery, transactionsQuery, workspaceQuery } from "@/lib/queries";
import { tally } from "@/lib/tally";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team — Rentwise" },
      { name: "description", content: "Who is in your group and how much each person has done." },
      { property: "og:title", content: "Team — Rentwise" },
      { property: "og:description", content: "Who is in your group and how much each person has done." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>({ key: "year" });
  const { data: ws } = useQuery(workspaceQuery);
  const { data: members = [] } = useQuery(membersQuery);
  const { data: me = "" } = useQuery(meQuery);
  const { data: fixes = [] } = useQuery(fixesQuery);
  const { data: txns = [] } = useQuery(transactionsQuery);
  const [code, setCode] = useState("");
  const [name, setName] = useState<string | null>(null);
  const myName = name ?? members.find((m) => m.user_id === me)?.display_name ?? "";

  const range = periodRange(period);
  const t = useMemo(
    () =>
      tally(
        members.map((m) => m.user_id),
        fixes.filter((f) => f.completed_at && inRange(f.completed_at, range)),
        txns.filter((x) => inRange(x.date, range)),
      ),
    [members, fixes, txns, range.from, range.to],
  );

  async function join() {
    if (!code.trim()) return;
    if (!confirm("Join this group? Your properties and entries will move into it.")) return;
    const { error } = await supabase.rpc("join_workspace", { _code: code });
    if (error) return void toast.error(error.message);
    toast.success("You joined the group");
    setCode("");
    qc.invalidateQueries();
  }

  async function saveName() {
    const { error } = await supabase.from("workspace_members").update({ display_name: myName.trim() }).eq("user_id", me);
    if (error) return void toast.error(error.message);
    toast.success("Name saved");
    setName(null);
    qc.invalidateQueries({ queryKey: ["members"] });
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl space-y-6 px-4 pb-24 pt-6">
      <header className="flex items-center gap-3">
        <Link to="/dashboard" aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full border bg-card">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Team</h1>
      </header>

      <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="font-semibold">Invite people</h2>
        <p className="text-sm text-muted-foreground">Share this code. After they sign up, they enter it below on their own Team page.</p>
        <div className="flex items-center gap-2">
          <span className="tabular flex h-12 flex-1 items-center rounded-lg bg-muted px-4 font-mono text-lg tracking-widest">{ws?.invite_code ?? "…"}</span>
          <Button
            variant="outline"
            className="h-12 rounded-xl"
            onClick={() => ws && navigator.clipboard.writeText(ws.invite_code).then(() => toast.success("Code copied"))}
          >
            <Copy className="h-4 w-4" /> Copy
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="font-semibold">Your name</h2>
        <div className="flex gap-2">
          <Input className={inputLg} value={myName} onChange={(e) => setName(e.target.value)} placeholder="How others see you" />
          <Button className="h-12 rounded-xl" onClick={saveName} disabled={name === null}>
            Save
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Who did what</h2>
        <PeriodFilter value={period} onChange={setPeriod} />
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold uppercase">
                {(m.display_name || "?").slice(0, 1)}
              </span>
              <p className="min-w-0 flex-1 truncate font-medium">
                {m.display_name || "Member"}
                {m.user_id === me && <span className="font-normal text-muted-foreground"> (you)</span>}
              </p>
              <span className="flex items-center gap-1 text-sm">
                <Wrench className="h-4 w-4 text-muted-foreground" /> {t[m.user_id]?.tasksDone ?? 0}
              </span>
              <span className="tabular flex w-28 items-center justify-end gap-1 text-sm font-medium">
                <Euro className="h-4 w-4 text-muted-foreground" /> {formatEUR(t[m.user_id]?.paid ?? 0)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Tasks finished, and costs paid out of pocket, in the chosen period.</p>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="font-semibold">Join another group</h2>
        <div className="flex gap-2">
          <Input className={inputLg} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Invite code" />
          <Button className="h-12 rounded-xl" onClick={join}>
            Join
          </Button>
        </div>
      </section>
    </div>
  );
}
