import { describe, it, expect } from "vitest";
import {
  COUNTRY_ANY,
  COUNTRY_NONE,
  EMPTY_FILTER,
  countryFilterOptions,
  filterProperties,
  isFilterActive,
  type PropertyFilter,
} from "@/lib/property-filter";

type Row = { id: string; tenants: number | null; country: string | null; net: number };

const rows: Row[] = [
  { id: "berlin", tenants: 2, country: "DE", net: 420 },
  { id: "novi-sad", tenants: 0, country: "RS", net: -120 },
  { id: "munich", tenants: 1, country: "DE", net: 0 },
  { id: "unknown", tenants: 3, country: null, net: 80 },
];
const netOf = (r: Row) => r.net;
const ids = (f: PropertyFilter) => filterProperties(rows, f, netOf).map((r) => r.id);

describe("property filters", () => {
  it("keeps everything with the empty filter and reports it as inactive", () => {
    expect(ids(EMPTY_FILTER)).toEqual(["berlin", "novi-sad", "munich", "unknown"]);
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
  });
  it("splits by tenants, counting null as no tenants", () => {
    expect(ids({ ...EMPTY_FILTER, tenants: "occupied" })).toEqual(["berlin", "munich", "unknown"]);
    expect(ids({ ...EMPTY_FILTER, tenants: "empty" })).toEqual(["novi-sad"]);
    expect(ids({ ...EMPTY_FILTER, tenants: "occupied" })).not.toContain("unknown-null");
    filterProperties([{ tenants: null, country: "DE" }], { ...EMPTY_FILTER, tenants: "empty" }, () => 0);
  });
  it("splits by money using strict net: break-even is neither", () => {
    expect(ids({ ...EMPTY_FILTER, money: "profit" })).toEqual(["berlin", "unknown"]);
    expect(ids({ ...EMPTY_FILTER, money: "loss" })).toEqual(["novi-sad"]);
    expect(ids({ ...EMPTY_FILTER, money: "profit" })).not.toContain("munich");
    expect(ids({ ...EMPTY_FILTER, money: "loss" })).not.toContain("munich");
  });
  it("matches one country, or the ones with none set", () => {
    expect(ids({ ...EMPTY_FILTER, country: "DE" })).toEqual(["berlin", "munich"]);
    expect(ids({ ...EMPTY_FILTER, country: "RS" })).toEqual(["novi-sad"]);
    expect(ids({ ...EMPTY_FILTER, country: COUNTRY_NONE })).toEqual(["unknown"]);
  });
  it("combines filters", () => {
    expect(ids({ tenants: "occupied", money: "profit", country: COUNTRY_ANY })).toEqual(["berlin", "unknown"]);
    expect(ids({ tenants: "occupied", money: "profit", country: "DE" })).toEqual(["berlin"]);
    expect(ids({ tenants: "empty", money: "profit", country: "DE" })).toEqual([]);
  });
  it("reports a filter as active when any part is set", () => {
    expect(isFilterActive({ ...EMPTY_FILTER, money: "loss" })).toBe(true);
    expect(isFilterActive({ ...EMPTY_FILTER, country: "DE" })).toBe(true);
    expect(isFilterActive({ ...EMPTY_FILTER, country: COUNTRY_NONE })).toBe(true);
  });
  it("offers only countries in use, plus no-country-set when some are missing one", () => {
    expect(countryFilterOptions(rows)).toEqual([
      [COUNTRY_ANY, "All countries"],
      ["DE", "Germany"],
      ["RS", "Serbia"],
      [COUNTRY_NONE, "No country set"],
    ]);
    expect(countryFilterOptions([{ country: "DE" }, { country: "DE" }])).toEqual([
      [COUNTRY_ANY, "All countries"],
      ["DE", "Germany"],
    ]);
  });
});
