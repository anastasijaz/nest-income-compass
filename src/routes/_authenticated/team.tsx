import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Euro, LogOut, Share2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PeriodFilter } from "@/components/app/PeriodFilter";
import { inputLg } from "@/components/app/fields";
import { formatEUR, inRange, periodRange, type Period } from "@/lib/finance";
import {
  fixesQuery,
  meQuery,
  membersQuery,
  transactionsQuery,
  workspaceQuery,
} from "@/lib/queries";
import { memberColor } from "@/lib/memberColor";
import { tally } from "@/lib/tally";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team — Rentwise" },
      { name: "description", content: "Who is in your group and how much each person has done." },
      { property: "og:title", content: "Team — Rentwise" },
      {
        property: "og:description",
        content: "Who is in your group and how much each person has done.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>({ key: "year" });
  const { data: ws } = useQuery(workspaceQuery);
  const { data: members = [] } = useQuery(membersQuery);
  const { data: me = "" } = useQuery(meQuery);
  const { data: fixes = [] } = useQuery(fixesQuery);
  const { data: txns = [] } = useQuery(transactionsQuery);
  const [code, setCode] = useState("");
  const [name, setName] = useState<string | null>(null);
  const canShare =
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    window.matchMedia("(pointer: coarse)").matches;
  const myName = name ?? members.find((m) => m.user_id === me)?.display_name ?? "";

  const range = useMemo(() => periodRange(period), [period]);
  const t = useMemo(
    () =>
      tally(
        members.map((m) => m.user_id),
        fixes.filter((f) => f.completed_at && inRange(f.completed_at, range)),
        txns.filter((x) => inRange(x.date, range)),
      ),
    [members, fixes, txns, range],
  );

  async function join() {
    if (!code.trim()) return;
    if (!confirm("Join this group? Your properties and entries will move into it.")) return;
    const { error } = await supabase.rpc("join_workspace", { _code: code.trim() });
    if (error) return void toast.error(error.message);
    toast.success("You joined the group");
    setCode("");
    qc.invalidateQueries();
  }

  async function shareCode(invite: string) {
    if (canShare) {
      // Dismissing the share sheet rejects; nothing to report.
      return void navigator
        .share({
          title: "Join my Rentwise group",
          text: `Join my Rentwise group with invite code ${invite}`,
        })
        .catch(() => {});
    }
    try {
      await navigator.clipboard.writeText(invite);
      toast.success("Code copied");
    } catch {
      toast.error("Couldn't copy — select the code and copy it manually");
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function saveName() {
    const { error } = await supabase
      .from("workspace_members")
      .update({ display_name: myName.trim() })
      .eq("user_id", me);
    if (error) return void toast.error(error.message);
    toast.success("Name saved");
    setName(null);
    qc.invalidateQueries({ queryKey: ["members"] });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8 pt-6">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Team</h1>
      </header>

      <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="font-semibold">Invite people</h2>
        <p className="text-sm text-muted-foreground">
          Share this code. After they sign up, they enter it below on their own Team page.
        </p>
        <div className="flex items-center gap-2">
          <span className="tabular flex h-12 min-w-0 flex-1 items-center truncate rounded-lg bg-muted px-4 font-mono text-lg tracking-widest">
            {ws?.invite_code ?? "…"}
          </span>
          <Button
            variant="outline"
            className="h-12 rounded-xl"
            onClick={() => ws && shareCode(ws.invite_code)}
          >
            {canShare ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{" "}
            {canShare ? "Share" : "Copy"}
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="font-semibold">Your name</h2>
        <div className="flex gap-2">
          <Input
            className={inputLg}
            value={myName}
            onChange={(e) => setName(e.target.value)}
            placeholder="How others see you"
          />
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
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold uppercase ${memberColor(m.user_id).avatar}`}
              >
                {(m.display_name || "?").slice(0, 1)}
              </span>
              <p className="min-w-0 flex-1 truncate font-medium">
                {m.display_name || "Member"}
                {m.user_id === me && (
                  <span className="font-normal text-muted-foreground"> (you)</span>
                )}
              </p>
              <span className="flex items-center gap-1 text-sm">
                <Wrench className="h-4 w-4 text-muted-foreground" /> {t[m.user_id]?.tasksDone ?? 0}
              </span>
              <span className="tabular flex w-28 items-center justify-end gap-1 text-sm font-medium">
                <Euro className="h-4 w-4 text-muted-foreground" />{" "}
                {formatEUR(t[m.user_id]?.paid ?? 0)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Tasks finished, and costs paid out of pocket, in the chosen period.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="font-semibold">Join another group</h2>
        <div className="flex gap-2">
          <Input
            className={inputLg}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Invite code"
          />
          <Button className="h-12 rounded-xl" onClick={join}>
            Join
          </Button>
        </div>
      </section>

      <Button variant="outline" className="h-12 w-full rounded-xl" onClick={signOut}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}
