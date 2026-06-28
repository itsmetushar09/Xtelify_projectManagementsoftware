
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useActiveOrgId } from "./use-organizations";

export function useRole() {
  const { user } = useAuth();
  const { orgId } = useActiveOrgId();

  return useQuery({
    queryKey: ["role", user?.id, orgId],
    enabled: !!user && !!orgId,

    queryFn: async () => {
      const { data } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", orgId!)
        .eq("user_id", user!.id)
        .single();

      return data?.role ?? null;
    },
  });
}