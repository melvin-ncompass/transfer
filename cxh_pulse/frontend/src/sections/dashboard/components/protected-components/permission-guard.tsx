import React from "react";
import { WithPermission } from "../../../../components/utils/with-permission";
import { PermissionName } from "../../../../types/permissions";

/* Report Permission Guard */
export const ReportGuard = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard
    allowedPermissions={[PermissionName.EXPORT]}
  >
    {children}
  </PermissionGuard>
)


/* Permission Guard */
export const PermissionGuard = ({
  allowedPermissions,
  parentPermission,
  children
}: {
  allowedPermissions: string[] | string;
  parentPermission?: string;
  children: React.ReactNode;
}) => {
  const Gate = WithPermission(
    () => <>{children}</>,
    {
      allowedPermissions,
      parentPermission,
    });

  return <Gate />;
};

