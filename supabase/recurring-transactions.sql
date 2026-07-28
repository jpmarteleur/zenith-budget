-- Recurring transactions — run this in the Supabase SQL editor.
--
-- Until this runs, a signed-in session shows ZERO transactions: useBudget now
-- selects `recurring_id`, and Postgres rejects the whole query if the column is
-- missing rather than ignoring it. Nothing is deleted; the read just fails.
-- Guest mode is unaffected (localStorage only).
--
-- Everything below is safe to re-run.


-- ===========================================================================
-- PART A — check these two things first
-- ===========================================================================

-- A1. The category enum. Expected: one row per category, type name `category_name`.
--     If this returns nothing, PART B will fail on the `category` column.
select t.typname, e.enumlabel
from pg_type t
  join pg_enum e on e.enumtypid = t.oid
where t.typname = 'category_name'
order by e.enumsortorder;

-- A2. Does budgets already have a unique (user_id, month)?
--     If no row mentions UNIQUE (user_id, month), run PART C at the end.
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.budgets'::regclass;


-- ===========================================================================
-- PART B — the actual migration. Run this whole block.
-- ===========================================================================

create table if not exists public.recurring_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category     public.category_name not null,
  subcategory  text not null,
  amount       numeric not null default 0,
  note         text not null default '',
  day_of_month int not null default 1 check (day_of_month between 1 and 31),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists recurring_transactions_user_idx
  on public.recurring_transactions (user_id);

alter table public.recurring_transactions enable row level security;

drop policy if exists "recurring_select_own" on public.recurring_transactions;
create policy "recurring_select_own"
  on public.recurring_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "recurring_insert_own" on public.recurring_transactions;
create policy "recurring_insert_own"
  on public.recurring_transactions for insert
  with check (auth.uid() = user_id);

-- The `with check` matters: without it a row could be reassigned to another user_id.
drop policy if exists "recurring_update_own" on public.recurring_transactions;
create policy "recurring_update_own"
  on public.recurring_transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "recurring_delete_own" on public.recurring_transactions;
create policy "recurring_delete_own"
  on public.recurring_transactions for delete
  using (auth.uid() = user_id);

-- Stamps generated transactions so the app can tell what a month already has.
-- `on delete set null`, never cascade: deleting a rule must not delete the real
-- historical transactions it produced. Only the provenance link goes away.
alter table public.transactions
  add column if not exists recurring_id uuid
  references public.recurring_transactions(id) on delete set null;

create index if not exists transactions_recurring_idx
  on public.transactions (user_id, month, recurring_id);


-- ===========================================================================
-- PART C — only if A2 showed no unique constraint on (user_id, month)
-- ===========================================================================
-- Guards against a double-click on "Create Budget" producing two rows for the
-- same month. Fails if you already have duplicate months — delete them first.

-- alter table public.budgets
--   add constraint budgets_user_month_key unique (user_id, month);
