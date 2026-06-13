import { useState, useEffect, useCallback, useMemo } from "react";
import { Box } from "@mui/material";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch";
import { useUpdateAttendanceMutation } from "../api/profile.api";
import { useGetShiftsQuery } from "../../../time/shifts/api/shifts.api";
import { useGetAllWeekOffsQuery } from "../../../time/weekoffs/api/weekoffs.api";
import { useGetLeavePlansQuery } from "../../../time/leaves/api/leavePlan.api";
import { useGetHolidayPlansQuery } from "../../../time/holiday-plan/api/holidayPlan.api";
import type { IAttendanceInformation } from "../types/profile.types";
import { buildModalSaveDisabledTooltip } from "../../../../../utils/modalSaveDisabled";

interface Props {
    open: boolean;
    onClose: () => void;
    data: IAttendanceInformation;
    employeeId: string;
    showMessage: (message: string, color: "success" | "error") => void;
}

export default function AttendanceInfoModal({ open, onClose, data, employeeId, showMessage }: Props) {
    const [isAttendanceEnabled, setIsAttendanceEnabled] = useState(false);
    const [form, setForm] = useState({ shiftId: "", weekoffId: "", leavePlanId: "", holidayPlanId: "" });

    // Fetch options
    const { data: shifts = [] } = useGetShiftsQuery();
    const { data: weekOffsResponse } = useGetAllWeekOffsQuery();
    const { data: leavePlans = [] } = useGetLeavePlansQuery();
    const { data: holidayPlans = [] } = useGetHolidayPlansQuery();
    const [updateAttendance, { isLoading }] = useUpdateAttendanceMutation();

    // Transform data for dropdowns
    const shiftOptions = useMemo(() => shifts.map(s => ({ label: s.shiftName, value: String(s.id) })), [shifts]);
    const weekOffOptions = useMemo(() => (weekOffsResponse?.data ?? []).map(w => ({ label: w.weekOffName, value: String(w.id) })), [weekOffsResponse]);
    const leavePlanOptions = useMemo(() => leavePlans.map(l => ({ label: l.name, value: String(l.id) })), [leavePlans]);
    const holidayPlanOptions = useMemo(() => holidayPlans.map(h => ({ label: h.planName, value: String(h.id) })), [holidayPlans]);
    const isShiftSelectionDisabled = useMemo(() => {
        const hasShiftId = data.shiftId != null && String(data.shiftId).trim() !== "";
        const hasShiftInfo = typeof data.shiftInfo === "string" && data.shiftInfo.trim() !== "";
        return hasShiftId || hasShiftInfo;
    }, [data.shiftId, data.shiftInfo]);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setForm({
                shiftId:
                    data.shiftId != null && String(data.shiftId) !== ""
                        ? String(data.shiftId)
                        : "",
                weekoffId:
                    data.weekoffId != null && String(data.weekoffId) !== ""
                        ? String(data.weekoffId)
                        : "",
                leavePlanId:
                    data.leavePlanId != null && String(data.leavePlanId) !== ""
                        ? String(data.leavePlanId)
                        : "",
                holidayPlanId:
                    data.holidayPlanId != null && String(data.holidayPlanId) !== ""
                        ? String(data.holidayPlanId)
                        : "",
            });
            setIsAttendanceEnabled(data.isAttendanceEnabled ?? true);
        }
    }, [open, data]);

    useEffect(() => {
        if (!open) return;
        if (!form.shiftId && data.shiftInfo && shiftOptions.length) {
            const match = shiftOptions.find((o) => o.label.toLowerCase() === data.shiftInfo.toLowerCase());
            if (match) setForm((prev) => ({ ...prev, shiftId: String(match.value) }));
        }
    }, [open, form.shiftId, data.shiftInfo, shiftOptions]);

    useEffect(() => {
        if (!open) return;
        if (!form.weekoffId && data.weekoffPolicy && weekOffOptions.length) {
            const match = weekOffOptions.find((o) => o.label.toLowerCase() === data.weekoffPolicy.toLowerCase());
            if (match) setForm((prev) => ({ ...prev, weekoffId: String(match.value) }));
        }
    }, [open, form.weekoffId, data.weekoffPolicy, weekOffOptions]);

    useEffect(() => {
        if (!open) return;
        if (!form.leavePlanId && data.leavePlan && leavePlanOptions.length) {
            const match = leavePlanOptions.find((o) => o.label.toLowerCase() === data.leavePlan.toLowerCase());
            if (match) setForm((prev) => ({ ...prev, leavePlanId: String(match.value) }));
        }
    }, [open, form.leavePlanId, data.leavePlan, leavePlanOptions]);

    useEffect(() => {
        if (!open) return;
        if (!form.holidayPlanId && data.holidayPlan && holidayPlanOptions.length) {
            const match = holidayPlanOptions.find((o) => o.label.toLowerCase() === data.holidayPlan.toLowerCase());
            if (match) setForm((prev) => ({ ...prev, holidayPlanId: String(match.value) }));
        }
    }, [open, form.holidayPlanId, data.holidayPlan, holidayPlanOptions]);

    const hasChanges = useMemo(() => {
        return (
            isAttendanceEnabled !== (data.isAttendanceEnabled ?? true) ||
            form.shiftId !== String(data.shiftId ?? "") ||
            form.weekoffId !== String(data.weekoffId ?? "") ||
            form.leavePlanId !== String(data.leavePlanId ?? "") ||
            form.holidayPlanId !== String(data.holidayPlanId ?? "")
        );
    }, [form, isAttendanceEnabled, data]);


    const set = useCallback(
        (field: keyof typeof form) => (value: string) =>
            setForm((prev) => ({ ...prev, [field]: value })),
        []
    );

    const handleSave = useCallback(async () => {
        try {
            const body: Record<string, any> = {
                isAttendanceEnabled
            };

            if (isAttendanceEnabled) {
                body.shiftId = form.shiftId ? Number(form.shiftId) : null;
                body.weekoffId = form.weekoffId ? Number(form.weekoffId) : null;
                body.leavePlanId = form.leavePlanId ? Number(form.leavePlanId) : null;
                body.holidayPlanId = form.holidayPlanId ? Number(form.holidayPlanId) : null;
            }

            await updateAttendance({ id: employeeId, body: body as any }).unwrap();
            showMessage("Attendance information updated successfully.", "success");
            onClose();
        } catch (error: any) {
            showMessage(error?.data?.message ?? error?.error ?? error?.message ?? "Failed to update attendance information.", "error");
        }
    }, [form, isAttendanceEnabled, employeeId, updateAttendance, onClose, showMessage]);

    const isSaveDisabled = isLoading || !hasChanges;
    const saveDisabledTooltip = useMemo(
        () =>
            buildModalSaveDisabledTooltip([
                isLoading && "Save is in progress.",
                !hasChanges && "Make a change before saving.",
            ]),
        [isLoading, hasChanges],
    );

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            title="Edit Attendance Information"
            maxWidth="md"
            onClick={handleSave}
            disabled={isSaveDisabled}
            disabledActionTooltip={saveDisabledTooltip}
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box>
                    <ToggleSwitch
                        label="Enable Attendance for this employee"
                        checked={isAttendanceEnabled}
                        onChange={(e) => setIsAttendanceEnabled(e.target.checked)}
                    />
                </Box>

                {isAttendanceEnabled && (
                    <>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                            <SingleSelectElement
                                label="Shift Type *"
                                options={shiftOptions}
                                value={form.shiftId}
                                onChange={set("shiftId")}
                                disabled={isShiftSelectionDisabled}
                                fullWidth
                            />
                            <SingleSelectElement
                                label="Week Off Policy *"
                                options={weekOffOptions}
                                value={form.weekoffId}
                                onChange={set("weekoffId")}
                                fullWidth
                            />
                            <SingleSelectElement
                                label="Leave Plan *"
                                options={leavePlanOptions}
                                value={form.leavePlanId}
                                onChange={set("leavePlanId")}
                                fullWidth
                            />
                        </Box>

                        <Box sx={{ width: "32%" }}> {/* Roughly 1/3 width to match grid */}
                            <SingleSelectElement
                                label="Holiday Plan *"
                                options={holidayPlanOptions}
                                value={form.holidayPlanId}
                                onChange={set("holidayPlanId")}
                                fullWidth
                            />
                        </Box>
                    </>
                )}
            </Box>
        </ModalElement>
    );
}
