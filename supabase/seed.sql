-- Demo spots so the map is not empty on first launch.
-- photo_path holds absolute URLs here (placeholder images); app-uploaded photos use storage paths.
insert into public.spots (title, lat, lng, bearing, photo_path, taken_at) values
  ('河口湖の湖畔から望む富士山', 35.51720, 138.75110, 195, 'https://picsum.photos/seed/kawaguchiko/800/600', '2026-01-03T07:12:00+09:00'),
  ('稲村ヶ崎から江の島と夕日', 35.30330, 139.52020, 245, 'https://picsum.photos/seed/enoshima/800/600', '2026-04-18T18:05:00+09:00'),
  ('清水の舞台から京都市街', 34.99480, 135.78500, 280, 'https://picsum.photos/seed/kiyomizu/800/600', '2025-11-22T15:40:00+09:00'),
  ('美瑛 青い池', 43.49680, 142.49690, 20, 'https://picsum.photos/seed/biei/800/600', '2025-06-30T09:55:00+09:00'),
  ('都庁展望室から新宿の夜景', 35.68970, 139.69170, 90, 'https://picsum.photos/seed/shinjuku/800/600', '2026-02-14T20:30:00+09:00');
