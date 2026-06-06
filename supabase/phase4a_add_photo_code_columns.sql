-- DentalPhotoOrganizer Phase4-A
-- Add intake form QR/barcode detection fields to photos.
-- Run this file in the Supabase SQL Editor before importing QR test images.

alter table public.photos
  add column if not exists code_type text,
  add column if not exists code_text text;
