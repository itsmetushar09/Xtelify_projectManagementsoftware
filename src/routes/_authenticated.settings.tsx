import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import { useActiveOrgId } from "@/hooks/use-organizations";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { orgs, orgId } = useActiveOrgId();
  const activeOrg = orgs.find((o) => o.id === orgId);
  const [profile, setProfile] = useState({ full_name: "", designation: "", department: "", phone: "" });
  const [orgName, setOrgName] = useState(activeOrg?.name ?? "");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile({
        full_name: data.full_name ?? "",
        designation: data.designation ?? "",
        department: data.department ?? "",
        phone: data.phone ?? "",
      });
    });
  }, [user]);

  useEffect(() => { if (activeOrg) setOrgName(activeOrg.name); }, [activeOrg]);

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };
  const saveOrg = async () => {
    if (!activeOrg) return;
    const { error } = await supabase.from("organizations").update({ name: orgName }).eq("id", activeOrg.id);
    if (error) toast.error(error.message); else toast.success("Workspace renamed");
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, workspace, and preferences." />
      <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label>Full name</Label><Input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Designation</Label><Input value={profile.designation} onChange={(e) => setProfile((p) => ({ ...p, designation: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Department</Label><Input value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} /></div>
            <Button onClick={saveProfile}>Save profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label>Workspace name</Label><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} /></div>
            <Button onClick={saveOrg}>Save workspace</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(["light","dark","system"] as const).map((t) => (
                <Button key={t} variant={theme === t ? "default" : "outline"} size="sm" onClick={() => setTheme(t)} className="capitalize">{t}</Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
