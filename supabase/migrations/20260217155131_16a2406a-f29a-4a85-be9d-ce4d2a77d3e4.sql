
-- Add unique constraint on local_id for upsert support
ALTER TABLE public.inspections ADD CONSTRAINT inspections_local_id_key UNIQUE (local_id);
