import { useEffect, useState } from "react";
import { Typography, Radio, RadioGroup, FormControlLabel, Box, Stack, Checkbox } from "@mui/material";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { DatePickerElement } from "../../../../../../components/atom/date-picker";

import type { Dayjs } from "dayjs";
import type { InitiateExitDto } from "../api/directory.api";
import { usePeopleContext } from "../../context/PeopleContext";

type InitiateExitFormState = Omit<
    InitiateExitDto,
    "exitInitiatedDate" | "lastWorkingDate" | "initiateExitBy"
> & {
    initiateExitBy: InitiateExitDto["initiateExitBy"] | "";
    exitInitiatedDate: Dayjs | null;
    lastWorkingDate: Dayjs | null;
};

const INITIAL_FORM: InitiateExitFormState = {
    initiateExitBy: "",
    reasonForExit: "",
    exitInitiatedDate: null,
    lastWorkingDate: null,
    comments: "",
};

export const CompanyterminationReasons = [
    { label: "Absconding", value: "absconding" },
    { label: "Death", value: "death" },
    { label: "Lay off", value: "lay_off" },
    { label: "Medical Condition", value: "medical_condition" },
    { label: "Misconduct", value: "misconduct" },
    { label: "Performance Issue", value: "performance_issue" },
    { label: "Unsuccessfull Probation", value: "unsuccessfull_probation" },
];

export const EmployeeTerminationReasons = [
    { label: "Resignation", value: "resignation" },
    { label: "Retirement", value: "retirement" },
    { label: "Relocating", value: "relocating" },
    { label: "Personal reasons", value: "personal_reasons" },
    { label: "Other Job Oppurtunities", value: "other_job_oppurtunities" },
    { label: "Higher Education", value: "higher_education" },
    { label: "Explore Other Careers", value: "explore_other_careers" },
    { label: "Start Their Own Business", value: "start_their_own_business" },
    { label: "Other", value: "other" },
];

export const InitiateExitModal = ({
    open,
    onClose,
    onConfirm,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: InitiateExitDto) => void;
}) => {
    const { noticePeriod } = usePeopleContext();

    const [form, setForm] = useState<InitiateExitFormState>(INITIAL_FORM);
    // const [useNoticePeriod, setUseNoticePeriod] = useState(true);

    const noticePeriodMonths = Number(noticePeriod?.data?.duration) || 0;

    const suggestedLastWorkingDate: Dayjs | null = form.exitInitiatedDate && noticePeriodMonths
        ? form.exitInitiatedDate.add(noticePeriodMonths, "month")
        : null;

    // Derives lastWorkingDate from exitInitiatedDate + notice period config
    // const applyNoticePeriod = (initiatedDate: Dayjs | null) => {
    //     if (initiatedDate && noticePeriodMonths) {
    //         const calculated = initiatedDate.add(noticePeriodMonths, "month");
    //         setForm((prev) => ({ ...prev, lastWorkingDate: calculated }));
    //     }
    // };

    // Recalculate whenever exitInitiatedDate or notice duration changes (only if checkbox is on)
    // useEffect(() => {
    //     if (useNoticePeriod) {
    //         applyNoticePeriod(form.exitInitiatedDate);
    //     }
    // }, [form.exitInitiatedDate, noticePeriod?.data?.duration]);

    // When checkbox is re-enabled, immediately recalculate from notice config
    // const handleNoticePeriodToggle = (checked: boolean) => {
    //     setUseNoticePeriod(checked);
    //     if (checked) {
    //         applyNoticePeriod(form.exitInitiatedDate);
    //     }
    // };

    useEffect(() => {
        if (open) setForm(INITIAL_FORM);
    }, [open]);

    const handleChange = (key: keyof InitiateExitFormState, value: string | Dayjs | null) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleClose = () => {
        setForm(INITIAL_FORM);
        // setUseNoticePeriod(true);
        onClose();
    };

    const handleSubmit = () => {
        if (!form.initiateExitBy) return;
        onConfirm({
            initiateExitBy: form.initiateExitBy,
            reasonForExit: form.reasonForExit,
            comments: form.comments,
            exitInitiatedDate: form.exitInitiatedDate?.format("YYYY-MM-DD") ?? "",
            lastWorkingDate: form.lastWorkingDate
                ? form.lastWorkingDate.format("YYYY-MM-DD")
                : "",
        });
    };

    const isCompany = form.initiateExitBy === "company";

    const isDisabled =
        !form.initiateExitBy ||
        !form.exitInitiatedDate ||
        !form.comments ||
        !form.reasonForExit;

    return (
        <ModalElement
            open={open}
            onClose={handleClose}
            maxWidth="md"
            title="Initiate Exit for Employee"
            sx={{
                height: 600,
                "& .MuiDialog-paper": {
                    overflow: "hidden",
                },
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Box
                    sx={{
                        flex: 1,
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                    }}
                >
                    <Stack spacing={3}>

                        <Typography variant="subtitle1">
                            Reason for initiating the exit
                        </Typography>

                        <RadioGroup
                            row
                            value={form.initiateExitBy || ""}
                            onChange={(e) => {
                                setForm((prev) => ({
                                    ...prev,
                                    initiateExitBy: e.target.value as InitiateExitFormState["initiateExitBy"],
                                    reasonForExit: "",
                                }));
                            }}
                        >
                            <FormControlLabel
                                value="employee"
                                control={<Radio />}
                                label="Employee wants to resign"
                            />
                            <FormControlLabel
                                value="company"
                                control={<Radio />}
                                label="Company decides to terminate"
                            />
                        </RadioGroup>

                        <Box>
                            <SingleSelectElement
                                label={
                                    !form.initiateExitBy
                                        ? "Reason for exit"
                                        : isCompany
                                        ? "Reason for termination "
                                        : "Reason for resignation "
                                }
                                options={
                                    !form.initiateExitBy
                                        ? []
                                        : isCompany
                                        ? CompanyterminationReasons
                                        : EmployeeTerminationReasons
                                }
                                value={form.reasonForExit}
                                onChange={(v) => handleChange("reasonForExit", v as string)}
                                required
                                disabled={!form.initiateExitBy}
                                width="50%"
                            />
                        </Box>

                        <Stack direction="row" spacing={2}>
                            <DatePickerElement
                                label="Exit Initiated date"
                                required
                                value={form.exitInitiatedDate}
                                onChange={(v) => {
                                    setForm((prev) => ({
                                        ...prev,
                                        exitInitiatedDate: v,
                                        lastWorkingDate: null,
                                    }));
                                }}
                                width="50%"
                            />

                            <Box sx={{ width: "50%", display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <DatePickerElement
                                    label="Last Working date"
                                    value={form.lastWorkingDate}
                                    onChange={(v) => handleChange("lastWorkingDate", v)}
                                    width="100%"
                                    required
                                />

                                {suggestedLastWorkingDate && (
                                    <Typography variant="caption" color="text.secondary">
                                        Suggested last working date as per notice period policy: {" "}
                                        {/* (
                                        {noticePeriodMonths} month{noticePeriodMonths !== 1 ? "s" : ""}
                                        ):  */}
                                        {suggestedLastWorkingDate.format("MMM DD, YYYY")}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>

                        <TextFieldElement
                            label="Comments"
                            required
                            multiline
                            rows={4}
                            fullWidth
                            value={form.comments}
                            onChange={(e) => handleChange("comments", e.target.value)}
                        />
                    </Stack>
                </Box>

                {/* FOOTER */}
                <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
                    <PrimaryButton onClick={handleSubmit} disabled={isDisabled}>
                        Save
                    </PrimaryButton>
                </Box>
            </Box>
        </ModalElement>
    );
};