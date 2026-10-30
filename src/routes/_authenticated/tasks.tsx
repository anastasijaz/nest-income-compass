import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, ListChecks, MessageCircle, Plus, RotateCcw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/app/fields";
import { Photo } from "@/components/app/Photo";
import { CompleteFixSheet, FixSheet } from "@/components/app/FixSheets";
import { reopenFix } from "@/lib/undo-actions";
import { formatEUR } from "@/lib/finance";
import {
  fixesQuery,
  memberName,
  membersQuery,
  propertiesQuery,
  useRefresh,
  type Fix,
} from "@/lib/queries";
import { memberColor } from "@/lib/memberColor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Rentwise" },
      {
        name: "description",
        content: "Every fix and task across all your properties, and who it's assigned to.",
      },
      { property: "og:title", content: "Tasks — Rentwise" },
      {
        property: "og:description",
        content: "Every fix and task across all your properties, and who it's assigned to.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TasksPage,
});

const fmtDate = (d: string) => format(parseISO(d), "d MMM yyyy");

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-primary text-primary-foreground",
  medium: "bg-accent text-accent-foreground",
  low: "bg-muted text-muted-foreground",
};

function TasksPage() {
  const refresh = useRefresh();
  const { data: fixes = [] } = useQuery(fixesQuery);
  const { data: properties = [] } = useQuery(propertiesQuery);
  const { data: members = [] } = useQuery(membersQuery);
  const [status, setStatus] = useState<"todo" | "done">("todo");
  const [assignee, setAssignee] = useState("");
  const [edit, setEdit] = useState<{ fix?: Fix } | null>(null);
  const [complete, setComplete] = useState<Fix | null>(null);

  const propName = (id: string) => properties.find((p) => p.id === id)?.name ?? "Property";
  const shown = fixes
    .filter((f) => f.status === status)
    .filter((f) => !assignee || f.assigned_to === assignee)
    .sort((a, b) => {
      const rank = (p: string) => (p === "high" ? 0 : p === "medium" ? 1 : 2);
      return rank(a.priority) - rank(b.priority) || b.created_at.localeCompare(a.created_at);
    });
  const openCount = fixes.filter((f) => f.status === "todo").length;
  const doneCount = fixes.length - openCount;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pb-8 pt-6">
      <header className="flex items-center gap-3">
        <h1 className="flex-1 text-2xl font-semibold">Tasks</h1>
        <Button className="h-11 rounded-xl" onClick={() => setEdit({})}>
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border bg-card p-1 shadow-card">
          <button
            className={cn(
              "h-10 rounded-lg px-4 text-sm font-medium",
              status === "todo" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
            onClick={() => setStatus("todo")}
          >
            To do {openCount > 0 && <span className="tabular opacity-70">({openCount})</span>}
          </button>
          <button
            className={cn(
              "h-10 rounded-lg px-4 text-sm font-medium",
              status === "done" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
            onClick={() => setStatus("done")}
          >
            Done {doneCount > 0 && <span className="tabular opacity-70">({doneCount})</span>}
          </button>
        </div>
        <div className="min-w-40 flex-1">
          <NativeSelect
            options={[
              ["", "Everyone"],
              ...members.map((m) => [m.user_id, m.display_name || "Member"] as [string, string]),
            ]}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            aria-label="Filter by person"
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
          <ListChecks className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">
            {status === "todo" ? "No open tasks" : "Nothing done yet"}
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {status === "todo"
              ? "Add repairs or jobs for the properties and assign them to someone in your group."
              : "Tasks you mark as done will appear here, with who did them and what they cost."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {shown.map((f) => (
            <li
              key={f.id}
              className={cn(
                "flex gap-3 rounded-2xl border bg-card p-3",
                f.status === "done" && "opacity-70",
              )}
            >
              <button
                className="flex min-w-0 flex-1 gap-3 text-left"
                onClick={() => setEdit({ fix: f })}
              >
                <Photo
                  path={f.photo_path}
                  alt={f.title}
                  className="h-14 w-14 shrink-0 rounded-xl"
                  fallback={<ListChecks className="h-5 w-5" />}
                />
                <div className="min-w-0">
                  <p className={cn("truncate font-medium", f.status === "done" && "line-through")}>
                    {f.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    <Building2 className="mr-1 inline h-3 w-3" />
                    {propName(f.property_id)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-medium capitalize",
                        PRIORITY_STYLE[f.priority],
                      )}
                    >
                      {f.priority}
                    </span>
                    <span>{fmtDate(f.created_at.slice(0, 10))}</span>
                    {f.status === "done"
                      ? f.completed_by && (
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                memberColor(f.completed_by).dot,
                              )}
                            />
                            Done by {memberName(members, f.completed_by)}
                          </span>
                        )
                      : f.assigned_to && (
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <span
                              className={cn("h-2 w-2 rounded-full", memberColor(f.assigned_to).dot)}
                            />
                            → {memberName(members, f.assigned_to)}
                          </span>
                        )}
                    {f.status === "done"
                      ? f.actual_cost != null && (
                          <span className="tabular">Paid {formatEUR(Number(f.actual_cost))}</span>
                        )
                      : f.estimated_cost != null && (
                          <span className="tabular">
                            Est. {formatEUR(Number(f.estimated_cost))}
                          </span>
                        )}
                  </div>
                  {f.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {f.description}
                    </p>
                  )}
                </div>
              </button>
              {f.status === "todo" ? (
                <div className="flex shrink-0 flex-col gap-2 self-center">
                  <Button size="sm" className="h-11 rounded-xl" onClick={() => setComplete(f)}>
                    <Check className="h-4 w-4" /> Done
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-11 rounded-xl">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Reminder${f.assigned_to ? ` for ${memberName(members, f.assigned_to)}` : ""}: "${f.title}" at ${propName(f.property_id)} is still open${f.priority === "high" ? " (high priority)" : ""}.${f.description ? `\n${f.description}` : ""}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Send WhatsApp reminder"
                    >
                      <MessageCircle className="h-4 w-4" /> Remind
                    </a>
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 shrink-0 self-center"
                  aria-label="Reopen task"
                  onClick={async () => {
                    if (!confirm("Reopen this task? Its recorded cost will be removed.")) return;
                    const { error } = await reopenFix(f);
                    if (error) toast.error(error.message);
                    refresh();
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <FixSheet
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(null)}
        fix={edit?.fix}
        title={edit?.fix ? "Edit task" : "Add task"}
      />
      <CompleteFixSheet fix={complete} onOpenChange={(o) => !o && setComplete(null)} />
    </div>
  );
}
