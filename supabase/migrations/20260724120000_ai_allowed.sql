-- Permite profesorului sa activeze/dezactiveze asistentul AI in timpul unui test.
-- Implicit true (permis) ca sa nu schimbe comportamentul testelor existente.
alter table public.materials
  add column if not exists ai_allowed boolean not null default true;
