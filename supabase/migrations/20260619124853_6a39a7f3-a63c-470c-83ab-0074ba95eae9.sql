
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_org_role(uuid, uuid, public.app_role[]) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_org_owner(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_organization() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM anon, authenticated, PUBLIC;

ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
