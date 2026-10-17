import { type ReactNode, type SelectHTMLAttributes } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function NativeSelect({
  options,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: Record<string, string> | [string, string][] }) {
  const entries = Array.isArray(options) ? options : Object.entries(options);
  return (
    <select
      {...props}
      className={cn(
        "flex h-12 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {entries.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

export const inputLg = "h-12 text-base bg-card";
