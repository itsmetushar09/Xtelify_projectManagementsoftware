import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setLoading(true);
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name: name.trim(), slug, owner_id: user.id })
      .select()
      .single();
    setLoading(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not create workspace");
      return;
    }
    localStorage.setItem("taskforge.activeOrgId", data.id);
    await qc.invalidateQueries({ queryKey: ["organizations"] });
    toast.success("Workspace created");
    toast.error(
  "Workspace creation disabled"
);
  };

  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center p-6">
      <Card className="w-full max-w-md border-border/70">
        <CardContent className="p-8">
          <div className="grid h-12 w-12 place-items-center rounded-xl gradient-brand text-primary-foreground">
            <Rocket className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            Create your workspace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workspaces hold your projects, sprints, team members, and reports.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Engineering"
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
              {loading ? "Creating…" : "Create workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
