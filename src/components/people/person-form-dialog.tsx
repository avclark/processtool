import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCreatePerson, useUpdatePerson } from "@/lib/mutations/people";

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // When provided, the dialog edits this person; otherwise it adds a new one.
  person?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    timezone: string | null;
    role: string;
  };
}

export function PersonFormDialog({
  open,
  onOpenChange,
  person,
}: PersonFormDialogProps) {
  const isEdit = !!person;
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [timezone, setTimezone] = React.useState("");
  const [role, setRole] = React.useState("user");
  const [emailError, setEmailError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setFirstName(person?.first_name ?? "");
      setLastName(person?.last_name ?? "");
      setEmail(person?.email ?? "");
      setTimezone(person?.timezone ?? "");
      setRole(person?.role ?? "user");
      setEmailError(null);
    }
  }, [open, person]);

  const pending = createPerson.isPending || updatePerson.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    const input = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: trimmedEmail,
      timezone: timezone.trim() || null,
      role,
    };

    try {
      if (isEdit) {
        await updatePerson.mutateAsync({ id: person.id, ...input });
      } else {
        await createPerson.mutateAsync(input);
      }
      onOpenChange(false);
    } catch {
      // Mutation surfaced an error toast and rolled back. Keep input.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit person" : "Add person"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this person's details and role."
              : "Add a person directly. Sending an invite email comes in Phase 11."}
          </DialogDescription>
        </DialogHeader>

        <form id="person-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="person-first">First name</label>
              <Input
                id="person-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="person-last">Last name</label>
              <Input
                id="person-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="person-email">Email</label>
            <Input
              id="person-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              placeholder="name@example.com"
              aria-invalid={!!emailError}
            />
            {emailError && (
              <p className="text-xs text-danger-display">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="person-timezone">Timezone</label>
            <Input
              id="person-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="person-role">Role</label>
            <Select
              id="person-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Select>
            <p className="text-xs text-ink-muted">
              Admins see the full sidebar; users see only the Dashboard.
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" form="person-form" disabled={pending}>
            {pending
              ? isEdit
                ? "Saving…"
                : "Adding…"
              : isEdit
                ? "Save"
                : "Add person"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
