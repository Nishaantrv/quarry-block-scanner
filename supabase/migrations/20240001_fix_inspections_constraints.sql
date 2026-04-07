-- Fix 3: Handle orphaned inspections (user_id IS NULL)
-- We check for orphaned rows because inspections may have been created before user_id was required (when RLS was open).
-- If any exist, we alert the developer via a NOTICE and stop the migration.
-- The developer must manually decide to reassign or delete these orphaned records to proceed safely.
DO $$ 
DECLARE
  orphan_count INT;
BEGIN
  SELECT count(*) INTO orphan_count FROM public.inspections WHERE user_id IS NULL;
  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % orphaned inspections with user_id IS NULL.', orphan_count;
    RAISE NOTICE 'Developer must manually reassign or delete these rows before making user_id NOT NULL.';
    RAISE EXCEPTION 'Migration safely halted due to % orphaned records in public.inspections.', orphan_count;
  END IF;
END $$;

-- Fix 1: Add NOT NULL and ON DELETE CASCADE to inspections.user_id
-- We enforce NOT NULL since user ownership is required for the app's scoped RLS and logic.
ALTER TABLE public.inspections ALTER COLUMN user_id SET NOT NULL;

-- Drop the default foreign key (if it exists) to recreate it with cascading deletes.
-- This prevents the bug where users in auth.users cannot be deleted if they still possess inspections.
ALTER TABLE public.inspections DROP CONSTRAINT IF EXISTS inspections_user_id_fkey;

ALTER TABLE public.inspections 
  ADD CONSTRAINT inspections_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Fix 2: Convert local_id unique constraint to a standard unique index
-- We use a standard unique index to ensure compatibility with Supabase/PostgREST UPSERT logic.
-- Postgres already treats NULLs as distinct (allowing multiple NULLs), so a partial index is unnecessary.
ALTER TABLE public.inspections DROP CONSTRAINT IF EXISTS inspections_local_id_key;

DROP INDEX IF EXISTS inspections_local_id_not_null_idx;
CREATE UNIQUE INDEX inspections_local_id_idx 
  ON public.inspections (local_id);
