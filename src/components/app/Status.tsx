import { cn } from "@/lib/utils";

export function CoverageBadge({ covering }: { covering: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        covering ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive",
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", covering ? "bg-success" : "bg-destructive")}
      />
      {covering ? "Covering costs" : "Not covering costs"}
    </span>
  );
}

export function CoverageBar({
  coverage,
  covering,
  hasCosts,
}: {
  coverage: number;
  covering: boolean;
  hasCosts: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", covering ? "bg-success" : "bg-destructive")}
          style={{ width: `${Math.min(100, coverage)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {hasCosts ? `Income covers ${coverage}% of costs` : "No costs in this period"}
      </p>
    </div>
  );
}
