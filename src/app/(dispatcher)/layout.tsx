import { RoleGuard } from "@/components/auth/RoleGuard";

export default function DispatcherLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="dispatcher">{children}</RoleGuard>;
}
