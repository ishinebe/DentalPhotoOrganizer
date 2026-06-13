alter table public.photos
add column if not exists photo_type text;

alter table public.photos
add column if not exists photo_type_confidence numeric;

alter table public.photos
add column if not exists photo_type_source text;
