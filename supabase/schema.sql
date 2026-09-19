-- =============================================================================
-- NexoCorp — Esquema de base de datos (Supabase / PostgreSQL)
-- =============================================================================
-- Cómo usar este archivo:
--   1. Crea un proyecto en https://supabase.com
--   2. Ve a "SQL Editor" → "New query", pega TODO este archivo y ejecútalo.
--   3. Copia tu Project URL y anon key a .env.local (ver .env.example).
--   4. Reemplaza src/lib/data-service.ts (ver manual del desarrollador) para
--      que las páginas usen Supabase en vez de los stores de Zustand con
--      datos simulados.
--
-- Multi-tenant: cada fila de negocio (`business_id`) solo es visible para los
-- usuarios asociados a ese negocio en `profiles`. Todas las políticas RLS de
-- abajo siguen ese mismo patrón.
-- =============================================================================

create extension if not exists "pgcrypto"; -- para gen_random_uuid()

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

-- -----------------------------------------------------------------------------
-- businesses
-- -----------------------------------------------------------------------------
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  business_type text,
  name text not null,
  slug text unique not null,
  sector text not null,
  city text,
  logo_url text,
  signature_url text,
  whatsapp_number text,
  trial_start_date timestamptz not null default now(),
  current_uvt_total numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table businesses add column if not exists business_type text;

-- -----------------------------------------------------------------------------
-- profiles — vincula auth.users con un negocio y un rol (owner | cashier).
-- Sin esta tabla no es posible aplicar RLS por negocio ni ocultar datos
-- financieros a los cajeros a nivel de base de datos.
-- -----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  business_id uuid not null references businesses (id) on delete cascade,
  full_name text,
  role text not null check (role in ('owner', 'cashier')) default 'cashier',
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_business on profiles (business_id);

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_business_insert" on storage.objects;
create policy "product_images_business_insert" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] in (select business_id::text from profiles where profiles.id = auth.uid())
  );

drop policy if exists "product_images_business_update" on storage.objects;
create policy "product_images_business_update" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] in (select business_id::text from profiles where profiles.id = auth.uid())
  ) with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] in (select business_id::text from profiles where profiles.id = auth.uid())
  );

drop policy if exists "product_images_business_delete" on storage.objects;
create policy "product_images_business_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] in (select business_id::text from profiles where profiles.id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- customers
-- -----------------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  cedula_nit text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_business on customers (business_id);
create index if not exists idx_customers_cedula on customers (business_id, cedula_nit);

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  barcode text,
  name text not null,
  description text,
  price numeric(14, 2) not null default 0,
  cost numeric(14, 2) not null default 0,
  stock integer not null default 0,
  category text not null default 'Sin categoría',
  cost_price numeric(14, 2) not null default 0,
  sale_price numeric(14, 2) not null default 0,
  stock_quantity integer not null default 0,
  min_stock integer not null default 5,
  expiration_date date,
  image_url text,
  -- 'toxico' | 'quimico' | 'alimento' | 'medicamento' — ver Guardián de
  -- Incompatibilidades en src/lib/utils.ts (checkCrossContamination).
  safety_flags text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table products add column if not exists sku text;
alter table products add column if not exists category text;
alter table products add column if not exists description text;
alter table products add column if not exists min_stock numeric default 0;
alter table products add column if not exists price numeric(14, 2) not null default 0;
alter table products add column if not exists cost numeric(14, 2) not null default 0;
alter table products add column if not exists stock integer not null default 0;
alter table products add column if not exists image_url text;

update products
set price = sale_price,
    cost = cost_price,
    stock = stock_quantity
where price = 0 and cost = 0 and stock = 0;

create index if not exists idx_products_business on products (business_id);
create index if not exists idx_products_barcode on products (business_id, barcode);
create index if not exists idx_products_expiration on products (business_id, expiration_date);

-- -----------------------------------------------------------------------------
-- purchases + purchase_details
-- -----------------------------------------------------------------------------
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  supplier_name text not null,
  invoice_number text,
  total_amount numeric(14, 2) not null default 0,
  date date,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists purchase_details (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  purchase_id uuid references purchases (id) on delete cascade,
  product_name text not null,
  quantity integer not null default 0,
  unit_cost numeric(14, 2) not null default 0,
  subtotal numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchases_business on purchases (business_id, created_at desc);
create index if not exists idx_purchase_details_business on purchase_details (business_id, purchase_id);

-- -----------------------------------------------------------------------------
-- inventory_movements
-- -----------------------------------------------------------------------------
create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  product_name text not null,
  type text not null default 'ajuste',
  quantity integer not null default 0,
  unit_cost numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists cash_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  type text not null default 'ingreso',
  concept text not null,
  amount numeric(14, 2) not null default 0,
  date date,
  reference text,
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  category text not null,
  month text not null,
  planned_amount numeric(14, 2) not null default 0,
  actual_amount numeric(14, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_movements_business on inventory_movements (business_id, date desc);
create index if not exists idx_cash_movements_business on cash_movements (business_id, date desc);
create index if not exists idx_budgets_business on budgets (business_id, month);

alter table products enable row level security;

drop policy if exists "products_select_own_business" on products;
create policy "products_select_own_business" on products
  for select using (
    business_id in (select business_id from profiles where profiles.id = auth.uid())
  );

drop policy if exists "products_insert_own_business" on products;
create policy "products_insert_own_business" on products
  for insert with check (
    business_id in (select business_id from profiles where profiles.id = auth.uid())
  );

drop policy if exists "products_update_own_business" on products;
create policy "products_update_own_business" on products
  for update using (
    business_id in (select business_id from profiles where profiles.id = auth.uid())
  ) with check (
    business_id in (select business_id from profiles where profiles.id = auth.uid())
  );

drop policy if exists "products_delete_own_business" on products;
create policy "products_delete_own_business" on products
  for delete using (
    business_id in (select business_id from profiles where profiles.id = auth.uid())
  );

create policy "purchases_all_own_business" on purchases for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "purchase_details_all_own_business" on purchase_details for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "inventory_movements_all_own_business" on inventory_movements for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "cash_movements_all_own_business" on cash_movements for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "budgets_all_own_business" on budgets for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

-- -----------------------------------------------------------------------------
-- sales + sale_items
-- -----------------------------------------------------------------------------
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid references customers (id) on delete set null,
  receipt_number text not null,
  discount_type text not null check (discount_type in ('none', 'fixed', 'percent')) default 'none',
  discount_value numeric(14, 2) not null default 0,
  subtotal numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  pdf_url text,
  created_offline boolean not null default false,
  created_at timestamptz not null default now(),
  unique (business_id, receipt_number)
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null, -- copia del nombre al momento de la venta
  quantity integer not null check (quantity > 0),
  unit_price numeric(14, 2) not null,
  subtotal numeric(14, 2) not null
);

create index if not exists idx_sales_business on sales (business_id, created_at desc);
create index if not exists idx_sales_customer on sales (customer_id);
create index if not exists idx_sale_items_sale on sale_items (sale_id);

-- -----------------------------------------------------------------------------
-- purchases + purchase_items (compras a proveedores / escáner de facturas)
-- -----------------------------------------------------------------------------
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  supplier_name text not null,
  total_amount numeric(14, 2) not null default 0,
  invoice_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(14, 2) not null,
  expiration_date date
);

create index if not exists idx_purchases_business on purchases (business_id, created_at desc);
create index if not exists idx_purchase_items_purchase on purchase_items (purchase_id);

-- -----------------------------------------------------------------------------
-- fiados_cuaderno (cuaderno digital de fiados)
-- -----------------------------------------------------------------------------
create table if not exists fiados_cuaderno (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  total_debt numeric(14, 2) not null,
  due_date date not null,
  status text not null check (status in ('pendiente', 'pagado', 'vencido')) default 'pendiente',
  created_at timestamptz not null default now()
);

create index if not exists idx_fiados_business on fiados_cuaderno (business_id, status);

-- -----------------------------------------------------------------------------
-- operating_expenses (gastos operativos fijos — Arriendo, Servicios, Nómina…)
-- -----------------------------------------------------------------------------
create table if not exists operating_expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  type text not null,
  description text,
  amount numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_business on operating_expenses (business_id, created_at desc);

-- -----------------------------------------------------------------------------
-- returns / accounts payable / employees / kpis
-- -----------------------------------------------------------------------------
create table if not exists returns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  product_name text not null,
  return_code text,
  quantity numeric(14, 2) not null default 0,
  amount numeric(14, 2) not null default 0,
  reason text,
  date text,
  created_at timestamptz not null default now()
);

create table if not exists accounts_payable (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  provider_name text not null,
  invoice_number text,
  due_date text,
  amount numeric(14, 2) not null default 0,
  status text not null default 'pendiente',
  created_at timestamptz not null default now()
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  full_name text not null,
  document text,
  role text,
  salary numeric(14, 2) not null default 0,
  phone text,
  status text not null default 'activo',
  created_at timestamptz not null default now()
);

create table if not exists kpis (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  metric_name text not null,
  value numeric(14, 2) not null default 0,
  unit text,
  period text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_returns_business on returns (business_id, created_at desc);
create index if not exists idx_accounts_payable_business on accounts_payable (business_id, status);
create index if not exists idx_employees_business on employees (business_id, status);
create index if not exists idx_kpis_business on kpis (business_id, period);

create table if not exists excel_import_rows (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  sheet_name text not null,
  row_number integer not null default 0,
  row_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_excel_import_rows_business on excel_import_rows (business_id, sheet_name);
create index if not exists idx_excel_import_rows_data on excel_import_rows using gin (row_data);

create policy "returns_all_own_business" on returns for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "accounts_payable_all_own_business" on accounts_payable for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "employees_all_own_business" on employees for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "kpis_all_own_business" on kpis for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

-- =============================================================================
-- ROW LEVEL SECURITY — aislamiento multi-tenant por business_id
-- =============================================================================
-- Patrón general: un usuario solo puede leer/escribir filas cuyo business_id
-- coincida con el business_id de su propio perfil (profiles.id = auth.uid()).

alter table businesses enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table fiados_cuaderno enable row level security;
alter table operating_expenses enable row level security;
alter table excel_import_rows enable row level security;

-- businesses: cada quien ve/edita solo el negocio al que pertenece su perfil.
create policy "businesses_select_own" on businesses for select
  using (id in (select business_id from profiles where profiles.id = auth.uid()));
create policy "businesses_update_own" on businesses for update
  using (id in (select business_id from profiles where profiles.id = auth.uid()));

-- profiles: cada quien ve los perfiles de su propio negocio (para listar el
-- equipo), pero solo puede editar su propia fila.
create policy "profiles_select_same_business" on profiles for select
  using (business_id in (select business_id from profiles p2 where p2.id = auth.uid()));
create policy "profiles_update_self" on profiles for update
  using (id = auth.uid());

-- Plantilla reutilizada para el resto de tablas (customers, products, sales,
-- purchases, fiados_cuaderno, operating_expenses): select/insert/update/delete
-- solo si business_id pertenece al usuario autenticado.

create policy "customers_all_own_business" on customers for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "products_all_own_business" on products for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "sales_all_own_business" on sales for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "sale_items_all_via_sale" on sale_items for all
  using (sale_id in (
    select id from sales where business_id in (select business_id from profiles where profiles.id = auth.uid())
  ))
  with check (sale_id in (
    select id from sales where business_id in (select business_id from profiles where profiles.id = auth.uid())
  ));

create policy "purchases_all_own_business" on purchases for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "purchase_items_all_via_purchase" on purchase_items for all
  using (purchase_id in (
    select id from purchases where business_id in (select business_id from profiles where profiles.id = auth.uid())
  ))
  with check (purchase_id in (
    select id from purchases where business_id in (select business_id from profiles where profiles.id = auth.uid())
  ));

create policy "fiados_all_own_business" on fiados_cuaderno for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "expenses_all_own_business" on operating_expenses for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

create policy "excel_import_rows_all_own_business" on excel_import_rows for all
  using (business_id in (select business_id from profiles where profiles.id = auth.uid()))
  with check (business_id in (select business_id from profiles where profiles.id = auth.uid()));

-- -----------------------------------------------------------------------------
-- OPCIONAL (refuerzo por rol): la app ya oculta el Dashboard y las métricas
-- financieras a los cajeros en la interfaz (ver useAuthStore / AppShell).
-- Si además quieres que la base de datos rechace esas consultas aunque alguien
-- llame a la API directamente, reemplaza la política de operating_expenses de
-- arriba por esta versión, que exige role = 'owner' para leer/escribir gastos:
--
-- drop policy "expenses_all_own_business" on operating_expenses;
--
-- create policy "expenses_owner_only" on operating_expenses for all
--   using (exists (
--     select 1 from profiles
--     where profiles.id = auth.uid()
--       and profiles.business_id = operating_expenses.business_id
--       and profiles.role = 'owner'
--   ))
--   with check (exists (
--     select 1 from profiles
--     where profiles.id = auth.uid()
--       and profiles.business_id = operating_expenses.business_id
--       and profiles.role = 'owner'
--   ));
-- =============================================================================
