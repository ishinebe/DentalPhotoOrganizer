-- DentalPhotoOrganizer Group Duplication Fix
-- Prevent one photo from being linked to multiple review groups.
-- Run the duplicate detection SQL in README before applying this constraint.

alter table public.photo_group_items
  add constraint photo_group_items_photo_id_unique unique (photo_id);
