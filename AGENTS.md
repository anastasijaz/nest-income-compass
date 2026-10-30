<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Data access goes straight from the browser Supabase client with RLS scoped to the caller's shared group (`workspace_id = my_workspace_id()`; each user belongs to exactly one group, joined by invite code); only AI receipt parsing runs server-side (`src/lib/receipt.functions.ts`) because it needs the gateway key.
- Recurring rent is materialized by the idempotent `generate_recurring_rent()` SQL function, called on each signed-in app load — no cron needed.
- Uploaded images live in the private `files` bucket under `<user_id>/...` and are shown via signed URLs; members of the same group can read each other's folders.
- Fixed operating expenses use the transactions table's is_fixed_expense flag, not a second ledger, so property totals and payer tallies count each payment once; receipt extraction returns purpose and currency without silently converting non-EUR bills.
- Tax receipt scans reuse the authenticated receipt parser and private file storage; keep scanned document dates separate from payment due dates to avoid inventing deadlines.
- App emails use the managed server-only template sender; delivery, suppression and idempotency belong to the managed email service, not local email queues or tables.
- Offline/installable support uses vite-plugin-pwa generateSW registered only via src/lib/pwa.ts, which refuses dev, iframes and Lovable preview hosts — stale workers would break previews.
- A property's country is stored as an ISO alpha-2 code in `properties.country` (nullable, so older rows can be unset); the selectable list and label lookup live in `src/lib/countries.ts`, and dashboard filtering rules live in `src/lib/property-filter.ts`.
