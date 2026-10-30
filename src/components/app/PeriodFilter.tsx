import { Input } from "@/components/ui/input";
import { PERIOD_LABELS, type Period, type PeriodKey } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function PeriodFilter({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((k) => (
          <button
            key={k}
            onClick={() => onChange({ ...value, key: k })}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
              value.key === k
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-foreground",
            )}
          >
            {PERIOD_LABELS[k]}
          </button>
        ))}
      </div>
      {value.key === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            className="h-11 bg-card"
            value={value.from ?? ""}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            aria-label="From"
          />
          <Input
            type="date"
            className="h-11 bg-card"
            value={value.to ?? ""}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            aria-label="To"
          />
        </div>
      )}
    </div>
  );
}
