alter table public.spots add column title text;

update public.spots set title = 'タイトル未設定' where title is null;

alter table public.spots alter column title set not null;
alter table public.spots add constraint spots_title_length check (char_length(title) between 1 and 100);
