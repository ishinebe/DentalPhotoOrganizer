-- DentalPhotoOrganizer Phase 2-B
-- Core database schema for local MVP development.
-- Run this file in the Supabase SQL Editor.
-- WARNING:
-- This schema.sql is an old local MVP draft and does not fully match the current Supabase production schema.
-- For implementation, refer to docs/database_reference.md as the source of truth.

create extension if not exists pgcrypto;

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  original_filename text not null,
  original_path text,
  file_hash text,
  file_size bigint,
  mime_type text,
  code_type text,
  code_text text,
  captured_at timestamptz,
  imported_at timestamptz default now(),
  import_batch_id uuid,
  provisional_patient_id text,
  doctor_name text,
  photographer_name text,
  review_status text not null default 'pending',
  export_status text not null default 'not_exported',
  reviewer_id text,
  reviewed_at timestamptz,
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint photos_review_status_check check (
    review_status in ('pending', 'reviewing', 'approved', 'rejected')
  ),
  constraint photos_export_status_check check (
    export_status in ('not_exported', 'ready_for_export', 'exported', 'export_failed')
  )
);

create table if not exists public.photo_groups (
  id uuid primary key default gen_random_uuid(),
  group_label text,
  provisional_patient_id text,
  shooting_date date,
  doctor_name text,
  photographer_name text,
  review_status text not null default 'pending',
  export_status text not null default 'not_exported',
  reviewer_id text,
  reviewed_at timestamptz,
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint photo_groups_review_status_check check (
    review_status in ('pending', 'reviewing', 'approved', 'rejected')
  ),
  constraint photo_groups_export_status_check check (
    export_status in ('not_exported', 'ready_for_export', 'exported', 'export_failed')
  )
);

create table if not exists public.photo_group_items (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  group_id uuid not null references public.photo_groups(id) on delete cascade,
  sort_order integer,
  created_at timestamptz default now(),
  constraint photo_group_items_photo_group_unique unique (photo_id, group_id)
);

create table if not exists public.review_logs (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  action text not null,
  reviewer_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz default now()
);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_photos_updated_at on public.photos;
create trigger update_photos_updated_at
before update on public.photos
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_photo_groups_updated_at on public.photo_groups;
create trigger update_photo_groups_updated_at
before update on public.photo_groups
for each row
execute function public.update_updated_at_column();

create index if not exists idx_photos_provisional_patient_id
  on public.photos (provisional_patient_id);

create index if not exists idx_photos_captured_at
  on public.photos (captured_at);

create index if not exists idx_photos_doctor_name
  on public.photos (doctor_name);

create index if not exists idx_photos_photographer_name
  on public.photos (photographer_name);

create index if not exists idx_photo_groups_provisional_patient_id
  on public.photo_groups (provisional_patient_id);

create index if not exists idx_photo_groups_shooting_date
  on public.photo_groups (shooting_date);

create index if not exists idx_photo_groups_doctor_name
  on public.photo_groups (doctor_name);

create index if not exists idx_photo_groups_photographer_name
  on public.photo_groups (photographer_name);

-- RLS is intentionally not enabled for this local MVP phase.
-- Design authentication, authorization, and RLS policies before production use.
