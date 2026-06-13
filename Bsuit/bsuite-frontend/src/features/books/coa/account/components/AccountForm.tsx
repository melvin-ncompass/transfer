import { useState, useEffect, useMemo } from "react";
import { Box, Stack, MenuItem } from "@mui/material";
import { Checkbox } from "../../../../../components/atom/check-box";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { TextAreaField } from "../../../../../components/atom/text-area-field";
import { PrimaryButton } from "../../../../../components/atom/button";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { currencyData } from "../../../../company/utils/currency";
import {
  useAddAccountMutation,
  useUpdateAccountMutation,
} from "../api/accounts.api";
import type { ICurrencyItem } from "../../../../../types/types";

interface AccountFormProps {
  mode: "add" | "edit";
  forcedAccountType?: "Income" | "Expense" | "Asset" | "Liability";
  editData?: any;
  // parentAccounts contains the parent account's label/value and the parent's groupId and accountType
  parentAccounts?: {
    label: string;
    value: string;
    groupId?: string | number;
    accountType?: string;
  }[];
  nonSubAccountAndGroupCreation?: boolean;
  // groupNames includes the group's type so we can filter by account type
  groupNames?: { label: string; value: string | number; type?: string }[];
  // called when user selects "Create new group" from the dropdown
  onOpenCreateGroup?: (groupType: string) => void;
  onSuccess?: (newAccount?: { id: number; accountName?: string }) => void;
}
const buildFormData = (editData: any) => ({
  accountName: editData?.accountName || "",
  accountCode: editData?.accountCode || "",
  accountType: editData?.accountType || "",
  accountCurrency: editData?.accountCurrency || "",
  notes: editData?.notes || "",
  groupId: editData?.groupId
    ? String(editData.groupId)
    : editData?.group?.id
      ? String(editData.group.id)
      : null,
  isSubAccount: editData?.isSubAccount || editData?.parentAccount?.id,
  parentAccountId: editData?.parentAccount?.id
    ? String(editData.parentAccount.id)
    : "",
});
export function AccountForm({
  mode,
  editData = {},
  parentAccounts = [],
  groupNames = [],
  onOpenCreateGroup,
  onSuccess,
  forcedAccountType,
  nonSubAccountAndGroupCreation,
}: AccountFormProps) {
  const [addAccount, { isLoading: adding }] = useAddAccountMutation();
  const [updateAccount, { isLoading: updating }] = useUpdateAccountMutation();

  const [initialFormData, setInitialFormData] = useState(() =>
    buildFormData(editData),
  );
  const [formData, setFormData] = useState(() => buildFormData(editData));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currencyOptions, setCurrencyOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error" | "info" | "warning",
  });
  useEffect(() => {
    if (editData) {
      const initial = buildFormData(editData);
      setInitialFormData(initial);
      setFormData(initial);
    }
  }, [editData]);

  /* ⭐ CHANGE: detect changes */
  const isDirty = useMemo(() => {
    return Object.keys(initialFormData).some(
      (key) =>
        String((formData as any)[key] ?? "") !==
        String((initialFormData as any)[key] ?? ""),
    );
  }, [formData, initialFormData]);

  // Compute group options filtered by selected account type
  const filteredGroupNames = useMemo(() => {
    // Determine effective account type: use parent account's type when this is a sub-account
    let effectiveType = formData.accountType;
    if (formData.isSubAccount && formData.parentAccountId) {
      const parent = parentAccounts.find(
        (p) => String(p.value) === String(formData.parentAccountId),
      );
      if (parent?.accountType) effectiveType = parent.accountType;
    }

    if (!effectiveType) return groupNames;
    return (groupNames || []).filter((g) => g.type === effectiveType);
  }, [
    groupNames,
    parentAccounts,
    formData.accountType,
    formData.isSubAccount,
    formData.parentAccountId,
  ]);

  // Convert filtered groups to string-valued options expected by the select component
  const filteredGroupOptions = useMemo(() => {
    return (filteredGroupNames || []).map((g) => ({
      label: g.label,
      value: String(g.value),
    }));
  }, [filteredGroupNames]);

  // Filter parent accounts by selected account type
  const filteredParentAccounts = useMemo(() => {
    if (!formData.accountType) return parentAccounts;

    return (parentAccounts || [])
      .filter((p) => p.accountType === formData.accountType)
      .filter((p) => p.value != editData.id); // prevent selecting itself as parent
  }, [parentAccounts, formData.accountType]);

  // If the currently selected parentAccount is no longer valid for the selected account type, clear it
  useEffect(() => {
    if (!formData.parentAccountId) return;
    const found = (filteredParentAccounts || []).some(
      (p) => String(p.value) === String(formData.parentAccountId),
    );
    if (!found) {
      setFormData((prev) => ({ ...prev, parentAccountId: "" }));
    }
  }, [filteredParentAccounts]);

  // If the currently selected groupId is no longer valid for the selected account type, clear it
  useEffect(() => {
    if (!formData.groupId) return;
    const found = (filteredGroupOptions || []).some(
      (g) => g.value === String(formData.groupId),
    );
    if (!found) {
      setFormData((prev) => ({ ...prev, groupId: "" }));
    }
  }, [filteredGroupOptions]);

  // Helper to determine effective account type (same logic used above)
  const getEffectiveAccountType = () => {
    let effectiveType = formData.accountType;
    if (formData.isSubAccount && formData.parentAccountId) {
      const parent = parentAccounts.find(
        (p) => String(p.value) === String(formData.parentAccountId),
      );
      if (parent?.accountType) effectiveType = parent.accountType;
    }
    return effectiveType;
  };

  // Format currency dropdown data
  useEffect(() => {
    const formatted = currencyData.map((item: ICurrencyItem) => ({
      label: `${item.symbol} - ${item.cc} - ${item.name}`,
      value: `${item.symbol} - ${item.cc}`,
    }));
    setCurrencyOptions(formatted);
  }, []);

  // Auto-fill groupId & accountType if parent selected
  useEffect(() => {
    if (formData.isSubAccount && formData.parentAccountId) {
      const parent = parentAccounts.find(
        (p) => String(p.value) === String(formData.parentAccountId),
      );
      if (parent) {
        const parentGroupId = parent.groupId ? String(parent.groupId) : "";
        setFormData((prev) => {
          const updated: typeof prev = {
            ...prev,
            groupId: parentGroupId,
            accountType: parent.accountType || prev.accountType,
          };
          // Only update if something actually changed
          if (
            prev.groupId === updated.groupId &&
            prev.accountType === updated.accountType
          ) {
            return prev;
          }
          return updated;
        });
      }
    }
  }, [formData.isSubAccount, formData.parentAccountId, parentAccounts]);

  // Display options: include "No group" so selecting it triggers native Select close;
  // include the currently selected group (by id) even if missing from the filtered list.
  const displayedGroupOptions = useMemo(() => {
    const opts = filteredGroupOptions ? [...filteredGroupOptions] : [];
    const withNoGroup = [
      { label: "No group", value: "" },
      ...opts,
    ];
    if (formData.groupId) {
      const exists = withNoGroup.some(
        (o) => String(o.value) === String(formData.groupId),
      );
      if (!exists) {
        const found = (groupNames || []).find(
          (g) => String(g.value) === String(formData.groupId),
        );
        if (found)
          withNoGroup.push({ label: found.label, value: String(found.value) });
      }
    }
    return withNoGroup;
  }, [filteredGroupOptions, formData.groupId, groupNames]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.accountName.trim())
      newErrors.accountName = "Account Name is required.";
    if (!formData.accountType && !formData.isSubAccount)
      newErrors.accountType = "Please select an Account Type.";
    // if (!formData.groupId && !formData.isSubAccount)
    //   newErrors.groupId = "Please select a Group Name.";
    if (!formData.accountCurrency)
      newErrors.accountCurrency = "Please select an Account Currency.";
    if (formData.isSubAccount && !formData.parentAccountId)
      newErrors.parentAccountId = "Please select a Parent Account.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (mode === "edit" && editData?.id != null) {
        const res = await updateAccount({
          id: editData.id,
          ...formData,
          groupId:
            Number(formData.groupId) === 0 ? null : Number(formData.groupId),
          parentAccountId: formData.isSubAccount
            ? Number(formData.parentAccountId)
            : null,
        }).unwrap();
        if (res.data) {
          setSnackbar({
            open: true,
            message: "Account updated successfully!",
            color: "success",
          });
        }
        onSuccess?.();
      } else {
        const { parentAccountId, isSubAccount, ...restFormData } = formData;

        const res = await addAccount({
          ...restFormData,
          groupId:
            Number(formData.groupId) === 0 ? null : Number(formData.groupId),

          ...(formData.isSubAccount && {
            parentAccountId: Number(parentAccountId),
          }),
        }).unwrap();
        console.log(res.data.id);
        setSnackbar({
          open: true,
          message: "Account added successfully!",
          color: "success",
        });
        onSuccess?.({ id: res.data.id, accountName: res.data.accountName });
      }
      setFormData({
        accountCode: "",
        accountName: "",
        accountType: "",
        accountCurrency: "",
        notes: "",
        groupId: "",
        isSubAccount: false,
        parentAccountId: "",
      });
    } catch (error: any) {
      console.error("Account save failed:", error);
      setSnackbar({
        open: true,
        message:
          error?.data?.message || "Something went wrong while saving account.",
        color: "error",
      });
    }
  };

  const accountTypeOptions = [
    { label: "Asset", value: "Asset" },
    { label: "Liability", value: "Liability" },
    { label: "Income", value: "Income" },
    { label: "Expense", value: "Expense" },
  ];

  const resolvedAccountTypeOptions = forcedAccountType
    ? [{ label: forcedAccountType, value: forcedAccountType }]
    : accountTypeOptions;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 1 }}>
      <Stack spacing={2}>
        {/* <Typography variant="subtitle1" fontWeight={600}>
          {mode === "edit" ? "Edit Account" : "Add New Account"}
        </Typography> */}

        {/* Account name & code */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextFieldElement
            label="Account Name"
            value={formData.accountName}
            onChange={(e) => handleChange("accountName", e.target.value)}
            required
            fullWidth
            error={!!errors.accountName}
            helperText={errors.accountName}
          />
          <TextFieldElement
            label="Account Code"
            value={formData.accountCode}
            onChange={(e) => handleChange("accountCode", e.target.value)}
            fullWidth
          />
        </Stack>

        {/* Account type & currency */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <SingleSelectElement
            label="Account Type"
            value={formData.accountType}
            onChange={(val) => handleChange("accountType", val)}
            options={resolvedAccountTypeOptions}
            required
            width="100%"
            disabled={
              !!forcedAccountType ||
              formData.isSubAccount ||
              editData.accountName
            }
            error={!!errors.accountType}
            helperText={errors.accountType}
          />
          <SingleSelectElement
            label="Account Currency"
            value={formData.accountCurrency}
            disabled={editData.accountCurrency}
            onChange={(val) => handleChange("accountCurrency", val)}
            options={currencyOptions}
            // disabled={mode === "edit"}
            required
            width="100%"
            error={!!errors.accountCurrency}
            helperText={errors.accountCurrency}
          />
        </Stack>

        {/* Group name */}
        {!nonSubAccountAndGroupCreation && (
          <SingleSelectElement
            label="Group Name"
            value={String(formData.groupId || "")}
            onChange={(val) => handleChange("groupId", val)}
            options={displayedGroupOptions}
            width="100%"
            disabled={formData.isSubAccount}
            error={!!errors.groupId}
            helperText={errors.groupId}
            extraMenuItems={
              <Box>
                <MenuItem
                  key="create-group"
                  value="__create_group"
                  onClick={(e) => {
                    e.stopPropagation();
                    const type = getEffectiveAccountType() || "";
                    if (onOpenCreateGroup) {
                      onOpenCreateGroup(type);
                    } else {
                      // parent didn't provide a handler — avoid throwing
                      // optionally log so devs can wire it up where needed
                      // eslint-disable-next-line no-console
                      console.warn(
                        "AccountForm: onOpenCreateGroup not provided — cannot open create-group modal",
                      );
                    }
                  }}
                >
                  + Create new group
                </MenuItem>
              </Box>
            }
          />
        )}

        {/* Sub-account toggle */}
        {!nonSubAccountAndGroupCreation && (
          <Checkbox
            checked={formData.isSubAccount}
            onChange={(e) => handleChange("isSubAccount", e.target.checked)}
            label="Make this a Sub Account"
          />
        )}

        {/* Parent account select */}
        {formData.isSubAccount && (
          <SingleSelectElement
            label="Parent Account"
            sx={{
              cursor: "not-allowed",
            }}
            value={formData.parentAccountId}
            disabled={filteredParentAccounts.length === 0}
            onChange={(val) => handleChange("parentAccountId", val)}
            options={filteredParentAccounts}
            required
            width="100%"
            error={!!errors.parentAccountId}
            helperText={
              filteredParentAccounts.length > 0
                ? errors.parentAccountId
                : "No parent account"
            }
          />
        )}

        {/* Notes */}
        <TextAreaField
          label="Notes"
          width={"100%"}
          value={formData.notes}
          onChange={(value) => handleChange("notes", value)}
        />

        <Box display="flex" justifyContent="flex-end" pt={2}>
          <PrimaryButton
            type="submit"
            aria-label="submit"
            disabled={adding || updating || (mode === "edit" && !isDirty)}
          >
            {adding || updating ? "Saving..." : "Save"}
          </PrimaryButton>
        </Box>
      </Stack>

      {/* Snackbar feedback */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </Box>
  );
}