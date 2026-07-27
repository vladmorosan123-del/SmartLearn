-- Optiuni per-test controlate de profesor. Implicit true (nimic nu se schimba la testele existente).
--   ai_allowed  = permite asistentul AI in timpul testului
--   allow_close = permite elevului sa inchida testul fara sa-l trimita
alter table public.materials
  add column if not exists ai_allowed boolean not null default true;

alter table public.materials
  add column if not exists allow_close boolean not null default true;
