-- spots: a photo anchored to the exact point it was shot from, with shooting direction
create table public.spots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  title text not null check (char_length(title) between 1 and 100),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  -- shooting direction in degrees clockwise from true north
  bearing double precision not null check (bearing >= 0 and bearing < 360),
  -- storage object path in the "photos" bucket, or an absolute http(s) URL for seeded demo data
  photo_path text not null,
  taken_at timestamptz
);

create index spots_lat_lng_idx on public.spots (lat, lng);

-- New Supabase defaults do not auto-expose tables to API roles; grant explicitly.
grant select on public.spots to anon, authenticated;
grant insert on public.spots to authenticated;

alter table public.spots enable row level security;

create policy "spots are viewable by everyone"
  on public.spots for select
  using (true);

create policy "authenticated users can insert their own spots"
  on public.spots for insert
  to authenticated
  with check (auth.uid() = user_id);

-- public bucket for spot photos (image-only, capped size)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  10485760, -- 10 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

create policy "photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "authenticated users can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos');
