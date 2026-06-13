import { createContext, useContext, useEffect, useState } from "react";
import { useGetUserPermissionsQuery } from "../api/permission.api";

type PermissionContextType = {
  permissions: string[];
  setPermissions: (perms: string[]) => void;
};

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  setPermissions: () => {},
});

export const PermissionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const { data :res} = useGetUserPermissionsQuery();

useEffect(() => {
  if (res?.data) {
    console.log(res)
    // const flat = flattenPermissions(res?.data.permissions)
    setPermissions(res?.data.permissions);
    // console.log(flat)
  }
}, [res?.data]);

  return (
    <PermissionContext.Provider value={{ permissions , setPermissions}}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => useContext(PermissionContext);

// helper to flatten permissions recursively
const flattenPermissions = (modules: any[]): string[] => {
  let perms: string[] = [];
  modules.forEach((mod) => {
    mod.forEach((p: any) => perms.push(p.permissionNameAbrv));
    if (mod.children?.length) {
      perms = perms.concat(flattenPermissions(mod.children));
    }
  });
  return perms;
};
