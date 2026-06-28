import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/app/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { canAccessAdmin } = usePermissions();

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      return data ?? [];
    },
    enabled: canAccessAdmin,
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["admin-orgs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      return data ?? [];
    },
    enabled: canAccessAdmin,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      return data ?? [];
    },
    enabled: canAccessAdmin,
  });

  const { data: audit = [] } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      return data ?? [];
    },
    enabled: canAccessAdmin,
  });

  if (!canAccessAdmin) {
    return (
      <div className="p-10">
        <h2 className="text-xl font-semibold">
          Access Denied
        </h2>

        <p className="mt-2 text-muted-foreground">
          Only Super Admins and Org Admins can access this page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        description="Workspace administration and audit trail."
      />

      <div className="p-5 md:p-8">
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">
              Users
            </TabsTrigger>

            <TabsTrigger value="orgs">
              Organizations
            </TabsTrigger>

            <TabsTrigger value="projects">
              Projects
            </TabsTrigger>

            <TabsTrigger value="audit">
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* USERS */}

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-10 text-center text-muted-foreground"
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    )}

                    {users.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.full_name || "-"}
                        </TableCell>

                        <TableCell>
                          {u.email}
                        </TableCell>

                        <TableCell>
                          {u.department || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ORGANIZATIONS */}

          <TabsContent value="orgs" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {orgs.map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">
                          {o.name}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {o.slug}
                        </TableCell>

                        <TableCell>
                          {new Date(
                            o.created_at
                          ).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROJECTS */}

          <TabsContent value="projects" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {projects.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.name}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="capitalize"
                          >
                            {p.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className="capitalize"
                          >
                            {p.priority}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUDIT */}

          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {audit.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          No activity yet
                        </TableCell>
                      </TableRow>
                    )}

                    {audit.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          {new Date(
                            a.created_at
                          ).toLocaleString()}
                        </TableCell>

                        <TableCell className="font-medium">
                          {a.action}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {a.entity_type}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}