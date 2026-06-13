import { useEffect, useRef, useState } from "react";
import {
    Box, Card, CardContent, CardHeader, Collapse, Divider,
    IconButton, Table, TableBody, TableCell, TableHead,
    TableRow, TextField, Tooltip, Typography, Chip, Button, Alert,
} from "@mui/material";
import { Stack } from "@mui/system";
import {
    CheckCircle, Error as ErrorIcon, ExpandMore, ExpandLess,
    Warning, CheckCircleOutline, DragIndicator,
} from "@mui/icons-material";
import { useValidateSalaryTemplatesMutation } from "../api/salaryTemplate.api";
import { parseValidationMessages } from "./ImportSalaryTemplate";
import type { ISalaryTemplateItem, ParsedValidationError } from "./ImportSalaryTemplate";
import { formatNumberForTyping, parseNumberForTyping } from "../../../../../../utils/numberFormatter";
import { useSnackbar } from "../../../../../../context/SnackbarContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TemplateValidationError {
    templateName: string;
    // key = bracket-notation path e.g. "earnings[0].monthlyAmount"
    // value = array of error messages for that field
    fields: Record<string, string[]>;
}

interface Props {
    uploadedData: ISalaryTemplateItem[];
    initialErrors: ParsedValidationError[];
    onConfirm: (templates: ISalaryTemplateItem[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toSalaryTemplateRequest = (items: ISalaryTemplateItem[]) =>
    items.map((item) => ({
        ...item,
        annualGross: String(item.annualGross),
        monthlyGross: String(item.monthlyGross),
        // payslipOrder is derived from array position (1-based)
        earnings: item.earnings.map((e: any, idx: number) => ({
            ...e,
            monthlyAmount: String(e.monthlyAmount),
            payslipOrder: idx + 1,
        })),
        deductions: item.deductions.map((d: any, idx: number) => ({
            ...d,
            monthlyAmount: String(d.monthlyAmount),
            payslipOrder: idx + 1,
        })),
    })) as unknown as any[];

/** Convert dot-notation path → bracket-notation path for API field key lookup.
 *  e.g. "earnings.0.monthlyAmount" → "earnings[0].monthlyAmount"
 */
const dotToBracket = (path: string): string =>
    path.replace(/\.(\d+)\./g, "[$1].").replace(/\.(\d+)$/, "[$1]");

/** Get all error messages for a field from TemplateValidationError.fields. */
const getTemplateFieldErrors = (
    templateErrors: TemplateValidationError[],
    templateName: string,
    dotPath: string
): string[] => {
    const te = templateErrors.find((e) => e.templateName === templateName);
    if (!te) return [];
    const bracketPath = dotToBracket(dotPath);
    return te.fields[bracketPath] ?? [];
};

/** Get field-level errors from the import/parse step (ParsedValidationError[]). */
const getFieldError = (
    fieldErrors: ParsedValidationError[],
    templateIndex: number,
    path: string
) => fieldErrors.find((e) => e.templateIndex === templateIndex && e.path === path)?.message;

const shortMsg = (msg: string) =>
    msg.replace(/^templates\.\d+\.[^\s]+ /, "");

/** Validate that a string is numeric (digits and optional decimal point) */
const isValidNumberInput = (value: string): boolean => {
    if (value === "" || value === ".") return true;
    return /^\d*\.?\d*$/.test(value);
};

/** Check if any amount field across all templates is zero or empty */
const hasZeroAmountField = (rows: ISalaryTemplateItem[]): boolean => {
    for (const template of rows) {
        if (Number(template.annualGross) === 0 || template.annualGross === "") return true;
        if (Number(template.monthlyGross) === 0 || template.monthlyGross === "") return true;
        for (const e of template.earnings as any[]) {
            if (Number(e.monthlyAmount) === 0 || e.monthlyAmount === "") return true;
        }
        for (const d of template.deductions as any[]) {
            if (Number(d.monthlyAmount) === 0 || d.monthlyAmount === "") return true;
        }
    }
    return false;
};

// ─── DraggableRow ─────────────────────────────────────────────────────────────

interface DraggableRowProps {
    index: number;
    onDragStart: (index: number) => void;
    onDragEnter: (index: number) => void;
    onDrop: (index: number) => void;
    isDragTarget: boolean;
    children: React.ReactNode;
}

const DraggableRow = ({
    index,
    onDragStart,
    onDragEnter,
    onDrop,
    isDragTarget,
    children,
}: DraggableRowProps) => {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <TableRow
            draggable
            onDragStart={() => { setIsDragging(true); onDragStart(index); }}
            onDragEnd={() => setIsDragging(false)}
            onDragEnter={() => onDragEnter(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(index)}
            sx={{
                opacity: isDragging ? 0.35 : 1,
                outline: isDragTarget && !isDragging ? "2px solid" : "none",
                outlineColor: "primary.main",
                outlineOffset: "-2px",
                transition: "opacity 0.15s",
                "&:hover .drag-handle": { opacity: 1 },
            }}
        >
            {children}
        </TableRow>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const SalaryTemplateValidationView = ({
    uploadedData,
    initialErrors,
    onConfirm,
}: Props) => {
    const [rows, setRows] = useState<ISalaryTemplateItem[]>([]);

    // Field-level errors — from import step (dot-notation path errors)
    const [fieldErrors, setFieldErrors] = useState<ParsedValidationError[]>([]);

    // Template-level errors — from validate API (new shape: fields map)
    const [templateErrors, setTemplateErrors] = useState<TemplateValidationError[]>([]);

    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [hasEdits, setHasEdits] = useState(false);
    const [validated, setValidated] = useState(false);
    const { showSnackbar } = useSnackbar();

    // DnD state
    const dragSrc = useRef<{ ti: number; section: "earnings" | "deductions"; idx: number } | null>(null);
    const [dragTarget, setDragTarget] = useState<{ ti: number; section: "earnings" | "deductions"; idx: number } | null>(null);

    const [validateSalaryTemplate] = useValidateSalaryTemplatesMutation();

    // ── Init ──────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!uploadedData?.length) return;

        setRows(uploadedData.map((r) => JSON.parse(JSON.stringify(r))));
        setFieldErrors(initialErrors);
        setTemplateErrors([]);

        const autoExpand: Record<number, boolean> = {};
        initialErrors.forEach((e) => { autoExpand[e.templateIndex] = true; });
        setExpanded(autoExpand);

        setValidated(initialErrors.length === 0);
    }, [uploadedData, initialErrors]);

    // ── Field edit ────────────────────────────────────────────────────────────

    const AMOUNT_FIELDS = new Set(["monthlyAmount", "annualGross", "monthlyGross"]);
    const NUMBER_FIELDS = new Set(["annualGross", "monthlyGross", "monthlyAmount", "payslipOrder"]);

    const updateField = (templateIndex: number, path: string, value: string) => {
        const fieldName = path.split(".").pop();
        const isAmountField = AMOUNT_FIELDS.has(fieldName || "");

        if (isAmountField) {
            // Strip commas before numeric validation
            const raw = parseNumberForTyping(value);
            if (!isValidNumberInput(raw)) return;
            // Store raw numeric string (no commas) in state
            setRows((prev) => {
                const next = prev.map((r) => JSON.parse(JSON.stringify(r)));
                const parts = path.split(".");
                let obj: any = next[templateIndex];
                for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
                const key = parts[parts.length - 1];
                obj[key] = raw === "" ? "" : Number(raw);
                return next;
            });
        } else {
            setRows((prev) => {
                const next = prev.map((r) => JSON.parse(JSON.stringify(r)));
                const parts = path.split(".");
                let obj: any = next[templateIndex];
                for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
                const key = parts[parts.length - 1];
                obj[key] = NUMBER_FIELDS.has(key) ? (value === "" ? "" : Number(value)) : value;
                return next;
            });
        }

        setHasEdits(true);
        setValidated(false);
    };

    // ── DnD reorder ───────────────────────────────────────────────────────────

    const handleDragStart = (ti: number, section: "earnings" | "deductions", idx: number) => {
        dragSrc.current = { ti, section, idx };
    };

    const handleDragEnter = (ti: number, section: "earnings" | "deductions", idx: number) => {
        setDragTarget({ ti, section, idx });
    };

    const handleDrop = (ti: number, section: "earnings" | "deductions", dropIdx: number) => {
        setDragTarget(null);
        const src = dragSrc.current;
        if (!src || src.ti !== ti || src.section !== section || src.idx === dropIdx) return;

        setRows((prev) => {
            const next = prev.map((r) => JSON.parse(JSON.stringify(r)));
            const arr: any[] = next[ti][section];
            const [moved] = arr.splice(src.idx, 1);
            arr.splice(dropIdx, 0, moved);
            return next;
        });

        setHasEdits(true);
        setValidated(false);
        dragSrc.current = null;
    };

    // ── Validate ──────────────────────────────────────────────────────────────

    const handleValidate = async () => {
        try {
            const response = await validateSalaryTemplate({
                templates: toSalaryTemplateRequest(rows),
            }).unwrap();

            if (response?.data?.isValid === false && response?.data?.errors?.length > 0) {
                const parsed: TemplateValidationError[] = response.data.errors.map((e: any) => ({
                    templateName: e.templateName,
                    fields: e.fields ?? {},
                }));

                setTemplateErrors(parsed);
                setFieldErrors([]);
                setValidated(false);
                setHasEdits(false);

                const autoExpand: Record<number, boolean> = {};
                parsed.forEach((te) => {
                    const idx = rows.findIndex((r) => r.templateName === te.templateName);
                    if (idx !== -1) autoExpand[idx] = true;
                });
                setExpanded((prev) => ({ ...prev, ...autoExpand }));
                showSnackbar("Validation failed. Please resolve the errors.", "error");

            } else {
                setTemplateErrors([]);
                setFieldErrors([]);
                setValidated(true);
                setHasEdits(false);
                showSnackbar("Salary templates validated successfully!", "success");
            }
        } catch (err: any) {
            const messages: string[] = err?.data?.message ?? [];
            if (messages.length) {
                const parsed = parseValidationMessages(messages);
                setFieldErrors(parsed);
                const autoExpand: Record<number, boolean> = {};
                parsed.forEach((e: any) => { autoExpand[e.templateIndex] = true; });
                setExpanded((prev) => ({ ...prev, ...autoExpand }));
            }
            setTemplateErrors([]);
            setValidated(false);
            setHasEdits(false);
            showSnackbar("An error occurred during validation.", "error");
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────────

    const totalTemplateErrors = templateErrors.reduce(
        (sum, te) => sum + Object.values(te.fields).reduce((s, msgs) => s + msgs.length, 0),
        0
    );
    const totalErrors = fieldErrors.length + totalTemplateErrors;
    const allValid = totalErrors === 0 && validated;
    const anyZeroAmount = hasZeroAmountField(rows);
    // Validate button: disabled if no edits AND already validated (or never touched), OR if any amount is zero
    const validateDisabled = (!hasEdits && validated) || anyZeroAmount;

    if (!rows.length) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320 }}>
                <Typography variant="body2" color="text.secondary">No data to review.</Typography>
            </Box>
        );
    }

    // ── Shared table renderer ─────────────────────────────────────────────────

    const renderTable = (
        ti: number,
        template: ISalaryTemplateItem,
        section: "earnings" | "deductions"
    ) => {
        const isEarnings = section === "earnings";
        const items: any[] = (template as any)[section];
        const nameField = isEarnings ? "earningName" : "deductionName";
        const nameLabel = isEarnings ? "Earning Name" : "Deduction Name";

        return (
            <Table
                size="small"
                sx={{
                    mb: isEarnings ? 3 : 0,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    tableLayout: "fixed",
                }}
            >
                <TableHead>
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell sx={{ width: 36, border: "1px solid #e0e0e0", p: 0 }} />
                        <TableCell sx={{ width: 44, fontWeight: 600, border: "1px solid #e0e0e0", color: "text.secondary" }}>
                            #
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, border: "1px solid #e0e0e0" }}>{nameLabel}</TableCell>
                        <TableCell sx={{ fontWeight: 600, border: "1px solid #e0e0e0" }}>Monthly Amount (₹)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((item: any, idx: number) => {
                        const namePath = `${section}.${idx}.${nameField}`;
                        const amountPath = `${section}.${idx}.monthlyAmount`;

                        const nameImportErr = getFieldError(fieldErrors, ti, namePath);
                        const nameApiErrs = getTemplateFieldErrors(templateErrors, template.templateName, namePath);
                        const nameErrs = [...(nameImportErr ? [shortMsg(nameImportErr)] : []), ...nameApiErrs];

                        const amtImportErr = getFieldError(fieldErrors, ti, amountPath);
                        const amtApiErrs = getTemplateFieldErrors(templateErrors, template.templateName, amountPath);
                        const isZeroAmt = Number(item.monthlyAmount) === 0 || item.monthlyAmount === "";
                        const zeroErr = isZeroAmt ? ["Amount must be greater than 0"] : [];
                        const amtErrs = [...(amtImportErr ? [shortMsg(amtImportErr)] : []), ...amtApiErrs, ...zeroErr];

                        const isTarget =
                            dragTarget?.ti === ti &&
                            dragTarget?.section === section &&
                            dragTarget?.idx === idx;

                        return (
                            <DraggableRow
                                key={idx}
                                index={idx}
                                onDragStart={(i) => handleDragStart(ti, section, i)}
                                onDragEnter={(i) => handleDragEnter(ti, section, i)}
                                onDrop={(i) => handleDrop(ti, section, i)}
                                isDragTarget={isTarget}
                            >
                                {/* Drag handle */}
                                <TableCell
                                    sx={{
                                        border: "1px solid #e0e0e0",
                                        p: 0,
                                        textAlign: "center",
                                        width: 36,
                                    }}
                                >
                                    <DragIndicator
                                        className="drag-handle"
                                        fontSize="small"
                                        sx={{
                                            display: "block",
                                            mx: "auto",
                                            opacity: 0.3,
                                            transition: "opacity 0.15s",
                                            cursor: "grab",
                                            "&:active": { cursor: "grabbing" },
                                        }}
                                    />
                                </TableCell>

                                {/* Position (derived payslipOrder) */}
                                <TableCell
                                    sx={{
                                        border: "1px solid #e0e0e0",
                                        color: "text.disabled",
                                        fontWeight: 600,
                                        fontSize: "0.75rem",
                                        userSelect: "none",
                                    }}
                                >
                                    {idx + 1}
                                </TableCell>

                                {/* Name */}
                                <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                                    <Tooltip title={nameErrs.join(" · ")} arrow>
                                        <TextField
                                            value={item[nameField] ?? ""}
                                            onChange={(e) => updateField(ti, namePath, e.target.value)}
                                            error={nameErrs.length > 0}
                                            helperText={nameErrs[0]}
                                            size="small"
                                            fullWidth
                                        />
                                    </Tooltip>
                                </TableCell>

                                {/* Monthly Amount */}
                                <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                                    <Tooltip title={amtErrs.join(" · ")} arrow>
                                        <TextField
                                            value={formatNumberForTyping(String(item.monthlyAmount ?? ""), "IN")}
                                            onChange={(e) => updateField(ti, amountPath, e.target.value)}
                                            error={amtErrs.length > 0}
                                            helperText={amtErrs[0]}
                                            size="small"
                                            fullWidth
                                        />
                                    </Tooltip>
                                </TableCell>
                            </DraggableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Header bar */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="h6" fontWeight={700}>Review Salary Templates</Typography>
                    <Chip label={`${rows.length} templates`} size="small" variant="outlined" />
                    {totalErrors > 0 && (
                        <Chip
                            icon={<ErrorIcon fontSize="small" />}
                            label={`${totalErrors} error${totalErrors > 1 ? "s" : ""}`}
                            size="small"
                            color="error"
                            variant="outlined"
                        />
                    )}
                    {allValid && (
                        <Chip
                            icon={<CheckCircle fontSize="small" />}
                            label="All valid"
                            size="small"
                            color="success"
                            variant="outlined"
                        />
                    )}
                </Stack>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={hasEdits ? <Warning fontSize="small" /> : undefined}
                        onClick={handleValidate}
                        disabled={validateDisabled}
                        color={hasEdits ? "warning" : "primary"}
                    >
                        {hasEdits ? "Re-validate" : "Validate All"}
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!allValid || anyZeroAmount}
                        endIcon={<CheckCircleOutline />}
                        onClick={() => onConfirm(rows)}
                    >
                        Confirm & Next
                    </Button>
                </Stack>
            </Stack>

            {hasEdits && (
                <Alert severity="warning" sx={{ py: 0.5 }}>
                    Fields edited — click <strong>Re-validate</strong> before confirming.
                </Alert>
            )}

            {anyZeroAmount && (
                <Alert severity="error" sx={{ py: 0.5 }}>
                    One or more amount fields are <strong>zero or empty</strong>. Please correct them before validating.
                </Alert>
            )}

            {/* Template cards */}
            <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {rows.map((template, ti) => {
                    const tFieldErrors = fieldErrors.filter((e) => e.templateIndex === ti);
                    const tTemplateError = templateErrors.find((e) => e.templateName === template.templateName);
                    const tTemplateFieldCount = tTemplateError
                        ? Object.values(tTemplateError.fields).reduce((s, msgs) => s + msgs.length, 0)
                        : 0;
                    const hasErrors = tFieldErrors.length > 0 || tTemplateFieldCount > 0;
                    const isExpanded = !!expanded[ti];

                    // Per-template zero-amount check for root fields
                    const annualZero = Number(template.annualGross) === 0 || (template.annualGross as any) === "";
                    const monthlyZero = Number(template.monthlyGross) === 0 || (template.monthlyGross as any) === "";

                    return (
                        <Card
                            key={ti}
                            variant="outlined"
                            sx={{
                                borderColor: hasErrors ? "error.light" : validated ? "success.light" : "divider",
                                borderRadius: 2,
                                overflow: "hidden",
                                transition: "border-color 0.2s",
                            }}
                        >
                            <CardHeader
                                onClick={() => setExpanded((prev) => ({ ...prev, [ti]: !prev[ti] }))}
                                sx={{
                                    cursor: "pointer",
                                    bgcolor: hasErrors ? "error.50" : validated ? "success.50" : "grey.50",
                                    py: 1.25,
                                    transition: "background-color 0.2s",
                                    "& .MuiCardHeader-action": { alignSelf: "center" },
                                }}
                                avatar={
                                    hasErrors ? (
                                        <ErrorIcon color="error" />
                                    ) : validated ? (
                                        <CheckCircle color="success" />
                                    ) : (
                                        <CheckCircle color="disabled" />
                                    )
                                }
                                title={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="subtitle1" fontWeight={700}>
                                            {template.templateName || `Template ${ti + 1}`}
                                        </Typography>
                                        {tTemplateFieldCount > 0 && (
                                            <Chip
                                                label={`${tTemplateFieldCount} issue${tTemplateFieldCount > 1 ? "s" : ""}`}
                                                size="small"
                                                color="error"
                                            />
                                        )}
                                        {tFieldErrors.length > 0 && (
                                            <Chip
                                                label={`${tFieldErrors.length} field error${tFieldErrors.length > 1 ? "s" : ""}`}
                                                size="small"
                                                color="error"
                                                variant="outlined"
                                            />
                                        )}
                                    </Stack>
                                }
                                subheader={
                                    <Typography variant="caption" color="text.secondary">
                                        Annual: ₹{Number(template.annualGross).toLocaleString()}
                                        {" · "}Monthly: ₹{Number(template.monthlyGross).toLocaleString()}
                                        {" · "}{template.earnings.length} earnings
                                        {" · "}{template.deductions.length} deductions
                                    </Typography>
                                }
                                action={
                                    <IconButton size="small">
                                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                }
                            />

                            <Collapse in={isExpanded}>
                                <CardContent sx={{ pt: 2 }}>

                                    {/* Root fields */}
                                    <Typography variant="overline" color="text.secondary" gutterBottom display="block" pb={1}>
                                        Template Details
                                    </Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
                                        {[
                                            { path: "templateName", label: "Template Name" },
                                            { path: "description", label: "Description" },
                                            { path: "annualGross", label: "Annual Gross (₹)" },
                                            { path: "monthlyGross", label: "Monthly Gross (₹)" },
                                        ].map(({ path, label }) => {
                                            const importErr = getFieldError(fieldErrors, ti, path);
                                            const apiErrs = getTemplateFieldErrors(templateErrors, template.templateName, path);
                                            const isAmountField = AMOUNT_FIELDS.has(path);
                                            const isZero = path === "annualGross" ? annualZero : path === "monthlyGross" ? monthlyZero : false;
                                            const zeroErr = isAmountField && isZero ? ["Amount must be greater than 0"] : [];
                                            const allErrs = [...(importErr ? [shortMsg(importErr)] : []), ...apiErrs, ...zeroErr];
                                            const rawValue = (template as any)[path] ?? "";
                                            const displayValue = isAmountField
                                                ? formatNumberForTyping(String(rawValue), "IN")
                                                : rawValue;

                                            return (
                                                <Tooltip key={path} title={allErrs.join(" · ")} arrow>
                                                    <TextField
                                                        label={label}
                                                        value={displayValue}
                                                        onChange={(e) => updateField(ti, path, e.target.value)}
                                                        error={allErrs.length > 0}
                                                        helperText={allErrs[0]}
                                                        size="small"
                                                        sx={{ minWidth: 200, flex: 1 }}
                                                    />
                                                </Tooltip>
                                            );
                                        })}
                                    </Stack>

                                    {/* Earnings table */}
                                    <Typography variant="overline" color="text.secondary" gutterBottom display="block">
                                        Earnings
                                    </Typography>
                                    {renderTable(ti, template, "earnings")}

                                    {/* Deductions table */}
                                    <Typography variant="overline" color="text.secondary" gutterBottom display="block">
                                        Deductions
                                    </Typography>
                                    {renderTable(ti, template, "deductions")}

                                </CardContent>
                                <Divider />
                            </Collapse>
                        </Card>
                    );
                })}
            </Box>
        </Box>
    );
};

export default SalaryTemplateValidationView;