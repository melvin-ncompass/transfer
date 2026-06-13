import { Stack } from "@mui/system";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { RadioButton } from "../../../../../components/atom/radio-button";
import { DatePickerElement } from "../../../../../components/atom/date-picker";
import { PrimaryButton, PrimaryIconButton } from "../../../../../components/atom/button";
import dayjs, { type Dayjs } from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import {
  useCreateLeaveTypeMutation,
  useGetLeaveTypesQuery,
  type LeaveType,
} from "../api/leaveType.api";
import { MultiSelectElement } from "../../../../../components/atom/select-field/MultiSelect";
import {
  LeaveCalenderEnum,
  type CreateUpdateLeavePlanRequest,
  type LeavePlanType,
} from "../api/leavePlan.api";
import { LeaveTypeModal } from "./LeaveTypesModal";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { Tooltip } from "../../../../../components/atom/tooltip";

export const LeavePlanModal = ({
  open,
  onClose,
  isEdit,
  onSave,
  editRow,
  isLoadingData,
}: {
  open: boolean;
  onClose: () => void;
  isLoadingData: boolean;
  isEdit: boolean;
  onSave: (data: Partial<CreateUpdateLeavePlanRequest>) => void;
  editRow?: LeavePlanType | null;
}) => {
  const [leavePlanName, setLeavePlanName] = useState<string>("");
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<string[]>([]);
  const [calendarType, setCalendarType] = useState<"specific" | "joining">("joining");
  const [calendarMonth, setCalendarMonth] = useState<Dayjs | null>(null);
  const [openTypeModal, setOpenTypeModal] = useState<boolean>(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: string;
  }>({
    open: false,
    message: "",
    color: "",
  });

  const { data: leaveTypeData, isLoading } = useGetLeaveTypesQuery();
  const [createLeaveType, { isLoading: isCreateLoading }] =
    useCreateLeaveTypeMutation();

  const leaveTypeOptions =
    leaveTypeData?.map((leaveType) => ({
      value: String(leaveType.id),
      label: leaveType.leaveName,
      type: leaveType.leaveType,
    })) ?? [];

  useEffect(() => {
    if (isEdit && editRow) {
      setLeavePlanName(editRow.name);

      const leaveIds = editRow.LeavePlanDetails.map((detail) =>
        String(detail.leaveType.id)
      );
      setSelectedLeaveTypes(leaveIds);

      if (
        editRow.leaveCalendarType ===
        LeaveCalenderEnum.PARTICULAR_MONTH
      ) {
        setCalendarType("specific");
        setCalendarMonth(
          editRow.calendarMonth ? dayjs(editRow.calendarMonth) : null
        );
      } else {
        setCalendarType("joining");
        setCalendarMonth(null);
      }
    } else {
      setLeavePlanName("");
      setSelectedLeaveTypes([]);
      setCalendarType("joining");
      setCalendarMonth(null);
    }
  }, [isEdit, editRow, open]);

  const handleChangeCalendarType = (value: "specific" | "joining") => {
    setCalendarType(value);
  };

  const handleSave = () => {
    const payload: Partial<CreateUpdateLeavePlanRequest> = {
      name: leavePlanName,
      leaveTypes: selectedLeaveTypes.map((id) => Number(id)),
      leaveCalendarType:
        calendarType === "specific"
          ? LeaveCalenderEnum.PARTICULAR_MONTH
          : LeaveCalenderEnum.EMPLOYEE_JOINING_DATE,
      calendarMonth:
        calendarType === "specific" && calendarMonth
          ? calendarMonth.format("YYYY-MM-DD")
          : null,
    };

    onSave(payload);
  };

  // ---- DUPLICATE TYPE VALIDATION ----
  const RESTRICTED_DUPLICATE_TYPES = ["unpaid", "compoff"]; // example categories that shouldn't have duplicates

  const selectedLeaveTypeObjects = leaveTypeOptions.filter((opt) =>
    selectedLeaveTypes.includes(opt.value)
  );

  // only consider restricted types for duplicate validation
  const restrictedTypes = selectedLeaveTypeObjects.filter((opt) =>
    RESTRICTED_DUPLICATE_TYPES.includes(opt.type)
  );

  const leaveTypeCountMap = restrictedTypes.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hasDuplicateLeaveCategory = Object.values(leaveTypeCountMap).some(
    (count) => count > 1
  );
  const duplicateTooltipMessage =
    "You cannot select multiple leave types of the same category (e.g. Unpaid or Compoff).";

  // ---- INITIAL DATA CHECK ----
  const isDataSameAsInitial =
    isEdit && editRow
      ? leavePlanName === editRow.name &&
      JSON.stringify([...selectedLeaveTypes].sort()) ===
      JSON.stringify(
        editRow.LeavePlanDetails.map((d) =>
          String(d.leaveType.id)
        ).sort()
      ) &&
      ((calendarType === "specific" &&
        editRow.leaveCalendarType ===
        LeaveCalenderEnum.PARTICULAR_MONTH) ||
        (calendarType === "joining" &&
          editRow.leaveCalendarType ===
          LeaveCalenderEnum.EMPLOYEE_JOINING_DATE)) &&
      (calendarType === "specific"
        ? calendarMonth?.format("YYYY-MM-DD") ===
        editRow.calendarMonth
        : true)
      : false;

  const handleLeaveTypeSave = async (data: LeaveType) => {
    try {
      const newLeaveType = await createLeaveType(data).unwrap();

      setSnackbar({
        open: true,
        message: "Leave type created successfully",
        color: "success",
      });

      setSelectedLeaveTypes((prev) => [
        ...prev,
        String(newLeaveType.id),
      ]);

      setOpenTypeModal(false);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.data.message || "Failed to save leave type",
        color: "error",
      });
    }
  };

  const isSaveDisabled =
    !leavePlanName ||
    selectedLeaveTypes.length === 0 ||
    (calendarType === "specific" && !calendarMonth) ||
    isDataSameAsInitial ||
    hasDuplicateLeaveCategory;

  return (
    <>
      <ModalElement
        maxWidth="md"
        open={open}
        height={800}
        title={isEdit ? "Edit Leave Plan" : "Create Leave Plan"}
        onClose={onClose}
        sx={{
          "& .MuiDialog-paper": {
            width: { xs: "90vw", sm: 500, md: 800 },
            margin: 2,
          },
        }}
      >
        <Stack spacing={4} sx={{ p: 2 }}>
          <Stack spacing={2} gap={3} direction="row">
            <TextFieldElement
              label="Leave Plan Name"
              placeholder="Enter Leave Plan Name"
              required
              value={leavePlanName}
              onChange={(e) => setLeavePlanName(e.target.value)}
              sx={{
                flex: 1,
                "& .MuiInputBase-input": { textAlign: "left" },
              }}
              slotProps={{
                htmlInput: {
                  maxLength: 50,
                },
              }}
            />

            <Stack
              direction="row"
              alignItems="center"
              gap={0.5}
              sx={{ flex: 1 }}
            >
              <MultiSelectElement
                label="Leave Types"
                required
                value={selectedLeaveTypes}
                options={leaveTypeOptions}
                onChange={(value) =>
                  setSelectedLeaveTypes(value)
                }
                sx={{ flex: 1 }}
              />

              <PrimaryIconButton
                variant="outlined"
                icon={<AddIcon />}
                onClick={() => setOpenTypeModal(true)}
                title="Add Leave Type"
              />
            </Stack>
          </Stack>

          <Box>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              mb={2}
            >
              Leave calender year under this plan<sup>*</sup>
            </Typography>

            <Stack direction="row" gap={2} alignItems="center">
              <RadioButton
                label="Starts from a specific date"
                name="calendarType"
                value="specific"
                checked={calendarType === "specific"}
                onChange={() =>
                  handleChangeCalendarType("specific")
                }
              />

              {calendarType === "specific" && (
                <DatePickerElement
                  label="Select date"
                  value={calendarMonth}
                  onChange={setCalendarMonth}
                />
              )}
            </Stack>

            <RadioButton
              label="Same as joining date"
              name="calendarType"
              value="joining"
              checked={calendarType === "joining"}
              onChange={() =>
                handleChangeCalendarType("joining")
              }
            />
          </Box>
        </Stack>

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}
        >
          <Tooltip
            title={
              hasDuplicateLeaveCategory
                ? duplicateTooltipMessage
                : ""
            }
            arrow
          >
            <span>
              <PrimaryButton
                onClick={handleSave}
                disabled={
                  isSaveDisabled || isLoading || isLoadingData
                }
              >
                Save
              </PrimaryButton>
            </span>
          </Tooltip>
        </Box>

        <LeaveTypeModal
          isLoading={isCreateLoading}
          open={openTypeModal}
          onClose={() => setOpenTypeModal(false)}
          onSave={handleLeaveTypeSave}
          isEdit={false}
        />
      </ModalElement>

      {snackbar.open && (
        <Snackbar
          onClose={() =>
            setSnackbar({
              open: false,
              message: "",
              color: "",
            })
          }
          message={snackbar.message}
          color={snackbar.color as any}
        />
      )}
    </>
  );
};