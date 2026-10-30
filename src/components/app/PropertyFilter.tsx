import { useState, type ReactNode } from "react";
import { ChevronDown, Filter, X } from "lucide-react";
import { NativeSelect } from "./fields";
import { countryLabel } from "@/lib/countries";
import {
  COUNTRY_ANY,
  COUNTRY_NONE,
  EMPTY_FILTER,
  isFilterActive,
  type MoneyFilter,
  type PropertyFilter,
  type TenantFilter,
} from "@/lib/property-filter";
import { cn } from "@/lib/utils";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-11 shrink-0 rounded-xl border px-4 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground",
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
  const [open, setOpen] = useState(false);
  const setTenants = (tenants: TenantFilter) => onChange({ ...value, tenants });
  // Tapping the active money chip again clears it, so "all" is reachable without the Clear link.
  const setMoney = (money: MoneyFilter) =>
    onChange({ ...value, money: value.money === money ? "all" : money });
  const active = isFilterActive(value);
  const activeCount =
    Number(value.tenants !== "all") +
    Number(value.money !== "all") +
    Number(value.country !== COUNTRY_ANY);

  return (
    <section className="mt-4 rounded-2xl border bg-card shadow-card" aria-label="Filter properties">
      <div className="flex items-center gap-2 p-1.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 text-left text-sm"
        >
          <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-medium">Filter</span>
          {activeCount > 0 && (
            <span className="tabular rounded-full bg-primary px-1.5 text-xs font-semibold leading-5 text-primary-foreground">
              {activeCount}
            </span>
          )}
          <span className="tabular ml-auto truncate text-muted-foreground">
            {shown} of {total} {total === 1 ? "property" : "properties"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        {active && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTER)}
            className="flex h-11 shrink-0 items-center gap-1 rounded-xl px-2.5 text-sm text-muted-foreground"
            aria-label="Clear filters"
          >
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-3 border-t px-3 pb-3 pt-3">
          <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 sm:flex-wrap">
            <Chip active={value.tenants === "all"} onClick={() => setTenants("all")}>
              All
            </Chip>
            <Chip active={value.tenants === "occupied"} onClick={() => setTenants("occupied")}>
              With tenants
            </Chip>
            <Chip active={value.tenants === "empty"} onClick={() => setTenants("empty")}>
              No tenants
            </Chip>
            <span className="mx-1 w-px shrink-0 self-stretch bg-border" />
            <Chip active={value.money === "profit"} onClick={() => setMoney("profit")}>
              Making money
            </Chip>
            <Chip active={value.money === "loss"} onClick={() => setMoney("loss")}>
              Losing money
            </Chip>
          </div>
          <NativeSelect
            aria-label="Country"
            options={countryOptions}
            value={value.country}
            onChange={(e) => onChange({ ...value, country: e.target.value })}
          />
          {value.country !== COUNTRY_ANY && value.country !== COUNTRY_NONE && (
            <p className="text-xs text-muted-foreground">
              Showing {countryLabel(value.country) || value.country} only.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
