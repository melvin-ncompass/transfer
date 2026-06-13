import { Navigate, useLocation } from "react-router-dom";
import { usePermission } from "../context/PermissionContext";
import { useGetUserPermissionsQuery } from "../api/permission.api";
import { useEffect, useState } from "react";

export const RouteGuard = ({ permission, children }: { permission: string, children: React.ReactNode }) => {
  const { permissions, setPermissions } = usePermission();
  const { data, refetch, isLoading } = useGetUserPermissionsQuery();
  const location = useLocation();

  useEffect(() => {
    // refetch permissions on route change
    refetch();
  }, [location.pathname]);

  const [permissionIsValid, setPermissionIsValid] = useState<boolean | null>(() => {
    const currentPermissions = data?.data?.permissions || permissions;
    if (currentPermissions && currentPermissions.length > 0) {
      return !permission || currentPermissions.includes(permission);
    }
    return null;
  });

  useEffect(() => {
    if (data?.data) {
      setPermissions(data.data.permissions);
      if (permission && !data.data.permissions.includes(permission)) {
        setPermissionIsValid(false);
      } else {
        setPermissionIsValid(true);
      }
    }
  }, [data?.data, setPermissions, permission]);

  if ((isLoading && !data?.data) || permissionIsValid === null) {
    return null;
  }

  if (!permissionIsValid) return <Navigate to="/no-access" replace />;

  return <>{children}</>;
};