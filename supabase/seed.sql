-- Demo spots so the map is not empty on first launch.
-- photo_path holds absolute URLs here (placeholder images); app-uploaded photos use storage paths.
insert into public.spots (lat, lng, photo_path, taken_at) values
  (35.51720, 138.75110, 'https://picsum.photos/seed/kawaguchiko/800/600', '2026-01-03T07:12:00+09:00'),
  (35.30330, 139.52020, 'https://picsum.photos/seed/enoshima/800/600', '2026-04-18T18:05:00+09:00'),
  (34.99480, 135.78500, 'https://picsum.photos/seed/kiyomizu/800/600', '2025-11-22T15:40:00+09:00'),
  (43.49680, 142.49690, 'https://picsum.photos/seed/biei/800/600', '2025-06-30T09:55:00+09:00'),
  (35.68970, 139.69170, 'https://picsum.photos/seed/shinjuku/800/600', '2026-02-14T20:30:00+09:00');
