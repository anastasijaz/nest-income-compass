import { Filter, X } from "lucide-react";
import { NativeSelect } from "./fields";
import { countryLabel } from "@/lib/countries";
import { COUNTRY_ANY, isFilterActive, type MoneyFilter, type PropertyFilter, type TenantFilter } from "@/lib/property-filter";
import { cn } from "@/lib/utils";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-11 rounded-xl border px-4 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function PropertyFilterBar({
  value,
  onChange,
  countryOptions,
  shown,
  total,
}: {
  value: PropertyFilter;
  onChange: (f: PropertyFilter) => void;
  countryOptions: [string, string][];
  shown: number;
  total: number;
}) {
  const setTenants = (tenants: TenantFilter) => onChange({ ...value, tenants });
  const setMoney = (money: MoneyFilter) => onChange({ ...value, money });
  const active = isFilterActive(value);

  return (
    <section className="mt-4 rounded-2xl border bg-card p-3 shadow-card" aria-label="Filter properties">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filter
        </p>
        {active && (
          <button type="button" onClick={() => onChange({ ...value, tenants: "all", money: "all", country: COUNTRY_ANY })} className="flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground underline underline-offset-4">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Chip active={value.tenants === "all"} onClick={() => setTenants("all")}>All</Chip>
        <Chip active={value.tenants === "occupied"} onClick={() => setTenants("occupied")}>With tenants</Chip>
        <Chip active={value.tenants === "empty"} onClick={() => setTenants("empty")}>No tenants</Chip>
        <span className="mx-1 hidden w-px self-stretch bg-border sm:block" />
        <Chip active={value.money === "profit"} onClick={() => setMoney("profit")}>Making money</Chip>
        <Chip active={value.money === "loss"} onClick={() => setMoney("loss")}>Losing money</Chip>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="min-w-44 flex-1">
          <NativeSelect
            aria-label="Country"
            options={countryOptions}
            value={value.country}
            onChange={(e) => onChange({ ...value, country: e.target.value })}
          />
        </div>
        <p className="text-sm text-muted-foreground tabular">
          {shown} of {total} {total === 1 ? "property" : "properties"}
        </p>
      </div>

      {active && value.country !== COUNTRY_ANY && value.country !== "__none__" && (
        <p className="mt-2 text-xs text-muted-foreground">Showing {countryLabel(value.country) || value.country} only.</p>
      )}
    </section>
  );
}
