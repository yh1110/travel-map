-- Demo spots so the map is not empty on first launch.
-- photo_path holds absolute URLs here (placeholder images); app-uploaded photos use storage paths.
insert into public.spots (lat, lng, photo_path, taken_at, title) values
  (35.51720, 138.75110, 'https://picsum.photos/seed/kawaguchiko/800/600', '2026-01-03T07:12:00+09:00', '河口湖から見る富士山'),
  (35.30330, 139.52020, 'https://picsum.photos/seed/enoshima/800/600', '2026-04-18T18:05:00+09:00', '江の島の夕暮れ'),
  (34.99480, 135.78500, 'https://picsum.photos/seed/kiyomizu/800/600', '2025-11-22T15:40:00+09:00', '清水寺の紅葉'),
  (43.49680, 142.49690, 'https://picsum.photos/seed/biei/800/600', '2025-06-30T09:55:00+09:00', '美瑛の丘'),
  (35.68970, 139.69170, 'https://picsum.photos/seed/shinjuku/800/600', '2026-02-14T20:30:00+09:00', '新宿の夜景');

-- Same-location pile (within GPS jitter of the Enoshima spot above) to
-- exercise the multi-photo UI: stacked marker, freshness gallery, swipe.
-- Relative timestamps keep 今日/今週/それ以前 buckets populated on any day.
insert into public.spots (lat, lng, photo_path, taken_at, title) values
  (35.30335, 139.52025, 'https://picsum.photos/seed/enoshima2/800/600', now() - interval '3 hours', '江の島の朝焼け'),
  (35.30328, 139.52016, 'https://picsum.photos/seed/enoshima3/800/600', now() - interval '8 hours', '江の島と富士山'),
  (35.30332, 139.52022, 'https://picsum.photos/seed/enoshima4/800/600', now() - interval '3 days', '江の島の海岸'),
  (35.30327, 139.52018, 'https://picsum.photos/seed/enoshima5/800/600', now() - interval '6 days', '夕方の江の島'),
  (35.30331, 139.52024, 'https://picsum.photos/seed/enoshima6/600/800', now() - interval '20 days', '江の島の路地');
