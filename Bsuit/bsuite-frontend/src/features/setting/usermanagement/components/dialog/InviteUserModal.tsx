import { useState } from "react";
import { Stack } from "@mui/material";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import {
  useGetUserRolesListQuery,
  useInviteUserMutation,
} from "../../api/user.api";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { getErrorMessage } from "../../utils/errorHandler";
import { PrimaryButton } from "../../../../../components/atom/button";
import { isValidEmail } from "../../../../auth/utils/EmailVerification";

export const InviteUserModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [errors, setErrors] = useState<{ email?: string; roleId?: string }>({});

  const [inviteUser, { isLoading }] = useInviteUserMutation();
  const { data: rolesData, isLoading: rolesLoading } =
    useGetUserRolesListQuery();

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnackbar = (message: string, color: "success" | "error") => {
    setSnackbar({ open: true, message, color });
  };

  // -------------------- Validation --------------------
  const validate = () => {
    const newErrors: { email?: string; roleId?: string } = {};

    if (!email) newErrors.email = "Email is required";
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email))
      newErrors.email = "Invalid email address";

    if (!roleId) newErrors.roleId = "Please select a role";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------- Submit --------------------
  const handleSubmit = async () => {
    if (!validate() || isLoading) return;

    try {
      await inviteUser({
        email,
        roleId: Number(roleId), // ALWAYS VALID
      }).unwrap();

      showSnackbar("User invited successfully!", "success");
      setEmail("");
      setRoleId("");
      onClose();
    } catch (err: any) {
      showSnackbar(getErrorMessage(err), "error");
    }
  };

  return (
    <>
      <ModalElement
        title="Invite User"
        open={open}
        onClose={() => {
          setEmail("");
          setRoleId("");
          onClose();
          setErrors({})
        }}
      >
        <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
          {/* Email */}
          <TextFieldElement
            label="Email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email)
                setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={!!errors.email}
            helperText={errors.email || " "}
            fullWidth
          />

          {/* Role Select */}
          <SingleSelectElement
            label="Select Role"
            width="100%"
            required
            value={roleId}
            onChange={(val) => {
              setRoleId(val);
              if (errors.roleId)
                setErrors((prev) => ({ ...prev, roleId: undefined }));
            }}
            error={!!errors.roleId}
            helperText={errors.roleId || " "}
            disabled={rolesLoading}
            options={
              rolesData?.data?.map((role) => ({
                label: role.roleName,
                value: String(role.id),
              })) || []
            }
          />

          {/* Action */}
          <Stack direction="row" justifyContent="flex-end" sx={{ pt: 1 }}>
            <PrimaryButton
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading || !isValidEmail(email) || roleId.length == 0}
            >
              {isLoading ? "Inviting..." : "Invite"}
            </PrimaryButton>
          </Stack>
        </Stack>
      </ModalElement>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </>
  );
};
