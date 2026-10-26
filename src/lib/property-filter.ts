/** Dashboard property filtering: by tenants, by whether it makes money, and by country. */

export type TenantFilter = "all" | "occupied" | "empty";
export type MoneyFilter = "all" | "profit" | "loss";

export const COUNTRY_ANY = "";
export const COUNTRY_NONE = "__none__";

export interface PropertyFilter {
  tenants: TenantFilter;
  money: MoneyFilter;
  /** "" = all countries, COUNTRY_NONE = no country set, otherwise an ISO code. */
  country: string;
}

export const EMPTY_FILTER: PropertyFilter = { tenants: "all", money: "all", country: COUNTRY_ANY };

export function isFilterActive(f: PropertyFilter) {
  return f.tenants !== "all" || f.money !== "all" || f.country !== COUNTRY_ANY;
}

export function filterProperties<T extends { tenants: number | null; country: string | null }>(
  properties: T[],
  f: PropertyFilter,
  netOf: (p: T) => number,
): T[] {
  return properties.filter((p) => {
    const tenants = Number(p.tenants) || 0;
    if (f.tenants === "occupied" && tenants <= 0) return false;
    if (f.tenants === "empty" && tenants > 0) return false;

    if (f.money === "profit" && netOf(p) <= 0) return false;
    if (f.money === "loss" && netOf(p) >= 0) return false;

    if (f.country === COUNTRY_NONE) return !p.country;
    if (f.country !== COUNTRY_ANY) return p.country === f.country;

    return true;
  });
}

/** Country select options: only countries actually in use, plus "no country set" when some are missing one. */
export function countryFilterOptions<T extends { country: string | null }>(properties: T[]): [string, string][] {
  const seen = new Set<string>();
  let missing = false;
  for (const p of properties) {
    if (p.country) seen.add(p.country);
    else missing = true;
  }
  const codes = [...seen].sort((a, b) => countryLabel(a).localeCompare(countryLabel(b)));
  return [
    [COUNTRY_ANY, "All countries"],
    ...codes.map((code) => [code, countryLabel(code)] as [string, string]),
    ...(missing ? ([[COUNTRY_NONE, "No country set"]] as [string, string][]) : []),
  ];
}
