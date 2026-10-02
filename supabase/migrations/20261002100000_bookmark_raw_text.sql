alter table public.bookmark add column raw_text text;

alter table public.bookmark
  add constraint bookmark_raw_text_length
  check (raw_text is null or char_length(raw_text) <= 20000);

comment on column public.bookmark.raw_text is
  '직접 입력(manual) 레시피의 원문. 북마크를 다시 열 때 이 원문으로 분석한다. 유튜브 북마크는 null';
