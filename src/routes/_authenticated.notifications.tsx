import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const markAll = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
    qc.invalidateQueries({ queryKey: ["notif-unread", user!.id] });
  };

  return (
    <div>
      <PageHeader title="Notifications" description="Mentions, assignments, sprint events, and updates."
        actions={items.some((n) => !n.is_read) ? <Button variant="outline" onClick={markAll}><CheckCheck className="mr-2 h-4 w-4" /> Mark all read</Button> : undefined}
      />
      <div className="p-5 md:p-8">
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="All caught up" description="You'll see assignments, mentions and sprint updates here." />
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <Card key={n.id} className={`p-4 ${!n.is_read ? "border-l-4 border-l-primary" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium">{n.title}</h3>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.is_read && <Check className="h-4 w-4 text-muted-foreground" />}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
