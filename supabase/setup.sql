-- Pega todo esto en Supabase > SQL Editor > Run
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price numeric(10,2) not null,
  category text not null,
  images text[] not null default '{}',
  is_new boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;

create policy "Público ve productos activos" on public.products for select using (active = true or auth.role() = 'authenticated');
create policy "Admin inserta" on public.products for insert to authenticated with check (true);
create policy "Admin edita"   on public.products for update to authenticated using (true);
create policy "Admin elimina" on public.products for delete to authenticated using (true);

insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict do nothing;
create policy "Fotos públicas"  on storage.objects for select using (bucket_id = 'products');
create policy "Admin sube fotos"  on storage.objects for insert to authenticated with check (bucket_id = 'products');
create policy "Admin borra fotos" on storage.objects for delete to authenticated using (bucket_id = 'products');
