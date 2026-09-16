create table if not exists public.calculator_cards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('credit','debit')),
  brand text,
  last4 text,
  credit_limit numeric check (credit_limit is null or credit_limit >= 0),
  closing_day integer check (closing_day is null or closing_day between 1 and 31),
  due_day integer check (due_day is null or due_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists calculator_cards_user_id_idx on public.calculator_cards(user_id);
alter table public.calculator_cards enable row level security;
create policy calculator_cards_select_own on public.calculator_cards for select using (auth.uid() = user_id);
create policy calculator_cards_insert_own on public.calculator_cards for insert with check (auth.uid() = user_id);
create policy calculator_cards_update_own on public.calculator_cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy calculator_cards_delete_own on public.calculator_cards for delete using (auth.uid() = user_id);

create table if not exists public.calculator_installment_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null references public.calculator_cards(id) on delete cascade,
  title text not null,
  total_amount numeric not null check (total_amount >= 0),
  installment_amount numeric not null check (installment_amount >= 0),
  installments integer not null check (installments >= 1),
  current_installment integer not null default 1 check (current_installment >= 1),
  start_date date not null,
  transaction_id text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists calculator_installment_plans_user_id_idx on public.calculator_installment_plans(user_id);
create index if not exists calculator_installment_plans_card_id_idx on public.calculator_installment_plans(card_id);
alter table public.calculator_installment_plans enable row level security;
create policy calculator_installment_plans_select_own on public.calculator_installment_plans for select using (auth.uid() = user_id);
create policy calculator_installment_plans_insert_own on public.calculator_installment_plans for insert with check (auth.uid() = user_id);
create policy calculator_installment_plans_update_own on public.calculator_installment_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy calculator_installment_plans_delete_own on public.calculator_installment_plans for delete using (auth.uid() = user_id);

alter table public.calculator_transactions add column if not exists card_id text;
alter table public.calculator_transactions add column if not exists installment_plan_id text;
alter table public.calculator_transactions add column if not exists installment_number integer;
alter table public.calculator_transactions add column if not exists installment_total integer;
alter table public.calculator_transactions add column if not exists installment_total_amount numeric;
create index if not exists calculator_transactions_card_id_idx on public.calculator_transactions(card_id);
create index if not exists calculator_transactions_installment_plan_id_idx on public.calculator_transactions(installment_plan_id);
