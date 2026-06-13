import React, { useEffect, useState } from "react";
import { Box, Divider, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { TextFieldElement } from "../../../../components/atom/text-field";
import {
  PrimaryButton,
  PrimaryIconButton,
  SecondaryButton,
} from "../../../../components/atom/button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { ConfirmDialog } from "../../../../components/dialogs/confirm-dialog";
import { Snackbar } from "../../../../components/atom/snackbar";
import { PermissionPanel } from "./PermissionPanel";
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetPermissionsQuery,
} from "../../api/rba.api";
import type { IRoleDetails } from "../../types/rba.types";

/* ---------------- TYPES ---------------- */

interface LocationState {
  role?: IRoleDetails;
}

interface Permission {
  permissionName: string;
  permissionNameAbrv: string;
  dependencies?: string[];
}

interface ModuleNode {
  permissions?: Permission[];
  children?: ModuleNode[];
}

/* ---------------- COMPONENT ---------------- */

const CreateEditRolePanel: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const isEdit = Boolean(state?.role);

  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const { data: permissionsList } = useGetPermissionsQuery();

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionAbrvs, setPermissionAbrvs] = useState<string[]>([]);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);

  const [errors, setErrors] = useState({
    roleName: "",
    description: "",
    permissions: "",
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({ open: false, message: "", color: "success" });

  const [initialData, setInitialData] = useState({
    roleName: "",
    description: "",
    permissionAbrvs: [] as string[],
  });

  /* ---------------- PREFILL EDIT ---------------- */

  useEffect(() => {
    if (state?.role) {
      const perms =
        state.role.permissions?.map((p) => p.permissionNameAbrv) || [];

      setRoleName(state.role.roleName || "");
      setDescription(state.role.description || "");
      setPermissionAbrvs(perms);

      setInitialData({
        roleName: state.role.roleName || "",
        description: state.role.description || "",
        permissionAbrvs: perms,
      });
    }
  }, [state]);

  /* ---------------- HELPERS ---------------- */

  const showSnackbar = (message: string, color: "success" | "error") => {
    setSnackbar({ open: true, message, color });
  };

  /* ---------------- VALIDATION ---------------- */

  const validate = () => {
    const newErrors = { roleName: "", description: "", permissions: "" };

    if (!roleName.trim()) {
      newErrors.roleName = "Role name is required";
    } else if (roleName.length > 100) {
      newErrors.roleName = "Role name must not exceed 100 characters";
    }

    if (description.length > 400) {
      newErrors.description = "Description must not exceed 400 characters";
    }

    if (permissionAbrvs.length === 0) {
      newErrors.permissions = "At least one permission must be selected";
    }

    setErrors(newErrors);

    if (newErrors.permissions) {
      showSnackbar(newErrors.permissions, "error");
    }

    return (
      !newErrors.roleName && !newErrors.description && !newErrors.permissions
    );
  };

  /* ---------------- FLATTEN PERMISSIONS (PARENT + CHILDREN) ---------------- */

  const flattenPermissions = (modules: ModuleNode[]) => {
    const all: Permission[] = [];

    const walk = (nodes: ModuleNode[]) => {
      nodes.forEach((node) => {
        node.permissions?.forEach((p) => {
          all.push({
            permissionName: p.permissionName,
            permissionNameAbrv: p.permissionNameAbrv,
            dependencies: p.dependencies || [],
          });
        });

        if (node.children?.length) {
          walk(node.children);
        }
      });
    };

    walk(modules);
    return all;
  };

  /* ---------------- DEPENDENCY CHECK ---------------- */

  const checkDependencies = (selected: string[]) => {
    if (!permissionsList?.data) return [];

    const allPermissions = flattenPermissions(
      permissionsList.data as ModuleNode[]
    );

    const permissionMap = new Map(
      allPermissions.map((p) => [p.permissionNameAbrv, p])
    );

    const missing: string[] = [];

    selected.forEach((abrv) => {
      const perm = permissionMap.get(abrv);
      if (!perm) return;

      perm.dependencies?.forEach((dep: any) => {
        const depAbrv = typeof dep === "string" ? dep : dep.permissionNameAbrv;

        if (!selected.includes(depAbrv)) {
          const depPerm = permissionMap.get(depAbrv);
          missing.push(depPerm?.permissionName || depAbrv);
        }
      });
    });

    return [...new Set(missing)];
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {
    if (!validate()) return;

    const missingDeps = checkDependencies(permissionAbrvs);

    if (missingDeps.length > 0) {
      showSnackbar(`Missing dependencies: ${missingDeps.join(", ")}`, "error");
      return;
    }

    try {
      if (isEdit && state?.role) {
        await updateRole({
          id: Number(state.role.id),
          roleName,
          description,
          permissionAbrvs,
        }).unwrap();
        showSnackbar("Role updated successfully", "success");
      } else {
        await createRole({
          roleName,
          description,
          permissionAbrvs,
        }).unwrap();
        showSnackbar("Role created successfully", "success");
      }

      setTimeout(() => navigate("/role/home"), 800);
    } catch (error: any) {
      showSnackbar(error?.data.message, "error");
    }
  };

  /* ---------------- BUTTON STATE ---------------- */

  const hasChanges =
    roleName !== initialData.roleName ||
    description !== initialData.description ||
    permissionAbrvs.join(",") !== initialData.permissionAbrvs.join(",");

  const isSubmitDisabled = !hasChanges || permissionAbrvs.length === 0;

  /* ---------------- UI ---------------- */

  return (
    <>
      <Box
        sx={{
          width: "100%",
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          height: "100%",
        }}
      >
      <Box sx={{display: "flex", alignItems: "center", gap: 2}}>
        <PrimaryIconButton
          onClick={() => navigate("/role/home")}
          size="small"
          color="secondary"
          variant="outlined"
          sx={{
            p: 1,
            borderRadius: 1.5,
            "&:hover": { backgroundColor: "action.hover" },
          }}
          icon={<ArrowBackIcon fontSize="small" sx={{ color: "text.primary" }}/>}
        />
        <Typography variant="h6">
          {isEdit ? "Edit Role" : "Create New Role"}
        </Typography>
      </Box>

        <Divider />

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { md: "row", xs: "column" },
          }}
        >
          <TextFieldElement
            label="Role name *"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            error={!!errors.roleName}
            helperText={errors.roleName || " "}
            fullWidth
          />

          <TextFieldElement
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={!!errors.description}
            helperText={errors.description || " "}
            fullWidth
          />
        </Box>

        <PermissionPanel
          selectedPermissions={permissionAbrvs}
          onChange={setPermissionAbrvs}
        />

        {errors.permissions && (
          <Typography color="error">{errors.permissions}</Typography>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <SecondaryButton onClick={() => setOpenCancelDialog(true)}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={isSubmitDisabled}>
            Submit
          </PrimaryButton>
        </Box>
      </Box>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        />
      )}

      <ConfirmDialog
        open={openCancelDialog}
        title={isEdit ? "Cancel role editing?" : "Cancel role creation?"}
        message="All unsaved changes will be lost."
        confirmText="Discard"
        onConfirm={() => navigate("/role/home")}
        onClose={() => setOpenCancelDialog(false)}
      />
    </>
  );
};

export default CreateEditRolePanel;
