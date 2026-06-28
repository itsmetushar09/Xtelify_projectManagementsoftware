
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  organizationId: string;
}

export function ProjectMembersDialog({
  open,
  onOpenChange,
  projectId,
  organizationId,
}: Props) {
  const qc = useQueryClient();

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("developer");

  const { data: members = [] } = useQuery({
    queryKey: ["org-members", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data } = await supabase
        .from("organization_members")
        .select(`
          *,
          profiles:user_id(
            id,
            full_name,
            email
          )
        `)
        .eq("organization_id", organizationId);

      return data ?? [];
    },
  });

  const addMember = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
      });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Member added");

    qc.invalidateQueries({
      queryKey: ["project-members", projectId],
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Project Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div>
            <Label>User</Label>

            <Select
              value={userId}
              onValueChange={setUserId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>

              <SelectContent>
                {members.map((m: any) => {
                  const p = Array.isArray(m.profiles)
                    ? m.profiles[0]
                    : m.profiles;

                  return (
                    <SelectItem
                      key={m.user_id}
                      value={m.user_id}
                    >
                      {p?.full_name || p?.email}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Project Role</Label>

            <Select
              value={role}
              onValueChange={setRole}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="project_manager">
                  Project Manager
                </SelectItem>

                <SelectItem value="team_lead">
                  Team Lead
                </SelectItem>

                <SelectItem value="developer">
                  Developer
                </SelectItem>

                <SelectItem value="qa">
                  QA
                </SelectItem>

                <SelectItem value="client">
                  Client
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={addMember}
          >
            Add Member
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}