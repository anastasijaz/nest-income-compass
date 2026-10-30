// Stable per-person colors used to tell members apart (calendar stays, team list).
// A fixed palette is used on purpose: these are identity colors, not theme tokens.
const PALETTE = [
  {
    dot: "bg-blue-500",
    cell: "bg-blue-500/25 text-blue-950 dark:text-blue-100 rounded-md",
    avatar: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  },
  {
    dot: "bg-purple-500",
    cell: "bg-purple-500/25 text-purple-950 dark:text-purple-100 rounded-md",
    avatar: "bg-purple-500/15 text-purple-600 dark:text-purple-300",
  },
  {
    dot: "bg-teal-500",
    cell: "bg-teal-500/25 text-teal-950 dark:text-teal-100 rounded-md",
    avatar: "bg-teal-500/15 text-teal-600 dark:text-teal-300",
  },
  {
    dot: "bg-amber-500",
    cell: "bg-amber-500/30 text-amber-950 dark:text-amber-100 rounded-md",
    avatar: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  },
  {
    dot: "bg-pink-500",
    cell: "bg-pink-500/25 text-pink-950 dark:text-pink-100 rounded-md",
    avatar: "bg-pink-500/15 text-pink-600 dark:text-pink-300",
  },
  {
    dot: "bg-indigo-500",
    cell: "bg-indigo-500/25 text-indigo-950 dark:text-indigo-100 rounded-md",
    avatar: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  },
  {
    dot: "bg-orange-500",
    cell: "bg-orange-500/25 text-orange-950 dark:text-orange-100 rounded-md",
    avatar: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
  },
  {
    dot: "bg-cyan-500",
    cell: "bg-cyan-500/25 text-cyan-950 dark:text-cyan-100 rounded-md",
    avatar: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300",
  },
  {
    dot: "bg-fuchsia-500",
    cell: "bg-fuchsia-500/25 text-fuchsia-950 dark:text-fuchsia-100 rounded-md",
    avatar: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
  },
  {
    dot: "bg-sky-500",
    cell: "bg-sky-500/25 text-sky-950 dark:text-sky-100 rounded-md",
    avatar: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
] as const;

export function memberColor(userId: string) {
  let h = 0;
  for (const ch of userId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length] ?? PALETTE[0]!;
}
