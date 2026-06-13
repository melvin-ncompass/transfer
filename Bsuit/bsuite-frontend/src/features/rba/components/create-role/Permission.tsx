import React from "react";
import { Box, Tooltip } from "@mui/material";
import { PermissionAccordion } from "../../../../components/atom/accordion/PermissionAccordion";
import { Checkbox } from "../../../../components/atom/check-box";
import type { IModulePermissionList, IPermission } from "../../types/rba.types";

interface PermissionProps {
  module: IModulePermissionList;
  selected: string[];
  setSelected: (updated: string[]) => void;
  openMap: Record<string, string | null>;
  setOpenMap: React.Dispatch<
    React.SetStateAction<Record<string, string | null>>
  >;
  parentKey?: string;
  level?: number;
}

export const Permission: React.FC<PermissionProps> = ({
  module,
  selected,
  setSelected,
  openMap,
  setOpenMap,
  parentKey = "",
  level = 0,
}) => {
  const collectPermissions = (mod: IModulePermissionList): string[] => {
    const own = mod.permissions.map((p) => p.permissionNameAbrv);
    const children = mod.children.flatMap(collectPermissions);
    return [...own, ...children];
  };

  const isChecked = (mod: IModulePermissionList) =>
    collectPermissions(mod).every((p) => selected.includes(p));

  const isIndeterminate = (mod: IModulePermissionList) => {
    const all = collectPermissions(mod);
    const count = all.filter((p) => selected.includes(p)).length;
    return count > 0 && count < all.length;
  };

  const notifyChange = (updated: string[]) => setSelected(updated);

  const handleItemToggle = (abbr: string, checked: boolean) => {
    notifyChange(
      checked ? [...selected, abbr] : selected.filter((p) => p !== abbr)
    );
  };

  const handleModuleToggle = (mod: IModulePermissionList, checked: boolean) => {
    const perms = collectPermissions(mod);
    notifyChange(
      checked
        ? Array.from(new Set([...selected, ...perms]))
        : selected.filter((p) => !perms.includes(p))
    );
  };

  const key = parentKey
    ? `${parentKey}.${module.moduleName}`
    : module.moduleName;
  const open = openMap[parentKey] === key;

  return (
    <PermissionAccordion
      key={key}
      title={module.moduleName}
      level={level}
      open={open}
      onToggle={() =>
        setOpenMap((prev) => ({
          ...prev,
          [parentKey]: prev[parentKey] === key ? null : key,
        }))
      }
      showCheckbox
      checkboxProps={{
        checked: isChecked(module),
        indeterminate: isIndeterminate(module),
        onChange: (e) => handleModuleToggle(module, e.target.checked),
      }}
    >
      {module.permissions.map((p: IPermission) => (
        <Box key={p.permissionNameAbrv} sx={{ pl: 6, py: 0.5 }}>
          <Tooltip
            title={
              p.dependencies && p.dependencies.length > 0
                ? `Depends on: ${p.dependencies.map((d) => d.permissionName).join(", ")}`
                : "No dependencies"
            }
            arrow
            placement="top"
          >
            <span>
              <Checkbox
                label={p.permissionName}
                checked={selected.includes(p.permissionNameAbrv)}
                onChange={(e) =>
                  handleItemToggle(p.permissionNameAbrv, e.target.checked)
                }
              />
            </span>
          </Tooltip>
        </Box>
      ))}

      {module.children.map((child) => (
        <Permission
          key={child.moduleName}
          module={child}
          selected={selected}
          setSelected={setSelected}
          openMap={openMap}
          setOpenMap={setOpenMap}
          parentKey={key}
          level={level + 1}
        />
      ))}
    </PermissionAccordion>
  );
};
