
-- Fix profiles SELECT: restrict to self or shared organization members
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE OR REPLACE FUNCTION public.shares_org_with(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m1
    JOIN public.organization_members m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = _a AND m2.user_id = _b
  );
$$;

CREATE POLICY "Users view self and org peers" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.shares_org_with(auth.uid(), id));

-- Fix organization_members: prevent self-insert privilege escalation
DROP POLICY IF EXISTS "Owner/admin manage members" ON public.organization_members;

CREATE POLICY "Owner/admin manage members" ON public.organization_members
FOR ALL TO authenticated
USING (
  public.is_org_owner(auth.uid(), organization_id)
  OR public.has_org_role(auth.uid(), organization_id, ARRAY['super_admin'::app_role, 'org_admin'::app_role])
)
WITH CHECK (
  public.is_org_owner(auth.uid(), organization_id)
  OR public.has_org_role(auth.uid(), organization_id, ARRAY['super_admin'::app_role, 'org_admin'::app_role])
);

-- Fix activity_logs SELECT: don't expose NULL-org rows to all users
DROP POLICY IF EXISTS "Org members view activity" ON public.activity_logs;

CREATE POLICY "Org members view activity" ON public.activity_logs
FOR SELECT TO authenticated
USING (
  (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id))
  OR (organization_id IS NULL AND user_id = auth.uid())
);
