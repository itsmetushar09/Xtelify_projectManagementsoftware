import { useRole } from "./use-role";

export function usePermissions() {
  const { data: role } = useRole();

  return {
    role,

    canManageUsers:
      role === "super_admin" ||
      role === "org_admin",

    canCreateProjects:
      role === "super_admin" ||
      role === "org_admin" ||
      role === "project_manager",

    canCreateSprints:
      role === "super_admin" ||
      role === "org_admin" ||
      role === "project_manager",

    canAssignTasks:
      role === "super_admin" ||
      role === "org_admin" ||
      role === "project_manager" ||
      role === "team_lead",

    canDeleteTasks:
      role === "super_admin" ||
      role === "org_admin",

    canAccessAdmin:
      role === "super_admin" ||
      role === "org_admin",
  };
}