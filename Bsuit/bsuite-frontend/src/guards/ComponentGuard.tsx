import { usePermission } from "../context/PermissionContext";

interface PermissionGuardProps {
  permission: string | string[];
  children: React.ReactNode;
}

export const PermissionGuard = ({
  permission,
  children,
}: PermissionGuardProps) => {
  const { permissions } = usePermission();

  if (permissions.length === 0) return <>{children}</>;

  const required = Array.isArray(permission) ? permission : [permission];

  const hasPermission = required.every((p) => permissions.includes(p));

  if (!hasPermission) return null;

  return <>{children}</>;
};
