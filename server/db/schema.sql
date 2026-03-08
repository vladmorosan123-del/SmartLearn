-- ============================================================
-- SmartLearning — PostgreSQL Schema
-- ============================================================
-- Run this file to initialize the database:
--   psql -U postgres -d smartlearning -f schema.sql
-- ============================================================

-- ─── Extensions ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('student', 'profesor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Users (authentication) ───────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_confirmed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  study_year INTEGER,
  study_class TEXT,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── User Roles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- ─── Materials ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  lesson_number INTEGER,
  author TEXT,
  genre TEXT,
  year INTEGER,
  answer_key JSONB,
  oficiu INTEGER DEFAULT 0,
  timer_minutes INTEGER DEFAULT 180,
  publish_at TIMESTAMPTZ,
  subject_config JSONB,
  item_points JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── TVC Submissions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS tvc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Lesson Views ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  view_started_at TIMESTAMPTZ DEFAULT now(),
  view_ended_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Invitation Codes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  used_by_user_id UUID REFERENCES users(id),
  created_by_user_id UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject_category ON materials(subject, category);
CREATE INDEX IF NOT EXISTS idx_tvc_submissions_user_material ON tvc_submissions(user_id, material_id);
CREATE INDEX IF NOT EXISTS idx_lesson_views_user_material ON lesson_views(user_id, material_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);

-- ─── Updated_at trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Seed admin account ───────────────────────────────────
-- Password: SHA-256 hash of 'plutonul.7' → then bcrypt-hashed at server start
-- You should create the admin manually or via a seed script.
-- Example (run after server starts, using the /api/auth/register endpoint or a script):
--
-- INSERT INTO users (email, password_hash)
-- VALUES ('administrator.7@lm.local', '<bcrypt hash>');
--
-- INSERT INTO profiles (user_id, username, full_name)
-- VALUES ('<user_id>', 'administrator.7', 'Administrator');
--
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('<user_id>', 'admin');
