import * as React from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useRoles } from "@/lib/queries/roles";
import { usePeople } from "@/lib/queries/people";
import { useUpdateTaskTemplateAssignment } from "@/lib/mutations/task-templates";
import type { Database } from "@/lib/database.types";

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];
type Mode = "none" | "role" | "user";

interface AssignmentTabProps {
  processId: string;
  template: TaskTemplate;
}

export function AssignmentTab({ processId, template }: AssignmentTabProps) {
  const roles = useRoles();
  const people = usePeople();
  const save = useUpdateTaskTemplateAssignment(processId);

  const [mode, setMode] = React.useState<Mode>(
    (template.assignment_mode as Mode) ?? "none",
  );
  const [roleId, setRoleId] = React.useState<string>(
    template.assigned_role_id ?? "",
  );
  const [userId, setUserId] = React.useState<string>(
    template.assigned_user_id ?? "",
  );

  React.useEffect(() => {
    setMode((template.assignment_mode as Mode) ?? "none");
    setRoleId(template.assigned_role_id ?? "");
    setUserId(template.assigned_user_id ?? "");
  }, [template.assignment_mode, template.assigned_role_id, template.assigned_user_id]);

  function handleSave() {
    save.mutate({
      id: template.id,
      mode,
      roleId: mode === "role" ? roleId || null : null,
      userId: mode === "user" ? userId || null : null,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={`assign-mode-${template.id}`}>Assign to</label>
        <Select
          id={`assign-mode-${template.id}`}
          className="sm:max-w-xs"
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
        >
          <option value="none">Unassigned</option>
          <option value="role">A role</option>
          <option value="user">A specific person</option>
        </Select>
      </div>

      {mode === "role" && (
        <div className="space-y-2">
          <label htmlFor={`assign-role-${template.id}`}>Role</label>
          <Select
            id={`assign-role-${template.id}`}
            className="sm:max-w-xs"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            <option value="">Select a role…</option>
            {(roles.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {mode === "user" && (
        <div className="space-y-2">
          <label htmlFor={`assign-user-${template.id}`}>Person</label>
          <Select
            id={`assign-user-${template.id}`}
            className="sm:max-w-xs"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">Select a person…</option>
            {(people.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <Button type="button" onClick={handleSave} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save assignment"}
      </Button>
    </div>
  );
}
