-- DentalPhotoOrganizer Issue #10
-- Store EXIF camera-local capture datetime for imported photos.
-- EXIF DateTimeOriginal normally has no timezone, so keep it as timestamp without time zone.

alter table public.photos
  add column if not exists captured_at timestamp without time zone;

alter table public.photos
  alter column captured_at type timestamp without time zone
  using captured_at::timestamp without time zone;

create index if not exists idx_photos_captured_at
  on public.photos (captured_at);

comment on column public.photos.captured_at
is 'EXIF-derived camera-local capture datetime. Null when unavailable or invalid; not based on filesystem timestamps.';
