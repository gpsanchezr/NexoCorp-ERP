-- INSTRUCCIÓN: copia y pega este script directamente en el SQL Editor de Supabase
-- y ejecútalo para crear/validar las tablas necesarias para la importación maestra.

create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
for select using (bucket_id = 'product-images');

drop policy if exists "product_images_business_insert" on storage.objects;
create policy "product_images_business_insert" on storage.objects
for insert with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (select business_id::text from public.profiles where id = auth.uid())
);

drop policy if exists "product_images_business_update" on storage.objects;
create policy "product_images_business_update" on storage.objects
for update using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (select business_id::text from public.profiles where id = auth.uid())
) with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (select business_id::text from public.profiles where id = auth.uid())
);

drop policy if exists "product_images_business_delete" on storage.objects;
create policy "product_images_business_delete" on storage.objects
for delete using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (select business_id::text from public.profiles where id = auth.uid())
);

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists sku text,
  add column if not exists category text,
  add column if not exists description text,
  add column if not exists price numeric(14,2) not null default 0,
  add column if not exists cost numeric(14,2) not null default 0,
  add column if not exists stock integer not null default 0,
  add column if not exists min_stock numeric default 0,
  add column if not exists image_url text;

create index if not exists idx_products_business on public.products (business_id);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_name text not null,
  invoice_number text,
  total_amount numeric(14,2) not null default 0,
  date date,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_details (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  purchase_id uuid references public.purchases(id) on delete cascade,
  product_name text not null,
  quantity integer not null default 0,
  unit_cost numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_name text not null,
  type text not null default 'ajuste',
  quantity integer not null default 0,
  unit_cost numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  type text not null default 'ingreso',
  concept text not null,
  amount numeric(14,2) not null default 0,
  date date,
  reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null,
  month text not null,
  planned_amount numeric(14,2) not null default 0,
  actual_amount numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_business on public.products (business_id);
create index if not exists idx_purchases_business on public.purchases (business_id, created_at desc);
create index if not exists idx_purchase_details_business on public.purchase_details (business_id, purchase_id);
create index if not exists idx_inventory_movements_business on public.inventory_movements (business_id, date desc);
create index if not exists idx_cash_movements_business on public.cash_movements (business_id, date desc);
create index if not exists idx_budgets_business on public.budgets (business_id, month);

create table if not exists public.excel_import_rows (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sheet_name text not null,
  row_number integer not null default 0,
  row_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_excel_import_rows_business on public.excel_import_rows (business_id, sheet_name);
create index if not exists idx_excel_import_rows_data on public.excel_import_rows using gin (row_data);

-- -----------------------------------------------------------------------------
-- clients
-- -----------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  city text,
  category text,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_business on public.clients (business_id);

-- -----------------------------------------------------------------------------
-- suppliers
-- -----------------------------------------------------------------------------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  company_name text not null,
  contact_name text,
  phone text,
  conditions text,
  created_at timestamptz not null default now()
);

create index if not exists idx_suppliers_business on public.suppliers (business_id);

-- -----------------------------------------------------------------------------
-- credits
-- -----------------------------------------------------------------------------
create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_name text not null,
  concept text,
  total_amount numeric(14,2) not null default 0,
  balance_due numeric(14,2) not null default 0,
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_credits_business on public.credits (business_id);

-- -----------------------------------------------------------------------------
-- operating_expenses
-- -----------------------------------------------------------------------------
create table if not exists public.operating_expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  expense_type text not null,
  description text,
  amount numeric(14,2) not null default 0,
  expense_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_operating_expenses_business on public.operating_expenses (business_id);

-- -----------------------------------------------------------------------------
-- habilitar RLS
-- -----------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.suppliers enable row level security;
alter table public.credits enable row level security;
alter table public.operating_expenses enable row level security;
alter table public.excel_import_rows enable row level security;

-- -----------------------------------------------------------------------------
-- policies: cada empresa solo ve/escribe sus propios datos usando business_id
-- -----------------------------------------------------------------------------

drop policy if exists "products_own_business_select" on public.products;
create policy "products_own_business_select" on public.products
for select using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "products_own_business_write" on public.products;
create policy "products_own_business_write" on public.products
for all using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
) with check (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "purchases_own_business_select" on public.purchases;
create policy "purchases_own_business_select" on public.purchases
for select using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "purchases_own_business_write" on public.purchases;
create policy "purchases_own_business_write" on public.purchases
for all using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
) with check (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "purchase_details_own_business_select" on public.purchase_details;
create policy "purchase_details_own_business_select" on public.purchase_details
for select using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "purchase_details_own_business_write" on public.purchase_details;
create policy "purchase_details_own_business_write" on public.purchase_details
for all using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
) with check (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "inventory_movements_own_business_select" on public.inventory_movements;
create policy "inventory_movements_own_business_select" on public.inventory_movements
for select using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "inventory_movements_own_business_write" on public.inventory_movements;
create policy "inventory_movements_own_business_write" on public.inventory_movements
for all using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
) with check (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "cash_movements_own_business_select" on public.cash_movements;
create policy "cash_movements_own_business_select" on public.cash_movements
for select using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "cash_movements_own_business_write" on public.cash_movements;
create policy "cash_movements_own_business_write" on public.cash_movements
for all using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
) with check (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "budgets_own_business_select" on public.budgets;
create policy "budgets_own_business_select" on public.budgets
for select using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "budgets_own_business_write" on public.budgets;
create policy "budgets_own_business_write" on public.budgets
for all using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
) with check (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "excel_import_rows_own_business" on public.excel_import_rows;
create policy "excel_import_rows_own_business" on public.excel_import_rows
for all using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
) with check (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "clients_own_business_select" on public.clients;
create policy "clients_own_business_select" on public.clients
for select using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "clients_own_business_write" on public.clients;
create policy "clients_own_business_write" on public.clients
for all using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
) with check (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "suppliers_own_business_select" on public.suppliers;
create policy "suppliers_own_business_select" on public.suppliers
for select using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "suppliers_own_business_write" on public.suppliers;
create policy "suppliers_own_business_write" on public.suppliers
for all using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
) with check (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "credits_own_business_select" on public.credits;
create policy "credits_own_business_select" on public.credits
for select using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "credits_own_business_write" on public.credits;
create policy "credits_own_business_write" on public.credits
for all using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
) with check (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "operating_expenses_own_business_select" on public.operating_expenses;
create policy "operating_expenses_own_business_select" on public.operating_expenses
for select using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);

drop policy if exists "operating_expenses_own_business_write" on public.operating_expenses;
create policy "operating_expenses_own_business_write" on public.operating_expenses
for all using (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
) with check (
  business_id in (
    select business_id from public.profiles where id = auth.uid()
  )
);
