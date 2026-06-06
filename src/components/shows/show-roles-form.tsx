import * as React from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  useSaveShowRoleAssignments,
  type RoleAssignmentInput,
} from "@/lib/mutations/roles";
import type { Database } from "@/lib/database.types";

type Role = Database["public"]["Tables"]["roles"]["Row"];
type RoleMember = Database["public"]["Tables"]["role_members"]["Row"];
type Assignment =
  Database["public"]["Tables"]["show_role_assignments"]["Row"];
interface Person {
  id: string;
  full_name: string;
}

const UNASSIGNED = "";

interface ShowRolesFormProps {
  showId: string;
  roles: Role[];
  roleMembers: RoleMember[];
  people: Person[];
  assignments: Assignment[];
}

export function ShowRolesForm({
  showId,
  roles,
  roleMembers,
  people,
  assignments,
}: ShowRolesFormProps) {
  const save = useSaveShowRoleAssignments(showId);

  const peopleMap = React.useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people],
  );

  const membersByRole = React.useMemo(() => {
    const map = new Map<string, Person[]>();
    for (const role of roles) {
      const members = roleMembers
        .filter((rm) => rm.role_id === role.id)
        .map((rm) => peopleMap.get(rm.user_id))
        .filter((p): p is Person => !!p);
      map.set(role.id, members);
    }
    return map;
  }, [roles, roleMembers, peopleMap]);

  const [draft, setDraft] = React.useState<Record<string, string>>(() =>
    buildDraft(roles, assignments, membersByRole),
  );

  React.useEffect(() => {
    setDraft(buildDraft(roles, assignments, membersByRole));
  }, [roles, assignments, membersByRole]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: RoleAssignmentInput[] = roles.map((r) => ({
      role_id: r.id,
      user_id: draft[r.id] || null,
    }));
    save.mutate(payload);
  }

  if (roles.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No roles have been created yet. Add roles from the People area.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {roles.map((role) => {
        const members = membersByRole.get(role.id) ?? [];
        return (
          <div
            key={role.id}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
          >
            <label className="w-48 shrink-0" htmlFor={`role-${role.id}`}>
              {role.name}
            </label>
            {members.length === 0 ? (
              <span className="text-xs italic text-ink-muted">
                No one is in this role's pool yet.
              </span>
            ) : (
              <Select
                id={`role-${role.id}`}
                className="sm:max-w-xs"
                value={draft[role.id] ?? UNASSIGNED}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [role.id]: e.target.value }))
                }
              >
                <option value={UNASSIGNED}>Unassigned</option>
                {members.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </Select>
            )}
          </div>
        );
      })}

      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save role assignments"}
      </Button>
    </form>
  );
}

// Initial value per role: the existing assignment, or — matching v1 — auto-fill
// when the role's pool has exactly one eligible person.
function buildDraft(
  roles: Role[],
  assignments: Assignment[],
  membersByRole: Map<string, Person[]>,
): Record<string, string> {
  const assignedByRole = new Map(
    assignments.map((a) => [a.role_id, a.user_id]),
  );
  const draft: Record<string, string> = {};
  for (const role of roles) {
    const current = assignedByRole.get(role.id);
    if (current) {
      draft[role.id] = current;
      continue;
    }
    const members = membersByRole.get(role.id) ?? [];
    draft[role.id] = members.length === 1 ? members[0].id : UNASSIGNED;
  }
  return draft;
}
