import { useState, useEffect, useCallback, useMemo } from "react";
import { Box } from "@mui/material";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { useUpdatePayrollMutation } from "../api/profile.api";
import { useGetAllSalaryTemplatesQuery } from "../../../salary/structure/SalaryTemplate/api/salaryTemplate.api";
import { useGetIncomeTaxesQuery } from "../../../salary/payrun/settings/IncomeTax/api/incometax.api";
import type { IPayrollInformation } from "../types/profile.types";
import { buildModalSaveDisabledTooltip } from "../../../../../utils/modalSaveDisabled";

// ── Input formatters (same pattern as AddEmployee) ──────────────────────────
/** UAN: digits only, max 12 */
function formatUAN(input: string): string {
    return input.replace(/\D/g, "").slice(0, 12);
}

/** PF account number: AA/AAA/1234567/890/8765432 — letters then digits per segment */
const PF_ACCOUNT_LENGTHS = [2, 3, 7, 3, 7] as const;
const PF_ACCOUNT_PLACEHOLDER = "AA/AAA/1234567/890/8765432";
const PF_ACCOUNT_MAX_LEN = (PF_ACCOUNT_LENGTHS as readonly number[]).reduce((a, b) => a + b, 0);

function formatPFAccountNumber(input: string): string {
    const raw = input.replace(/\//g, "").slice(0, PF_ACCOUNT_MAX_LEN);
    let pos = 0;
    const parts: string[] = [];
    for (let seg = 0; seg < PF_ACCOUNT_LENGTHS.length; seg++) {
        const len = PF_ACCOUNT_LENGTHS[seg];
        const segRaw = raw.slice(pos, pos + len);
        const isLetterSeg = seg < 2;
        const part = isLetterSeg
            ? segRaw.replace(/[^a-zA-Z]/g, "").toUpperCase()
            : segRaw.replace(/[^0-9]/g, "");
        parts.push(part.slice(0, len));
        pos += len;
    }
    return parts.filter(Boolean).join("/");
}

/** Strip slashes before sending to API */
function normalizePFForApi(pf: string): string {
    return pf.replace(/\//g, "").toUpperCase();
}

// ── Validation ─────────────────────────────────────────────────────────────
const UAN_REGEX = /^\d{12}$/;
const PF_BACKEND_REGEX = /^[A-Z]{2}[A-Z]{3,5}\d{7}\d{0,3}\d{7}$/;

function validatePayrollField(field: string, value: string): string {
    if (field === "uanNumber" && value && !UAN_REGEX.test(value))
        return "UAN must be exactly 12 digits";
    if (field === "pfNumber" && value) {
        const normalized = normalizePFForApi(value);
        if (!PF_BACKEND_REGEX.test(normalized))
            return "Invalid PF format — use: AA/AAA/1234567/890/8765432";
    }
    return "";
}

interface Props {
    open: boolean;
    onClose: () => void;
    data: IPayrollInformation;
    employeeId: string;
    showMessage: (message: string, color: "success" | "error") => void;
}

export default function PayrollInfoModal({ open, onClose, data, employeeId, showMessage }: Props) {
    const [isPayrollEnabled, setIsPayrollEnabled] = useState(false);
    const [salaryTemplateId, setSalaryTemplateId] = useState("");
    const [incomeTaxConfigId, setIncomeTaxConfigId] = useState("");

    const [form, setForm] = useState({ uanNumber: "", pfNumber: "", pfEnabled: false });
    const [payrollErrors, setPayrollErrors] = useState<{ uanNumber?: string; pfNumber?: string }>({});
    const hasPayrollErrors = useMemo(() => Object.values(payrollErrors).some(Boolean), [payrollErrors]);

    // Fetch Lists
    const { data: salaryTemplatesResponse } = useGetAllSalaryTemplatesQuery();
    const { data: incomeTaxResponse = [] } = useGetIncomeTaxesQuery();

    const [updatePayroll, { isLoading }] = useUpdatePayrollMutation();

    const salaryTemplateOptions = useMemo(
        () =>
            (salaryTemplatesResponse?.data ?? []).map((t) => ({
                label: t.templateName,
                value: String(t.id),
            })),
        [salaryTemplatesResponse]
    );

    // IncomeTax API returns versions. We need typically the latest or Active one, but let's list all unique Config Names or just list them.
    // The AddEmployeePage uses `useGetAllIncomeTaxConfigsQuery` which I didn't see in the search results earlier, 
    // but I found `useGetIncomeTaxesQuery` returning `IncomeTaxVersion[]`.
    // Let's map versions to options.
    const incomeTaxOptions = useMemo(() =>
        incomeTaxResponse.map(t => ({ label: t.config.configName, value: String(t.config.id) }))
        // deduplicating might be needed if multiple versions of same config exist, but for now map all.
        , [incomeTaxResponse]);

    useEffect(() => {
        if (open) {
            console.log(data, incomeTaxResponse?.find((i) => i.config?.configName == data?.incomeTaxConfig));
            setPayrollErrors({});
            setForm({

                uanNumber: data.uanNumber ?? "",
                pfNumber: data.pfNumber ?? "",
                pfEnabled: data.pfEnabled ?? false,
            });
            setIsPayrollEnabled(data.isPayrollEnabled ?? true);
            setSalaryTemplateId(
                data.salaryTemplateId != null && String(data.salaryTemplateId) !== ""
                    ? String(data.salaryTemplateId)
                    : ""
            );
            setIncomeTaxConfigId(
                data.incomeTaxConfigId != null && String(data.incomeTaxConfigId) !== ""
                    ? String(data.incomeTaxConfigId)
                    : ""
            );
        }
    }, [open, data]);

    useEffect(() => {
        if (!open) return;
        const tplName = data.salaryTemplateName;
        if (!salaryTemplateId && tplName && salaryTemplateOptions.length) {
            const match = salaryTemplateOptions.find(
                (o) => o.label.toLowerCase() === tplName.toLowerCase()
            );
            
            if (match) setSalaryTemplateId(String(match.value));
        }
    }, [open, salaryTemplateId, data.salaryTemplateName, salaryTemplateOptions]);

    useEffect(() => {
        if (!open) return;
        if (!incomeTaxConfigId && data.incomeTaxConfig && incomeTaxOptions.length) {
            const match = incomeTaxOptions.find(
                (o) => o.label.toLowerCase() === data.incomeTaxConfig.toLowerCase()
            );
            if (match) setIncomeTaxConfigId(String(match.value));
        }
    }, [open, incomeTaxConfigId, data.incomeTaxConfig, incomeTaxOptions]);

    const hasChanges = useMemo(() => {
        // Since we don't have initial IDs, and we default to empty, a true dirty check is hard without ID presence in data.
        // However, we can check if fields are modified from their initial empty state OR if they differ from what *might* be in data if data had them.
        // But data doesn't have IDs. 
        // So practically, if the user interacts, it's a change. 
        // But let's at least check the scalar values we do have.
        const isFormChanged =
            form.uanNumber !== (data.uanNumber ?? "") ||
            form.pfNumber !== (data.pfNumber ?? "") ||
            form.pfEnabled !== (data.pfEnabled ?? false);

        const isPayrollChanged = isPayrollEnabled !== (data.isPayrollEnabled ?? true);
        const isIdsChanged =
            salaryTemplateId !== String(data.salaryTemplateId ?? "") ||
            incomeTaxConfigId !== String(data.incomeTaxConfigId ?? "");

        return isFormChanged || isPayrollChanged || isIdsChanged;
    }, [form, data, isPayrollEnabled, salaryTemplateId, incomeTaxConfigId]);

    const canSave = useMemo(() => {
        if (!hasChanges) return false;
        if (hasPayrollErrors) return false;

        if (isPayrollEnabled) {
            if (!salaryTemplateId || !incomeTaxConfigId) return false;

            if (form.pfEnabled) {
                if (!form.uanNumber.trim() || !form.pfNumber.trim()) return false;
                if (
                    validatePayrollField("uanNumber", form.uanNumber) ||
                    validatePayrollField("pfNumber", form.pfNumber)
                ) {
                    return false;
                }
            }
        }

        return true;
    }, [
        hasChanges,
        hasPayrollErrors,
        isPayrollEnabled,
        salaryTemplateId,
        incomeTaxConfigId,
        form.pfEnabled,
        form.uanNumber,
        form.pfNumber,
    ]);


    const set = useCallback(
        (field: "uanNumber" | "pfNumber") =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                // Use formatters so invalid chars simply don't register (same as AddEmployee)
                const value = field === "uanNumber"
                    ? formatUAN(e.target.value)
                    : formatPFAccountNumber(e.target.value);
                setForm((prev) => ({ ...prev, [field]: value }));
                setPayrollErrors((prev) => ({ ...prev, [field]: validatePayrollField(field, value) }));
            },
        []
    );

    const handleSave = useCallback(async () => {
        if (isPayrollEnabled && (!salaryTemplateId || !incomeTaxConfigId)) {
            showMessage("Salary template and income tax config are required.", "error");
            return;
        }

        if (form.pfEnabled) {
            const uanErr = validatePayrollField("uanNumber", form.uanNumber);
            const pfErr = validatePayrollField("pfNumber", form.pfNumber);
            if (uanErr || pfErr) {
                setPayrollErrors({ uanNumber: uanErr, pfNumber: pfErr });
                showMessage(uanErr || pfErr, "error");
                return;
            }
        }

        try {
            const toNull = (value: string) => {
                const trimmed = value.trim();
                return trimmed === "" ? null : trimmed;
            };
            const body: Record<string, any> = { isPayrollEnabled };

            if (isPayrollEnabled) {
                body.salaryTemplateId = salaryTemplateId ? Number(salaryTemplateId) : null;
                body.incomeTaxConfigId = incomeTaxConfigId ? Number(incomeTaxConfigId) : null;

                body.isPfEnabled = form.pfEnabled;
                if (form.pfEnabled) {
                    // Normalize PF number (strip slashes) before sending to API
                    body.pfAccNumber = toNull(form.pfNumber) ? normalizePFForApi(form.pfNumber) : null;
                    body.uan = toNull(form.uanNumber);
                }
            }

            await updatePayroll({ id: employeeId, body: body as any }).unwrap();
            showMessage("Payroll information updated successfully.", "success");
            onClose();
        } catch (error: any) {
            showMessage(error?.data?.message ?? error?.error ?? error?.message ?? "Failed to update payroll information.", "error");
        }
    }, [form, isPayrollEnabled, salaryTemplateId, incomeTaxConfigId, employeeId, updatePayroll, onClose, showMessage]);

    const isSaveDisabled = isLoading || !canSave;
    const saveDisabledTooltip = useMemo(
        () =>
            buildModalSaveDisabledTooltip([
                isLoading && "Save is in progress.",
                !hasChanges && "Make a change before saving.",
                hasPayrollErrors &&
                    (payrollErrors.uanNumber ||
                        payrollErrors.pfNumber ||
                        "Fix validation errors before saving."),
                isPayrollEnabled && !salaryTemplateId && "Salary template is required when payroll is enabled.",
                isPayrollEnabled && !incomeTaxConfigId && "Income tax config is required when payroll is enabled.",
                isPayrollEnabled &&
                    form.pfEnabled &&
                    !form.uanNumber.trim() &&
                    "UAN number is required when PF is enabled.",
                isPayrollEnabled &&
                    form.pfEnabled &&
                    !form.pfNumber.trim() &&
                    "PF account number is required when PF is enabled.",
            ]),
        [
            isLoading,
            hasChanges,
            hasPayrollErrors,
            payrollErrors,
            isPayrollEnabled,
            salaryTemplateId,
            incomeTaxConfigId,
            form.pfEnabled,
            form.uanNumber,
            form.pfNumber,
        ],
    );

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            title="Edit Payroll Information"
            maxWidth="sm"
            onClick={handleSave}
            disabled={isSaveDisabled}
            disabledActionTooltip={saveDisabledTooltip}
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box>
                    <ToggleSwitch
                        label="Enable Payroll for this employee"
                        checked={isPayrollEnabled}
                        onChange={(e) => setIsPayrollEnabled(e.target.checked)}
                    />
                </Box>

                {isPayrollEnabled && (
                    <>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                            <SingleSelectElement
                                label="Salary Template Name *"
                                options={salaryTemplateOptions}
                                value={salaryTemplateId}
                                onChange={setSalaryTemplateId}
                                fullWidth
                            />
                            <SingleSelectElement
                                label="Income Tax Config *"
                                options={incomeTaxOptions}
                                value={incomeTaxConfigId}
                                onChange={setIncomeTaxConfigId}
                                fullWidth
                            />
                        </Box>

                        {/* PF Section - Optional/Additional */}
                        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #eee" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                <ToggleSwitch
                                    label="Enable PF"
                                    checked={form.pfEnabled}
                                    onChange={(e) => setForm((prev) => ({ ...prev, pfEnabled: e.target.checked }))}
                                />
                            </Box>
                            {form.pfEnabled && (
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                    <TextFieldElement
                                        label="UAN Number" fullWidth value={form.uanNumber} onChange={set("uanNumber")}
                                        placeholder="12-digit UAN"
                                        slotProps={{ htmlInput: { maxLength: 12, inputMode: "numeric" } }}
                                        error={!!payrollErrors.uanNumber} helperText={payrollErrors.uanNumber}
                                    />
                                    <TextFieldElement
                                        label="PF Account Number" fullWidth value={form.pfNumber} onChange={set("pfNumber")}
                                        placeholder={PF_ACCOUNT_PLACEHOLDER}
                                        error={!!payrollErrors.pfNumber} helperText={payrollErrors.pfNumber || "e.g. AA/AAA/1234567/890/8765432"}
                                    />
                                </Box>
                            )}
                        </Box>
                    </>
                )}
            </Box>
        </ModalElement>
    );
}
