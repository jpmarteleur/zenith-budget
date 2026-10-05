# Zenith Budget

Build small, useful improvements and explain the work plainly. Zenith is primarily
a personal budgeting app for its owner and a small number of other people.
Prefer simple, maintainable solutions for current needs. Small scale does not
relax user-data isolation, financial-data correctness, or failure handling.

## Communication

Keep explanations concise and practical. Lead with the outcome and what the user
needs to decide or verify. Link relevant files rather than listing every edit.

When input is needed, ask a focused question, recommend an option, and explain
its practical effect. Own routine implementation details within the agreed scope.

Report failures and workarounds honestly. Distinguish verified behavior from
assumptions and outstanding checks. If access or credentials are missing, name
what is needed and where it belongs; never ask for secrets in chat.

## Where context lives

- `docs/project-doc.md`: confirmed direction, implementation context, and open
  questions. Read relevant sections before deciding product behavior.
- `prompts/<change>.md`: local approval plans for individual tasks, not permanent
  product documentation. Consult the approved scope when relevant.
- `docs/approval-prompt-template.md`: optional starting point for those plans.
- `README.md`: public project introduction and durable setup guidance; some
  descriptions may lag implementation.
- `DESIGN.md`: design inspiration, not a binding specification. Use the existing
  UI as the baseline unless a change is requested.
- Code, package files, configuration, and SQL: evidence of implementation.
  Recheck these instead of trusting an old description.

Agent guidance, the project document, the approval template, and prompts are
local and ignored by Git at the user's request. Do not force-add them. Do not
ignore application source, database SQL, or public setup documentation merely
because they are used during development.

Record lasting approved product decisions in the local project document. Keep
public setup instructions in README accurate when relevant. A fresh clone will
not contain the ignored guidance; do not assume it is shared with collaborators.

## How we work

Inspect relevant code and the working tree first. Execute clear, scoped
explanations, reviews, documentation updates, copy changes, small bug fixes,
and routine maintenance directly when they introduce no material new decision.

Before implementing a new feature or material change, confirm whether to use
the current branch or a new branch if the user has not already chosen. Propose
a short descriptive name and respect the user's choice. Combine this with the
approval checkpoint when one is required.

For meaningful product ambiguity or a material new decision about auth,
authorization, budget calculations, recurring behavior, API/database contracts,
dependencies, architecture, paid services or ongoing costs, broad refactors,
scope expansion, or external/destructive actions:

1. Draft a short `prompts/<change>.md` before implementation or installation.
   Lead with the outcome, decisions, scope, and acceptance checks. Include
   security, data, UI, and implementation notes only where relevant.
2. Share the prompt for explicit approval and include any outstanding branch
   choice in the same checkpoint.
3. Wait for approval and the branch choice. Then implement and verify the
   entire agreed slice.

Use this process when explicitly requested too. An inline plan may replace the
file when the user explicitly asks to keep planning in chat. Approval persists
for the exact scope and its routine implementation and verification; do not ask
again unless a material new decision or scope expansion becomes necessary.

Choose file names, helpers, component boundaries, and verification steps without
asking the user to decide routine technical details. Avoid unrelated refactors,
future-feature scaffolding, and abstractions without a current need.

Preserve user work. Do not discard changes or rewrite shared Git history without
explicit authorization. Local implementation approval does not itself authorize
deployment or hosted data changes; confirm the authorized target and action.

When recovering context, inspect the working tree, relevant approved prompt,
current code, and Git history. A commit does not prove checks passed. If repeated
fixes fail, revisit the cause before continuing.

## Technical foundation and organization

The existing stack is React, TypeScript, Vite, Supabase, Gemini, and Recharts.
Check `package.json`, `package-lock.json`, and configuration before relying on
an API. Use npm and preserve the lockfile. Do not replace the stack or add new
packages without the applicable scope approval.

Follow existing ownership boundaries; this is not a request to reorganize:

```text
App.tsx, MainApp.tsx   authentication gate and page composition/navigation
pages/                pages and page-specific interactions
components/           UI components
hooks/                budget, recurring, and reusable React logic
contexts/             authentication and shared settings
services/             external-service clients and request helpers
api/                  server-side endpoints
utils/                reusable calculations and date helpers
types.ts              shared domain types
constants.ts          shared constants, category colors, and initial data
supabase/             checked-in database SQL
```

Use existing React state, hooks, and contexts. Do not introduce a router or
state library without a concrete need and approval. Extract components and
helpers when they clarify ownership or remove real repetition.

Reuse `services/supabaseClient.ts` for browser Supabase access. Keep reusable
calculations independent of React where practical. Keep types readable; avoid
introducing `any` or weakening checks. Strict TypeScript is not currently enabled;
do not claim otherwise or enable it as an unrelated cleanup.

## Data correctness

Account for both signed-in and guest paths when changing budgets, transactions,
or recurring rules. Guest budget and recurring data stay local; do not silently
upload them or merge them into a signed-in account.

Reuse `utils/dates.ts` for local calendar dates and month keys. Do not derive a
user's local transaction date through UTC conversion.

Preserve category meanings, budget exclusions, calculations, and currency
behavior unless the approved change covers them. Currency formatting does not
perform exchange-rate conversion. Validate financial input and avoid changing
stored amount representation or rounding semantics incidentally.

For recurring changes, consider repeated execution, retries, reloads, month
boundaries, and concurrent sessions. Browser state alone cannot guarantee
database-wide duplicate prevention. Do not describe local guards as such.

Preserve historical transactions when changing or deleting recurring rules.
Preserve the current-month boundary for automatic application unless different
behavior is approved. A transaction needs a corresponding budget month under
the current loading model; do not create orphaned or invisible records.

Report persistence failures accurately. Do not show success or advance
completion bookkeeping when the underlying write failed. Distinguish empty
data from failed loading; do not hide errors behind convincing demo data.

## Security and external services

Supabase permissions and RLS must enforce user-data isolation. Client filters,
guest identifiers, and hidden UI are not authorization controls. When changing
data access, inspect relevant policies rather than assuming they exist.

Keep Gemini and privileged backend credentials server-side. Never expose them
through browser configuration, committed files, logs, or chat. Public Supabase
configuration is not a substitute for RLS.

Treat AI output and request bodies as untrusted input. Validate them before use
and preserve the user's ability to review parsed transaction details. Do not
expand the financial data sent to an external service without approved scope.

For parsing changes, inspect both `api/parse-transaction.ts` and the development
handler in `vite.config.ts`. Keep their contracts and behavior aligned. Check
server-side authorization and abuse controls when changing endpoint exposure;
do not assume a browser auth gate protects an API.

SQL in the repository is not proof of the hosted schema or applied policies.
The existing recurring SQL assumes prior schema objects. Verify prerequisites
and the authorized target before execution. Never use real financial records
as disposable test data or run destructive SQL to make a check pass.

## UI and styling

Reuse existing components, Tailwind tokens in `index.html`, category colors in
`constants.ts`, and the current Inter/Lora typography. Treat `DESIGN.md` as
inspiration; do not copy every reference detail or introduce unrelated branding.

Prefer existing tokens over one-off values. Do not change shared tokens merely
to fit a single screen. Material visual changes belong in scope approval.

Check relevant desktop and mobile layouts. Keep forms labeled, controls
keyboard-accessible, focus visible, and loading, empty, and error states clear.
Use supplied task-specific designs when provided and verify the visual result.

## Verification and handoff

For code changes, run `npm run build` and the locally installed TypeScript
compiler (`./node_modules/.bin/tsc --noEmit`). Recheck available scripts when
tooling changes. There are currently no lint or test scripts; do not claim
those checks ran. A Vite build alone is not a TypeScript check.

Choose behavioral checks appropriate to the change. For date and recurring
logic, cover relevant month-end, leap-year, retry, and duplicate-application
cases. Use focused automated checks where valuable; do not install a framework
just to perform a manual check without approval.

Guest checks do not verify signed-in persistence or RLS. For authorization
changes, check allowed and denied operations as actual clients, not only through
an owner or privileged connection. Use authorized test data and environments.

Fix failures caused by the change and report unrelated failures precisely.
Never disable validation, weaken security, or conceal failures to pass checks.
Documentation-only work needs document and reference checks, not an app build.

Finish with what changed, what passed or failed, and what remains unverified.
Give exact manual steps and expected results when a human check remains.
Update relevant lasting decisions and setup guidance without creating a new
permanent document for every feature. Completed prompts are historical snapshots.
