
-- Enable RLS on the materials_public view
ALTER VIEW public.materials_public SET (security_invoker = on);

-- Enable RLS on the underlying mechanism — for views we need to ensure
-- the view respects RLS of the base table. Since materials base table
-- already denies SELECT to non-privileged users, and students use the RPC,
-- we need to allow authenticated users to read the view.
-- The view already has security_invoker=on so it will use the caller's permissions.

-- Actually, views in Postgres don't support ALTER TABLE ... ENABLE ROW LEVEL SECURITY directly.
-- The correct approach is to use security_invoker on the view (done above) 
-- so that the base table's RLS policies are enforced for the calling user.
-- However, since the base materials table only allows profesor/admin SELECT,
-- students won't be able to use this view either (they use the RPC instead).
-- This is the correct security posture.
