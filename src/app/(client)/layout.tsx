import { RoleGuard } from "@/components/auth/RoleGuard";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="client">{children}</RoleGuard>;
}
