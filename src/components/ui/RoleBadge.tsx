import type { Role } from "@/types";

const ROLE_LABEL: Record<Role, string> = {
  client: "Klijent",
  dispatcher: "Dispečer",
  driver: "Vozač",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="role-badge">
      <span className="role-dot" />
      {ROLE_LABEL[role]}
    </span>
  );
}
