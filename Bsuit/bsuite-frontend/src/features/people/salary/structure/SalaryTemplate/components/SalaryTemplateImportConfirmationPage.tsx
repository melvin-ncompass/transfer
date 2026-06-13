import { useState } from "react";
import {
    Box, Card, CardContent, CardHeader, Collapse,
    Divider, IconButton, Table, TableBody, TableCell,
    TableHead, TableRow, Typography, Chip, Button,
} from "@mui/material";
import { Stack } from "@mui/system";
import {
    CheckCircle, ExpandMore, ExpandLess, CheckCircleOutline, ArrowBack,
} from "@mui/icons-material";
import type { ISalaryTemplateItem } from "./ImportSalaryTemplate";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    templates: ISalaryTemplateItem[];
    onConfirm: () => void;
    onBack: () => void;
    isSubmitting?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SalaryTemplateConfirmView = ({ templates, onConfirm, onBack, isSubmitting }: Props) => {
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});

    const toggle = (i: number) =>
        setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

    if (!templates.length) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320 }}>
                <Typography variant="body2" color="text.secondary">
                    No templates to confirm.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Header bar */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="h6" fontWeight={700}>Confirm salary templates</Typography>
                    <Chip label={`${templates.length} templates`} size="small" variant="outlined" />
                    <Chip
                        icon={<CheckCircle fontSize="small" />}
                        label="All valid"
                        size="small"
                        color="success"
                        variant="outlined"
                    />
                </Stack>

                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<ArrowBack fontSize="small" />} onClick={onBack}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        endIcon={<CheckCircleOutline />}
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Importing..." : "Confirm & import"}
                    </Button>
                </Stack>
            </Stack>

            {/* Template cards */}
            <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {templates.map((template, ti) => {
                    const isExpanded = !!expanded[ti];

                    return (
                        <Card
                            key={ti}
                            variant="outlined"
                            sx={{ borderColor: "success.light", borderRadius: 2, overflow: "hidden" }}
                        >
                            <CardHeader
                                onClick={() => toggle(ti)}
                                sx={{
                                    cursor: "pointer",
                                    bgcolor: "success.50",
                                    py: 1.25,
                                    "& .MuiCardHeader-action": { alignSelf: "center" },
                                }}
                                avatar={<CheckCircle color="success" />}
                                title={
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        {template.templateName || `Template ${ti + 1}`}
                                    </Typography>
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

                                    {/* Template details */}
                                    <Typography variant="overline" color="text.secondary" gutterBottom display="block" pb={1}>
                                        Template details
                                    </Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
                                        {[
                                            { label: "Template name", value: template.templateName },
                                            { label: "Description", value: (template as any).description },
                                            { label: "Annual gross (₹)", value: Number(template.annualGross).toLocaleString() },
                                            { label: "Monthly gross (₹)", value: Number(template.monthlyGross).toLocaleString() },
                                        ].map(({ label, value }) => (
                                            <Box
                                                key={label}
                                                sx={{
                                                    flex: 1,
                                                    minWidth: 160,
                                                    bgcolor: "grey.50",
                                                    borderRadius: 1,
                                                    px: 1.5,
                                                    py: 1,
                                                }}
                                            >
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {label}
                                                </Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {value || "—"}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>

                                    {/* Earnings */}
                                    <Typography variant="overline" color="text.secondary" gutterBottom display="block">
                                        Earnings
                                    </Typography>
                                    <Table size="small" sx={{ mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "grey.50" }}>
                                                {["#", "Earning name", "Monthly amount (₹)"].map((h) => (
                                                    <TableCell key={h} sx={{ fontWeight: 600, border: "1px solid #e0e0e0" }}>
                                                        {h}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {template.earnings.map((earning: any, ei: number) => (
                                                <TableRow key={ei} hover>
                                                    <TableCell sx={{ border: "1px solid #e0e0e0", color: "text.disabled", width: 44, textAlign: "center" }}>
                                                        {ei + 1}
                                                    </TableCell>
                                                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>{earning.earningName}</TableCell>
                                                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                                                        {Number(earning.monthlyAmount).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Deductions */}
                                    <Typography variant="overline" color="text.secondary" gutterBottom display="block">
                                        Deductions
                                    </Typography>
                                    <Table size="small" sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "grey.50" }}>
                                                {["#", "Deduction name", "Monthly amount (₹)"].map((h) => (
                                                    <TableCell key={h} sx={{ fontWeight: 600, border: "1px solid #e0e0e0" }}>
                                                        {h}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {template.deductions.map((ded: any, di: number) => (
                                                <TableRow key={di} hover>
                                                    <TableCell sx={{ border: "1px solid #e0e0e0", color: "text.disabled", width: 44, textAlign: "center" }}>
                                                        {di + 1}
                                                    </TableCell>
                                                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>{ded.deductionName}</TableCell>
                                                    <TableCell sx={{ border: "1px solid #e0e0e0" }}>
                                                        {Number(ded.monthlyAmount).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

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

export default SalaryTemplateConfirmView;