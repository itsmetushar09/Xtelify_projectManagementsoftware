import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrgId } from "@/hooks/use-organizations";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, Mail } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/team")({
  component: TeamPage,
});

const roleColors: Record<string, string> = {
  super_admin: "bg-destructive/15 text-destructive",
  org_admin: "bg-warning/20 text-warning-foreground",
  project_manager: "bg-info/15 text-info",
  team_lead: "bg-accent text-accent-foreground",
  developer: "bg-primary/10 text-primary",
  qa: "bg-success/15 text-success",
  client: "bg-muted text-muted-foreground",
  guest: "bg-muted text-muted-foreground",
};

function TeamPage() {
  const { orgId } = useActiveOrgId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<
  | "super_admin"
  | "org_admin"
  | "project_manager"
  | "team_lead"
  | "developer"
  | "qa"
  | "client"
  | "guest"
>("developer");

const { data: members = [] } = useQuery({
  queryKey: ["org-members", orgId],
  enabled: !!orgId,

  queryFn: async () => {
    const { data: orgMembers, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", orgId!);

    if (error) {
      console.log(error);
      throw error;
    }

    const userIds =
      orgMembers?.map((m) => m.user_id).filter(Boolean) ?? [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    return (orgMembers ?? []).map((m) => ({
      ...m,
      profile:
        profiles?.find((p) => p.id === m.user_id) ?? null,
    }));
  },
});

  const invite = async () => {      
   console.log("EMAIL ENTERED:", email);
  if (!email || !orgId) return;
 const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id,email")
  .ilike("email", email.trim())
  .maybeSingle();

console.log("PROFILE ERROR:", profileError);
console.log("PROFILE:", profile);

console.log("PROFILE FOUND:", profile);
  if (!profile) {
      console.log(profileError);
    toast.error("User not found");
    return;
  }

  const { error } = await supabase
  .from("organization_members")
  .insert({
    organization_id: orgId,
    user_id: profile.id,
    role,
  });

console.log("INSERT ERROR:", error);

if (error) {
  toast.error(error.message);
  return;
}

  toast.success("Member added");

  qc.invalidateQueries({
    queryKey: ["org-members", orgId],
  });

  setOpen(false);
  setEmail("");
};

  return (
    <div>
      <PageHeader title="Team" description="Manage members, roles, and workload across the workspace."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><UserPlus className="mr-2 h-4 w-4" /> Invite member</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite a teammate</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Role</Label>
                  <Select
  value={role}
  onValueChange={(value) =>
    setRole(
      value as
        | "super_admin"
        | "org_admin"
        | "project_manager"
        | "team_lead"
        | "developer"
        | "qa"
        | "client"
        | "guest"
    )
  }
>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["org_admin","project_manager","team_lead","developer","qa","client","guest"].map((r) => (
                        <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                  <Mail className="mr-1 inline h-3 w-3" /> The invitee should sign up first; you can then assign their account to this workspace.
                </p>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={invite}>Send invite</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 p-5 md:grid-cols-2 md:p-8 lg:grid-cols-3">
        {members.map((m: any) => {
         const p = m.profile;
          const initials = (p?.full_name || p?.email || "U").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();
          return (
            <Card key={m.id}>
              <CardContent className="flex items-start gap-4 p-5">
                <Avatar className="h-12 w-12 border"><AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold">{p?.full_name ?? m.invited_email ?? "Member"}</h3>
                  <p className="truncate text-xs text-muted-foreground">{p?.email ?? m.invited_email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p?.designation ?? p?.department ?? "—"}</p>
                  <Badge variant="secondary" className={`mt-2 capitalize ${roleColors[m.role]}`}>{m.role.replace("_", " ")}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
