-- Materials: per-test options and study classes (from supabase/migrations, not yet applied on the self-hosted DB)
alter table public.materials add column if not exists ai_allowed boolean not null default true;
alter table public.materials add column if not exists allow_close boolean not null default true;
alter table public.materials add column if not exists study_classes text[];

-- Chapters used to group lessons per subject (see src/hooks/useChapters.ts)
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chapters_subject on public.chapters (subject, order_index);

drop trigger if exists update_chapters_updated_at on public.chapters;
create trigger update_chapters_updated_at
  before update on public.chapters
  for each row execute function update_updated_at_column();

-- Deleting a chapter leaves its lessons uncategorized
alter table public.materials drop constraint if exists materials_chapter_id_fkey;
alter table public.materials
  add constraint materials_chapter_id_fkey
  foreign key (chapter_id) references public.chapters(id) on delete set null;

grant select, insert, update, delete on public.chapters to smartlearning_app;
