-- Add answer_key column to materials table for storing TVC quiz answers
-- This will store a JSON array of correct answers (e.g., ["A", "B", "C", "D", "A", "B", "C", "D", "A"])
ALTER TABLE public.materials ADD COLUMN answer_key jsonb DEFAULT NULL;