# Nest Income Compass

Build a simple, mobile-first web app for tracking rental properties: how much money each property makes and whether its income covers its costs. Keep it focused and leave out any extra wealth-management features.



1. Properties dashboard

- Grid of property cards. Each card shows: photo, name/nickname, address, property type (apartment, house, etc.), monthly rent, and number of tenants.

- For the selected period, each card also shows total income, total costs, and net result.

- Clear status badge: green "Covering costs" if income ≥ costs, red "Not covering costs" if costs > income.

- Simple progress bar showing how much of the costs the income covers (e.g. "Income covers 85% of costs").

- Small badges for open fixes (e.g. "3 open fixes") and a warning icon if any tax is overdue.

- Top summary bar: total income, total costs, and net across all properties.

- "+ Add property" button.



2. Property detail page

- Header with the property's basic info (editable).

- Period filter: this month, last 3 months, this year, all time, custom range.

- Income vs. costs chart (monthly bars) and net total.

- Tabs: Transactions, Fixes, Taxes.



3. Transactions tab

- List of all income and costs with date, category, amount, note, and receipt thumbnail if attached. Edit and delete supported.



Add income (manual):

- Fields: amount, date, category (rent, deposit, utility reimbursement, other), note.

- Option to mark rent as recurring monthly so it auto-creates each month.



Add cost (manual or receipt photo):

- Manual entry: amount, date, category (repairs, maintenance, utilities, insurance, property tax, mortgage/loan, management fees, other), vendor, note.

- "Scan receipt" button: opens the phone camera or file upload. Use AI to extract vendor, date, total amount, and suggest a category. Pre-fill the form so the user can review and correct before saving. Store the receipt image and link it to the transaction.



4. Fixes tab

- Each fix has: title, description, optional photo, priority (low / medium / high), date added, estimated cost, and status (To do / Done).

- When a fix is marked Done, ask for the actual cost and completion date, and automatically create a cost transaction (with optional receipt photo).



5. Taxes tab

- Tax items with: type (Grundsteuer, income tax on rent, other), amount, due date, and status (Paid / Not paid).

- When marked Paid, save the payment date and automatically add it as a cost transaction.

- Highlight overdue unpaid taxes in red.



6. Data & auth

- Use Supabase for authentication (email login), database, file storage (receipts, property and fix photos), and edge functions (receipt AI parsing, recurring rent).

- Enable row level security so each user only sees their own data.

- Currency: EUR, formatted as 1.234,56 €.



Design

- Clean, modern, minimal. Neutral background; green/red used only for profit status and overdue warnings.

- Large touch targets and a floating "+" button on mobile for quick add (income / cost / scan receipt / fix).

- Empty states with helpful prompts when there's no data yet.



Build order: dashboard and property cards → manual income/cost entry → fixes and taxes → receipt scanning.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nest-income-compass.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/07027d02-2bac-4377-a5bd-6aa696d9e229).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
