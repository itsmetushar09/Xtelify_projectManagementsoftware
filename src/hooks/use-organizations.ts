import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useEffect, useState } from "react";

const STORAGE_KEY = "taskforge.activeOrgId";

export function useOrganizations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["organizations", user?.id],
    enabled: !!user,

    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          organization_id,
          organizations (
            *
          )
        `)
        .eq("user_id", user!.id);

      if (error) throw error;

      return (
        data
          ?.map((item: any) => item.organizations)
          .filter(Boolean) ?? []
      );
    },
  });
}

export function useActiveOrgId() {
  const { data: orgs = [] } = useOrganizations();

  const [orgId, setOrgId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;

    return localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (!orgs.length) return;

    const exists = orgs.some(
      (org: any) => org.id === orgId
    );

    if (!orgId || !exists) {
      const nextOrgId = orgs[0].id;

      setOrgId(nextOrgId);

      localStorage.setItem(
        STORAGE_KEY,
        nextOrgId
      );
    }
  }, [orgs, orgId]);

  const updateOrgId = (id: string) => {
    setOrgId(id);

    localStorage.setItem(
      STORAGE_KEY,
      id
    );
  };

  return {
    orgId,
    setOrgId: updateOrgId,
    orgs,
  };
}