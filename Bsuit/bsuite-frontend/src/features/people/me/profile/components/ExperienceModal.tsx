import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { DatePickerElement } from "../../../../../components/atom/date-picker/DatePicker";
import { RepeaterElement } from "../../../../../components/atom/form-repeater";
import { useUpdateExperienceMutation } from "../api/profile.api";
import type { IExperienceInformation } from "../types/profile.types";
import { buildModalSaveDisabledTooltip } from "../../../../../utils/modalSaveDisabled";
import dayjs from "dayjs";

interface Props {
    open: boolean;
    onClose: () => void;
    data: IExperienceInformation[];
    employeeId: string;
    showMessage: (message: string, color: "success" | "error") => void;
}

const EMPTY_EXPERIENCE_ROW: IExperienceInformation = {
    designation: "",
    companyName: "",
    startDate: "",
    endDate: "",
};

export default function ExperienceModal({ open, onClose, data, employeeId, showMessage }: Props) {
    const [rows, setRows] = useState<IExperienceInformation[]>([]);
    const [updateExperience, { isLoading }] = useUpdateExperienceMutation();

    useEffect(() => {
        if (open) {
            setRows(
                data.length > 0
                    ? data.map((d) => ({
                          designation: d.designation ?? "",
                          companyName: d.companyName ?? "",
                          startDate: d.startDate ?? "",
                          endDate: d.endDate ?? "",
                      }))
                    : [],
            );
        }
    }, [open, data]);

    const hasChanges = useMemo(() => {
        if (rows.length !== data.length) return true;
        return rows.some((row, i) => {
            const original = data[i];
            if (!original) return true;
            return (
                (row.designation ?? "") !== (original.designation ?? "") ||
                (row.companyName ?? "") !== (original.companyName ?? "") ||
                (row.startDate ?? "") !== (original.startDate ?? "") ||
                (row.endDate ?? "") !== (original.endDate ?? "")
            );
        });
    }, [rows, data]);

    const hasIncompleteRows = useMemo(
        () =>
            rows.some(
                (row) =>
                    !(row.designation ?? "").trim() ||
                    !(row.companyName ?? "").trim() ||
                    !(row.startDate ?? "").trim() ||
                    !(row.endDate ?? "").trim(),
            ),
        [rows],
    );

    const isSaveDisabled = isLoading || !hasChanges || hasIncompleteRows;

    const saveDisabledTooltip = useMemo(
        () =>
            buildModalSaveDisabledTooltip([
                isLoading && "Save is in progress.",
                !hasChanges && "Make a change before saving.",
                hasIncompleteRows &&
                    "Complete designation, company name, start date, and end date for each experience row.",
            ]),
        [isLoading, hasChanges, hasIncompleteRows],
    );

    const handleSave = useCallback(async () => {
        const hasInvalidDateRange = rows.some((row) => {
            const start = dayjs(row.startDate);
            const end = dayjs(row.endDate);
            return start.isValid() && end.isValid() && end.isBefore(start, "day");
        });
        if (hasInvalidDateRange) {
            showMessage("End date cannot be before start date.", "error");
            return;
        }

        try {
            const normalize = (value: string | undefined) => (value ?? "").trim();
            const experiences = rows.map((rest) => ({
                designation: normalize(rest.designation),
                companyName: normalize(rest.companyName),
                startDate: normalize(rest.startDate),
                endDate: normalize(rest.endDate),
            }));
            await updateExperience({ id: employeeId, body: { experiences } }).unwrap();
            showMessage("Experience details updated successfully.", "success");
            onClose();
        } catch (error: any) {
            const rawMessage = error?.data?.message ?? error?.error ?? error?.message ?? "";
            const message =
                typeof rawMessage === "string" &&
                rawMessage.toLowerCase().includes("end date cannot be before start date")
                    ? "End date cannot be before start date."
                    : rawMessage || "Failed to update experience details.";
            showMessage(message, "error");
        }
    }, [rows, employeeId, updateExperience, onClose, showMessage]);

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            title="Edit Experience Information"
            maxWidth="md"
            onClick={handleSave}
            disabled={isSaveDisabled}
            disabledActionTooltip={saveDisabledTooltip}
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                
                {/* <Box
                    display="grid"
                    gridTemplateColumns="1fr 1fr 1fr 1fr 40px"
                    gap={2}
                    sx={{ pr: 0.5 }}
                >
                    
                    <Typography variant="subtitle2">Designation *</Typography>
                    <Typography variant="subtitle2">Company Name *</Typography>
                    <Typography variant="subtitle2">Start Date *</Typography>
                    <Typography variant="subtitle2">End Date *</Typography>
                    
                    
                </Box> */}
                

                <RepeaterElement<IExperienceInformation>
                    label="Experience"
                    items={rows}
                    setItems={setRows}
                    initialItem={EMPTY_EXPERIENCE_ROW}
                    minItems={0}
                    boxed={false}
                    gap={2}
                    renderItem={(item, _index, onChange) => (
                        <>
                            <TextFieldElement
                                label="Designation"
                                fullWidth
                                value={item.designation ?? ""}
                                onChange={(e) => onChange("designation", e.target.value)}
                                sx={{ flex: 1, minWidth: 0 }}
                            />
                            <TextFieldElement
                                label="Company Name"
                                fullWidth
                                value={item.companyName ?? ""}
                                onChange={(e) => onChange("companyName", e.target.value)}
                                sx={{ flex: 1, minWidth: 0 }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <DatePickerElement
                                    label="Start Date"
                                    value={item.startDate ? dayjs(item.startDate) : null}
                                    onChange={(newValue) =>
                                        onChange("startDate", newValue ? newValue.format("YYYY-MM-DD") : "")
                                    }
                                    width="100%"
                                />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <DatePickerElement
                                    label="End Date "
                                    value={item.endDate ? dayjs(item.endDate) : null}
                                    onChange={(newValue) =>
                                        onChange("endDate", newValue ? newValue.format("YYYY-MM-DD") : "")
                                    }
                                    width="100%"
                                />
                            </Box>
                        </>
                    )}
                />

                {rows.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        No experience entries. Click Add to begin.
                    </Typography>
                )}
            </Box>
        </ModalElement>
    );
}
