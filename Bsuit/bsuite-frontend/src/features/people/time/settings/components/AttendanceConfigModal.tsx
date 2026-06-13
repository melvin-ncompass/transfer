import { useEffect, useState } from "react";
import {
  Box,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch/ToggleSwitch";
import { Checkbox } from "../../../../../components/atom/check-box/Checkbox";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import {
  useCreateAttendanceConfigMutation,
  useUpdateAttendanceConfigMutation,
  type AttendanceConfigRequestDto,
  type MaxRegularisationAllowedDto,
} from "../api/settings.api";

const DEFAULT_MAX_REGULARISATION: MaxRegularisationAllowedDto = {
  count: 2,
  timePeriod: "month",
};

const MAX_LAST_DATE_DAY = 31;
const MAX_REG_COUNT_PER_MONTH = 31;

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

interface AttendanceConfigModalProps {
  open: boolean;
  onClose: () => void;
  existingData?: (AttendanceConfigRequestDto & { id: number }) | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const DEFAULT_FORM = {
  allowRegularisation: false,
  reasonRequired: false,
  maxRegularisationAllowed: DEFAULT_MAX_REGULARISATION,
  lastDateToRegularise: 30 as number | "",
  maxDaysAfterIncident: "" as number | "",
};

/* ---------------- SAFE SANITIZER ---------------- */
function sanitizePayload(form: any): AttendanceConfigRequestDto {
  if (!form.allowRegularisation) {
    return {
      allowRegularisation: false,
      reasonRequired: false,
      maxRegularisationAllowed: null,
      lastDateToRegularise: null,
      maxDaysAfterIncident: null,
    };
  }

  const rawCount = form.maxRegularisationAllowed.count;
  let countNum = Number(rawCount);
  if (rawCount === "" || rawCount === null || Number.isNaN(countNum) || countNum <= 0) {
    countNum = 1;
  }
  const payload: Record<string, unknown> = {
    allowRegularisation: true,
    reasonRequired: Boolean(form.reasonRequired),
    maxRegularisationAllowed: {
      timePeriod: "month",
      count: clamp(countNum, 1, MAX_REG_COUNT_PER_MONTH),
    },
  };

  if (form.lastDateToRegularise !== "" && form.lastDateToRegularise !== null) {
    payload.lastDateToRegularise = clamp(
      Number(form.lastDateToRegularise),
      1,
      MAX_LAST_DATE_DAY
    );
  }

  if (form.maxDaysAfterIncident !== "" && form.maxDaysAfterIncident != null) {
    const days = Number(form.maxDaysAfterIncident);
    if (!Number.isNaN(days) && days > 0) {
      payload.maxDaysAfterIncident = days;
    } else {
      payload.maxDaysAfterIncident = null;
    }
  } else {
    payload.maxDaysAfterIncident = null;
  }

  return payload as unknown as AttendanceConfigRequestDto;
}

function toFormState(
  data?: (AttendanceConfigRequestDto & { id: number }) | null
): any {
  if (!data) return DEFAULT_FORM;

  const maxReg =
    data.maxRegularisationAllowed ?? DEFAULT_MAX_REGULARISATION;
  const allow = data.allowRegularisation;

  const rawLast =
    data.lastDateToRegularise ?? DEFAULT_FORM.lastDateToRegularise ?? 30;
  const lastDateNum =
    typeof rawLast === "number"
      ? rawLast
      : Number(rawLast) || 30;

  return {
    allowRegularisation: allow,
    reasonRequired: allow ? Boolean(data.reasonRequired) : false,
    maxRegularisationAllowed: {
      count: clamp(
        Number.isFinite(maxReg.count) && maxReg.count > 0 ? maxReg.count : 1,
        1,
        MAX_REG_COUNT_PER_MONTH
      ),
      timePeriod: "month",
    },
    lastDateToRegularise: clamp(lastDateNum, 1, MAX_LAST_DATE_DAY),
    maxDaysAfterIncident:
      data.maxDaysAfterIncident != null ? data.maxDaysAfterIncident : "",
  };
}

export function AttendanceConfigModal({
  open,
  onClose,
  existingData,
  onSuccess,
  onError,
}: AttendanceConfigModalProps) {
  const isEditMode = Boolean(existingData);

  const [form, setForm] = useState<any>(toFormState(existingData));

  const [createAttendanceConfig, { isLoading: isCreating }] =
    useCreateAttendanceConfigMutation();

  const [updateAttendanceConfig, { isLoading: isUpdating }] =
    useUpdateAttendanceConfigMutation();

  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (open) {
      setForm(toFormState(existingData));
    }
  }, [open, existingData]);

  const handleRegularisationToggle = (checked: boolean) => {
    setForm((prev: any) => ({
      ...prev,
      allowRegularisation: checked,
      ...(!checked ? { reasonRequired: false } : {}),
    }));
  };

  const setField = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const setRegField = (key: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      maxRegularisationAllowed: {
        ...prev.maxRegularisationAllowed,
        [key]: value,
      },
    }));
  };

  const parsePositiveNumber = (value: string): number | "" => {
    if (value === "") return "";
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly === "") return "";
    // Disallow leading 0 while typing (e.g., "0", "01", "0002")
    const normalized = digitsOnly.replace(/^0+/, "");
    if (normalized === "") return "";
    return Number(normalized);
  };

  const ensureCountOnBlur = () => {
    const value = form.maxRegularisationAllowed.count;
    if (value === "" || Number(value) <= 0) {
      setRegField("count", 1);
    } else if (Number(value) > MAX_REG_COUNT_PER_MONTH) {
      setRegField("count", MAX_REG_COUNT_PER_MONTH);
    }
  };

  const ensureLastDateOnBlur = () => {
    const value = form.lastDateToRegularise;
    if (value === "" || Number(value) <= 0) {
      setField("lastDateToRegularise", 1);
    } else if (Number(value) > MAX_LAST_DATE_DAY) {
      setField("lastDateToRegularise", MAX_LAST_DATE_DAY);
    }
  };

  const handleSave = async () => {
    try {
      const payload = sanitizePayload(form);

      if (isEditMode && existingData?.id !== undefined) {
        await updateAttendanceConfig({ data: payload }).unwrap();
        onSuccess?.("Attendance configuration updated successfully");
      } else {
        await createAttendanceConfig(payload).unwrap();
        onSuccess?.("Attendance configuration created successfully");
      }

      onClose();
    } catch (err: any) {
      onError?.(err?.data?.message ?? "Failed to save attendance configuration");
    }
  };

  const saveDisabled = isLoading;

  return (
    <ModalElement
      open={open}
      title={
        isEditMode
          ? "Edit Attendance Configuration"
          : "Add Attendance Configuration"
      }
      onClose={onClose}
      maxWidth="sm"
      onClick={handleSave}
      disabled={saveDisabled}
    >
      <Stack spacing={3}>
        {/* Allow Regularisation */}
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="body1" fontWeight={600}>
                Allow Regularisation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Employees can raise a request to remove their penalties
              </Typography>
            </Box>
            <ToggleSwitch
              label=""
              checked={form.allowRegularisation}
              onChange={(e) => handleRegularisationToggle(e.target.checked)}
              disabled={isLoading}
              size="small"
            />
          </Stack>
        </Box>

        <Divider />

        {/* Reason Required */}
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="body1" fontWeight={600}>
                Reason Required
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Require employees to provide a reason when regularising
              </Typography>
            </Box>
            <Checkbox
              label=""
              checked={form.reasonRequired}
              onChange={(e) => setField("reasonRequired", e.target.checked)}
              disabled={isLoading || !form.allowRegularisation}
            />
          </Stack>
        </Box>

        <Divider />

        {/* Max Regularisations */}
        <Box>
          <Typography variant="body1" fontWeight={600} mb={0.5}>
            Maximum Regularisations Allowed
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <TextFieldElement
              type="number"
              label="Count"
              value={form.maxRegularisationAllowed.count}
              onChange={(e) => {
                const p = parsePositiveNumber(e.target.value);
                if (p === "") {
                  setRegField("count", "");
                } else {
                  setRegField("count", Math.min(p, MAX_REG_COUNT_PER_MONTH));
                }
              }}
              onBlur={ensureCountOnBlur}
              disabled={isLoading || !form.allowRegularisation}
              slotProps={{
                htmlInput: { min: 1, max: MAX_REG_COUNT_PER_MONTH },
              }}
            />

            <Typography color="text.secondary">/</Typography>

            <Typography
              variant="body1"
              color={form.allowRegularisation ? "text.primary" : "text.disabled"}
            >
              Month
            </Typography>
          </Stack>
        </Box>

        <Divider />

        {/* Last Date */}
        <Box>
          <Typography variant="body1" fontWeight={600} mb={0.5}>
            Last Date to Regularise
          </Typography>

          <TextFieldElement
            type="number"
            label="Day of month"
            value={form.lastDateToRegularise}
            onChange={(e) => {
              const p = parsePositiveNumber(e.target.value);
              if (p === "") {
                setField("lastDateToRegularise", "");
              } else {
                setField("lastDateToRegularise", Math.min(p, MAX_LAST_DATE_DAY));
              }
            }}
            onBlur={ensureLastDateOnBlur}
            disabled={isLoading || !form.allowRegularisation}
            sx={{ width: 160 }}
            slotProps={{
              htmlInput: { min: 1, max: MAX_LAST_DATE_DAY },
            }}
          />
        </Box>

        <Divider />

        {/* Max Days */}
        <Box>
          <Typography variant="body1" fontWeight={600} mb={0.5}>
            Maximum Days After Incident
          </Typography>

          <TextFieldElement
            type="number"
            label="Days"
            value={form.maxDaysAfterIncident}
            onChange={(e) =>
              setField("maxDaysAfterIncident", parsePositiveNumber(e.target.value))
            }
            disabled={isLoading || !form.allowRegularisation}
            sx={{ width: 160 }}
            slotProps={{
              htmlInput: { min: 1 },
            }}
          />
        </Box>
      </Stack>
    </ModalElement>
  );
}