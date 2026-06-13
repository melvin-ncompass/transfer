import { useState, useEffect, useRef } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { ModalElement } from "../../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../../components/atom/select-field/SingleSelect";
import type { CreateNoticePeriodConfigDto } from "../types/notice.types";
import {
  useCreateNoticePeriodMutation,
  useUpdateNoticePeriodMutation,
} from "../api/notice.api";

export interface NoticePeriodData {
  id?: number;
  duration: number;
  policy: string;
  encashmentValue: number;
}

interface NoticePeriodModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: NoticePeriodData;
  configId: number | null;
  mode?: "add" | "edit";
  onSuccess?: (message: string, createdId?: number) => void;
  onError?: (message: string) => void;
}

export function NoticePeriodModal({
  open,
  onClose,
  initialData,
  configId,
  mode = "add",
  onSuccess,
  onError,
}: NoticePeriodModalProps) {
  const [duration, setDuration] = useState<number | string>("");
  const [policy, setPolicy] = useState("gross");
  const [encashmentValue, setEncashmentValue] = useState<number | string>("");
  const hasPrefilledRef = useRef(false);

  const [createNoticePeriod, { isLoading: isCreateLoading }] =
    useCreateNoticePeriodMutation();
  const [updateNoticePeriod, { isLoading: isUpdateLoading }] =
    useUpdateNoticePeriodMutation();

  const policyOptions = [{ label: "Gross", value: "gross" }];

  // Prefill once when modal opens; reset when closed. Avoid re-running on initialData reference change so typing isn't overwritten.
  useEffect(() => {
    if (!open) {
      hasPrefilledRef.current = false;
      return;
    }
    if (mode === "add") {
      setDuration(1);
      setPolicy("gross");
      setEncashmentValue(365);
      return;
    }
    if (mode === "edit" && initialData && !hasPrefilledRef.current) {
      setDuration(initialData.duration);
      setPolicy((initialData.policy || "gross").toLowerCase());
      setEncashmentValue(initialData.encashmentValue);
      hasPrefilledRef.current = true;
    }
  }, [open, mode, initialData]);

  const handleSave = async () => {
    const numericDuration = Number(duration);
    if (numericDuration < 1 || numericDuration > 12) return;
    const leavePolicyYearNum = Number(encashmentValue);
    if (leavePolicyYearNum < 1 || leavePolicyYearNum > 366) return;
    const payload: CreateNoticePeriodConfigDto = {
      duration: numericDuration,
      leaveEncashmentPolicyType: "Gross",
      leavePolicyYear: leavePolicyYearNum,
    };

    try {
      if (mode === "edit" && configId != null) {
        const result = await updateNoticePeriod({ id: configId, body: payload }).unwrap();
        onSuccess?.(result?.message ?? "Updated successfully.");
        onClose();
      } else {
        const result = await createNoticePeriod(payload).unwrap();
        const id = result?.data?.id;
        onSuccess?.(result?.message ?? "Created successfully.", id ?? undefined);
        onClose();
      }
    } catch (err: any) {
      const message =
        err?.data?.message ?? err?.message ?? "Something went wrong.";
      onError?.(message);
    }
  };

  const isValid =
    Number(duration) >= 1 &&
    Number(duration) <= 12 &&
    (Number(encashmentValue) ?? 0) >= 1 &&
    (Number(encashmentValue) ?? 0) <= 366;

  return (
    <ModalElement
      open={open}
      title={mode === "edit" ? "Edit Notice Period" : "Add Notice Period"}
      onClose={onClose}
      onClick={handleSave}
      maxWidth="sm"
      height="auto"
      disabled={!isValid || isCreateLoading || isUpdateLoading}
    >
      <Stack spacing={3}>
        {/* Notice Period Duration */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TextFieldElement
              label="Duration"
              name="duration"
              type="number"
              placeholder="Enter duration (1-12)"
              value={duration}
              onChange={(e) => {
                const val = e.target.value;
                if (!val || (Number(val) >= 1 && Number(val) <= 12)) {
                  setDuration(val);
                }
              }}
              width="63%"
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: "fit-content" }}
            >
              month(s)
            </Typography>
          </Stack>
        </Box>

        {/* Leave Encashment Policy */}
        <Box>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
          >
            <SingleSelectElement
              label="Select Configuration"
              value={policy}
              onChange={setPolicy}
              options={policyOptions}
              width="40%"
              disabled
              sx={{ cursor: "not-allowed" }}
            />

            <Typography
              variant="h4"
              color="text.secondary"
              sx={{
                minWidth: "fit-content",
                color: (theme) => theme.palette.text.secondary,
              }}
            >
              /
            </Typography>

            <TextFieldElement
              label="Leave policy year (days)"
              name="encashmentValue"
              type="number"
              placeholder="1–366"
              value={encashmentValue}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || (Number(val) >= 1 && Number(val) <= 366)) {
                  setEncashmentValue(val);
                }
              }}
              width="30%"
              helperText="Number of days (1–366)"
            />
          </Stack>
        </Box>
      </Stack>
    </ModalElement>
  );
}
