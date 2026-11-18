-- Imitação mínima do Supabase (auth, storage, papéis) para rodar a trilha num Postgres local.
do $x$ begin create role anon nologin; create role authenticated nologin; create role service_role nologin; exception when others then null; end $x$;
create schema auth; create schema storage;
grant usage on schema auth, storage, public to anon, authenticated;
create table auth.users(id uuid primary key, instance_id uuid, aud text, role text, email text, raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub', '')::uuid $$;
grant execute on all functions in schema auth to anon, authenticated;
create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid() primary key, bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant execute on all functions in schema storage to anon, authenticated;
-- outra app no mesmo banco, como em produção
create table public.painel_x(id int);
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
