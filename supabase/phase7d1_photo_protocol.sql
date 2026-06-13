alter table public.photo_groups
add column if not exists photo_protocol text;

comment on column public.photo_groups.photo_protocol
is 'Shooting protocol such as five_view, nine_view, fourteen_view, partial, or other';
