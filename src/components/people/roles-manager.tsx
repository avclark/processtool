import * as React from "react";
import { X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRoles, useRoleMembers } from "@/lib/queries/roles";
import { usePeople } from "@/lib/queries/people";
import {
  useCreateRole,
  useRenameRole,
  useDeleteRole,
  useAddRoleMember,
  useRemoveRoleMember,
} from "@/lib/mutations/roles";
import type { Database } from "@/lib/database.types";

type Role = Database["public"]["Tables"]["roles"]["Row"];
interface Person {
  id: string;
  full_name: string;
}

export function RolesManager() {
  const roles = useRoles();
  const roleMembers = useRoleMembers();
  const people = usePeople();
  const createRole = useCreateRole();

  const [newRole, setNewRole] = React.useState("");

  const peopleMap = React.useMemo(
    () => new Map((people.data ?? []).map((p) => [p.id, p])),
    [people.data],
  );

  function handleAddRole(e: React.FormEvent) {
    e.preventDefault();
    const name = newRole.trim();
    if (!name) return;
    createRole.mutate({ name });
    setNewRole("");
  }

  if (roles.isLoading || roleMembers.isLoading || people.isLoading)
    return <p className="text-sm text-ink-muted">Loading roles…</p>;
  if (roles.error || roleMembers.error || people.error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load roles.</p>
      </div>
    );

  const allRoles = roles.data ?? [];

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddRole} className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <label htmlFor="new-role">New role</label>
          <Input
            id="new-role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="e.g. Video Editor"
          />
        </div>
        <Button type="submit" disabled={createRole.isPending}>
          Add role
        </Button>
      </form>

      {allRoles.length === 0 ? (
        <p className="text-sm text-ink-muted">No roles yet.</p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
          {allRoles.map((role) => (
            <li key={role.id} className="p-4">
              <RoleRow
                role={role}
                members={(roleMembers.data ?? [])
                  .filter((rm) => rm.role_id === role.id)
                  .map((rm) => peopleMap.get(rm.user_id))
                  .filter((p): p is NonNullable<typeof p> => !!p)}
                people={people.data ?? []}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoleRow({
  role,
  members,
  people,
}: {
  role: Role;
  members: Person[];
  people: Person[];
}) {
  const renameRole = useRenameRole();
  const deleteRole = useDeleteRole();
  const addMember = useAddRoleMember();
  const removeMember = useRemoveRoleMember();

  const [editing, setEditing] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(role.name);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [addValue, setAddValue] = React.useState("");

  const memberIds = new Set(members.map((m) => m.id));
  const available = people.filter((p) => !memberIds.has(p.id));

  function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const name = nameDraft.trim();
    if (!name || name === role.name) {
      setEditing(false);
      return;
    }
    renameRole.mutate({ id: role.id, name });
    setEditing(false);
  }

  function handleAddMember(userId: string) {
    if (!userId) return;
    addMember.mutate({ role_id: role.id, user_id: userId });
    setAddValue("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              autoFocus
            />
            <Button type="submit" size="sm">
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setNameDraft(role.name);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <span className="text-sm font-medium text-ink-display">
              {role.name}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Rename ${role.name}`}
                onClick={() => {
                  setNameDraft(role.name);
                  setEditing(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {confirmingDelete ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={deleteRole.isPending}
                    onClick={() => deleteRole.mutate({ id: role.id })}
                  >
                    Confirm delete
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {members.length === 0 ? (
          <span className="text-xs italic text-ink-muted">
            No members in this role's pool.
          </span>
        ) : (
          members.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1">
              <Badge tone="muted">{m.full_name}</Badge>
              <button
                type="button"
                aria-label={`Remove ${m.full_name} from ${role.name}`}
                onClick={() =>
                  removeMember.mutate({ role_id: role.id, user_id: m.id })
                }
                className="cursor-pointer text-ink-muted hover:text-ink-display"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        )}
      </div>

      {available.length > 0 && (
        <Select
          className="sm:max-w-xs"
          value={addValue}
          onChange={(e) => handleAddMember(e.target.value)}
        >
          <option value="">Add a person to this role…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
