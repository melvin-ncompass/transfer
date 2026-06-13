import { Box, Stack, Typography, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { TextFieldElement } from "../../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton, PrimaryIconButton } from "../../../../../../../components/atom/button";
import { Tooltip } from "../../../../../../../components/atom/tooltip";
import { AccordionElement } from "../../../../../../../components/atom/accordion";
import { Snackbar } from "../../../../../../../components/atom/snackbar";
import { useGetDeductionsQuery } from "../../../../structure/Deductions/api/deductions.api";
import {
  formatNumberByCommaSeparation,
  formatNumberForTyping,
  parseNumberForTyping,
} from "../../../../../../../utils/numberFormatter";
import { useSaveExemptionsMutation } from "../api/incometax.api";
import type { ExemptionsSubmitPayload, ExemptionSectionPayload } from "../types/incometax.types";

const COMMA_SEPARATION: "US" | "IN" = "IN";

/** Whole amounts only: reuse comma stripping from parseNumberForTyping, drop any fractional part. */
function parseIntegerAmountForTyping(raw: string): string {
  const cleaned = parseNumberForTyping(raw);
  const dot = cleaned.indexOf(".");
  return dot === -1 ? cleaned : cleaned.slice(0, dot);
}

function maxLimitFromApiToIntegerString(v: unknown): string {
  if (v == null || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return String(Math.trunc(n));
}

function normalizePfEmployeeContributionName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeProfessionalTaxName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ").trim();
}

/** Master data may use correct spelling or legacy double-f typo. */
const PROFESSIONAL_TAX_NORMALIZED = new Set(["professional tax", "proffesional tax"]);

const PF_EMPLOYEE_CONTRIBUTION_NORMALIZED = normalizePfEmployeeContributionName(
  "PF - Employee Contribution",
);

function isExemptionComponentMappingDeduction(d: { deductionName?: string }): boolean {
  const name = d.deductionName ?? "";
  if (PROFESSIONAL_TAX_NORMALIZED.has(normalizeProfessionalTaxName(name))) return true;
  return normalizePfEmployeeContributionName(name) === PF_EMPLOYEE_CONTRIBUTION_NORMALIZED;
}

/** Stored value like `d4` → deduction id 4; resolve label from deductions list. */
function parseDeductionIdFromComponentMapping(mapping: string): number | null {
  const m = /^d(\d+)$/i.exec((mapping ?? "").trim());
  if (!m) return null;
  return Number(m[1]);
}

export interface ExemptionItem {
  exemptionCode: string;
  exemptionName: string;
  maximumAmount: string;
  componentMapping: string;
}

export interface SectionItem {
  sectionCode: string;
  sectionName: string;
  maximumAmount: string;
  exemptions: ExemptionItem[];
}

const initialSection: SectionItem = {
  sectionCode: "",
  sectionName: "",
  maximumAmount: "",
  exemptions: [],
};

const initialExemption: ExemptionItem = {
  exemptionCode: "",
  exemptionName: "",
  maximumAmount: "",
  componentMapping: "",
};

function apiSectionsToSectionItems(data: ExemptionSectionPayload[]): SectionItem[] {
  return data.map((sec) => ({
    sectionCode: sec.code,
    sectionName: sec.sectionName,
    maximumAmount: maxLimitFromApiToIntegerString(sec.maxLimit),
    exemptions: (sec.subsections ?? []).map((sub) => ({
      exemptionCode: sub.code,
      exemptionName: sub.exemptionName,
      maximumAmount: maxLimitFromApiToIntegerString(sub.maxLimit),
      componentMapping: sub.componentMapping ?? "",
    })),
  }));
}

export interface ConfigDetailsExemptionsProps {
  versionId: number | null;
  configId: number | undefined;
  isEditMode: boolean;
  exemptionsData: ExemptionSectionPayload[];
  /** When set (e.g. from company header), used for accordion amounts; otherwise commaSeparation + currencySymbol. */
  formatCurrency?: (value: number | null | undefined) => string;
  commaSeparation?: "US" | "IN";
  currencySymbol?: string;
  onSaved?: () => void;
}

function buildPayload(versionId: number, sections: SectionItem[]): ExemptionsSubmitPayload {
  return {
    versionId,
    sections: sections.map((sec) => ({
      code: sec.sectionCode,
      sectionName: sec.sectionName,
      maxLimit: Math.trunc(Number(sec.maximumAmount)) || 0,
      subsections: sec.exemptions.map((ex) => ({
        code: ex.exemptionCode,
        exemptionName: ex.exemptionName,
        maxLimit: Math.trunc(Number(ex.maximumAmount)) || 0,
        componentMapping: ex.componentMapping ?? "",
      })),
    })),
  };
}

/** Non-empty after trim (required for section / exemption mandatory fields). */
function requiredStr(s: string | undefined): boolean {
  return String(s ?? "").trim().length > 0;
}

function sectionsEqual(a: SectionItem[], b: SectionItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((sec, i) => {
    const other = b[i];
    if (
      sec.sectionCode !== other.sectionCode ||
      sec.sectionName !== other.sectionName ||
      sec.maximumAmount !== other.maximumAmount
    )
      return false;
    if (sec.exemptions.length !== other.exemptions.length) return false;
    return sec.exemptions.every((ex, j) => {
      const o = other.exemptions[j];
      return (
        ex.exemptionCode === o.exemptionCode &&
        ex.exemptionName === o.exemptionName &&
        ex.maximumAmount === o.maximumAmount &&
        (ex.componentMapping ?? "") === (o.componentMapping ?? "")
      );
    });
  });
}

export function ConfigDetailsExemptions({
  versionId,
  configId: _configId,
  isEditMode,
  exemptionsData,
  formatCurrency: formatCurrencyProp,
  commaSeparation = "IN",
  currencySymbol = "₹",
  onSaved,
}: ConfigDetailsExemptionsProps) {
  /** API may send null, omit field, or (incorrectly) a non-array object — always treat as array. */
  const exemptionsList = Array.isArray(exemptionsData) ? exemptionsData : [];

  const [sections, setSections] = useState<SectionItem[]>([]);
  /** When parent allows edit: false = accordion + pencil; true = repeater form. */
  const [editingExemptions, setEditingExemptions] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const syncedEditRef = useRef(false);
  const baselineSectionsRef = useRef<SectionItem[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({ open: false, message: "", color: "success" });
  /** Inline required errors only after a failed save attempt, or cleared when adding rows (better UX for new rows). */
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const [saveExemptions, { isLoading: isSaving }] = useSaveExemptionsMutation();
  const { data: deductionsData = [] } = useGetDeductionsQuery();

  const deductionIdToName = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of deductionsData) {
      const id = d.id;
      if (id != null && !Number.isNaN(Number(id))) {
        map.set(Number(id), d.deductionName?.trim() || String(id));
      }
    }
    return map;
  }, [deductionsData]);

  const resolveComponentMappingDisplay = useCallback(
    (mapping: string) => {
      const raw = (mapping ?? "").trim();
      if (!raw) return "";
      const deductionId = parseDeductionIdFromComponentMapping(raw);
      if (deductionId != null) {
        const name = deductionIdToName.get(deductionId);
        return name ?? raw;
      }
      return raw;
    },
    [deductionIdToName],
  );

  useEffect(() => {
    if (!isEditMode || !editingExemptions) {
      setSections([]);
      syncedEditRef.current = false;
      baselineSectionsRef.current = [];
      return;
    }
    if (!syncedEditRef.current && exemptionsList.length > 0) {
      const initial = apiSectionsToSectionItems(exemptionsList);
      setSections(initial);
      baselineSectionsRef.current = initial;
      syncedEditRef.current = true;
    } else if (!syncedEditRef.current && exemptionsList.length === 0) {
      const seed: SectionItem[] = [{ ...initialSection, exemptions: [...initialSection.exemptions] }];
      setSections(seed);
      baselineSectionsRef.current = [{ ...initialSection, exemptions: [...initialSection.exemptions] }];
      syncedEditRef.current = true;
    }
  }, [isEditMode, editingExemptions, exemptionsList]);

  const hasChanges = useMemo(
    () => !sectionsEqual(sections, baselineSectionsRef.current),
    [sections],
  );

  const handleSubmit = useCallback(async () => {
    if (versionId == null) {
      setSnackbar({ open: true, message: "No version selected.", color: "error" });
      return;
    }
    if (sections.some((s) => s.exemptions.length === 0)) {
      setShowFieldErrors(true);
      setSnackbar({
        open: true,
        message: "Each section must have at least one exemption.",
        color: "error",
      });
      return;
    }
    if (
      sections.some(
        (s) =>
          !requiredStr(s.sectionCode) ||
          !requiredStr(s.sectionName) ||
          !requiredStr(s.maximumAmount),
      )
    ) {
      setShowFieldErrors(true);
      setSnackbar({
        open: true,
        message: "Every section needs code, name, and maximum amount.",
        color: "error",
      });
      return;
    }
    if (
      sections.some((s) =>
        s.exemptions.some(
          (ex) =>
            !requiredStr(ex.exemptionCode) ||
            !requiredStr(ex.exemptionName) ||
            !requiredStr(ex.maximumAmount),
        ),
      )
    ) {
      setShowFieldErrors(true);
      setSnackbar({
        open: true,
        message: "Every exemption needs code, name, and maximum amount.",
        color: "error",
      });
      return;
    }
    setShowFieldErrors(false);
    const payload = buildPayload(versionId, sections);
    try {
      await saveExemptions(payload).unwrap();
      setSnackbar({ open: true, message: "Exemptions saved successfully.", color: "success" });
      syncedEditRef.current = false;
      setSections([]);
      setEditingExemptions(false);
      onSaved?.();
    } catch (err: unknown) {
      const e = err as any;
      const msg = e?.data?.message ?? e?.error ?? e?.message ?? "Failed to save exemptions.";
      setSnackbar({ open: true, message: msg, color: "error" });
    }
  }, [versionId, sections, saveExemptions, onSaved]);

  const componentMappingOptions = useMemo(() => {
    const deductionOptions = deductionsData
      .filter((d: { isActive?: boolean }) => d.isActive !== false)
      .filter((d: { deductionName?: string }) => isExemptionComponentMappingDeduction(d))
      .map((d: { id?: number; deductionName?: string }) => ({
        label: d.deductionName ?? String(d.id),
        value: `d${d.id}`,
      }));
    return [{ label: "Deductions", options: deductionOptions }];
  }, [deductionsData]);

  const formatDisplayAmount = useCallback(
    (value: number) => {
      if (formatCurrencyProp) return formatCurrencyProp(value);
      return `${currencySymbol} ${formatNumberByCommaSeparation(value, commaSeparation)}`.trim();
    },
    [formatCurrencyProp, currencySymbol, commaSeparation],
  );

  const addSection = useCallback(() => {
    setShowFieldErrors(false);
    setSections((prev) => [...prev, { ...initialSection }]);
  }, []);

  const removeSection = useCallback((sectionIndex: number) => {
    setSections((prev) => prev.filter((_, i) => i !== sectionIndex));
  }, []);

  const updateSection = useCallback((sectionIndex: number, field: keyof SectionItem, value: string | ExemptionItem[]) => {
    setSections((prev) => {
      const next = [...prev];
      next[sectionIndex] = { ...next[sectionIndex], [field]: value };
      return next;
    });
  }, []);

  const addExemption = useCallback((sectionIndex: number) => {
    setShowFieldErrors(false);
    setSections((prev) => {
      const next = [...prev];
      next[sectionIndex] = {
        ...next[sectionIndex],
        exemptions: [...next[sectionIndex].exemptions, { ...initialExemption }],
      };
      return next;
    });
  }, []);

  const removeExemption = useCallback((sectionIndex: number, exemptionIndex: number) => {
    setSections((prev) => {
      const next = [...prev];
      next[sectionIndex] = {
        ...next[sectionIndex],
        exemptions: next[sectionIndex].exemptions.filter((_, i) => i !== exemptionIndex),
      };
      return next;
    });
  }, []);

  const updateExemption = useCallback(
    (sectionIndex: number, exemptionIndex: number, field: keyof ExemptionItem, value: string) => {
      setSections((prev) => {
        const next = [...prev];
        const exemptions = [...next[sectionIndex].exemptions];
        exemptions[exemptionIndex] = { ...exemptions[exemptionIndex], [field]: value };
        next[sectionIndex] = { ...next[sectionIndex], exemptions };
        return next;
      });
    },
    [],
  );

  const handleCancelEdit = useCallback(() => {
    setShowFieldErrors(false);
    setEditingExemptions(false);
  }, []);

  const hasExemptions = exemptionsList.length > 0;

  const hasSectionWithoutExemption = sections.some((s) => s.exemptions.length === 0);
  const missingSectionMandatory =
    sections.length > 0 &&
    sections.some(
      (s) =>
        !requiredStr(s.sectionCode) ||
        !requiredStr(s.sectionName) ||
        !requiredStr(s.maximumAmount),
    );
  const missingExemptionMandatory =
    sections.length > 0 &&
    sections.some((s) =>
      s.exemptions.some(
        (ex) =>
          !requiredStr(ex.exemptionCode) ||
          !requiredStr(ex.exemptionName) ||
          !requiredStr(ex.maximumAmount),
      ),
    );
  const submitDisabled =
    sections.length === 0 ||
    !hasChanges ||
    hasSectionWithoutExemption ||
    missingSectionMandatory ||
    missingExemptionMandatory;
  const submitDisabledTooltip = useMemo(() => {
    if (!submitDisabled) return undefined;
    const reasons: string[] = [];
    if (sections.length === 0) {
      reasons.push("Add at least one section before submitting.");
    } else {
      if (hasSectionWithoutExemption) {
        reasons.push("Each section must have at least one exemption.");
      }
      if (missingSectionMandatory) {
        reasons.push("Fill section code, name, and maximum amount for every section.");
      }
      if (missingExemptionMandatory) {
        reasons.push("Fill exemption code, name, and maximum amount for every exemption.");
      }
      if (!hasChanges) {
        reasons.push("No changes to save.");
      }
    }
    if (reasons.length === 0) return "Save is disabled.";
    if (reasons.length === 1) return reasons[0];
    return (
      <Stack component="ul" sx={{ m: 0, pl: 2, py: 0 }} spacing={0.5}>
        {reasons.map((text, i) => (
          <Typography key={i} component="li" variant="body2" sx={{ display: "list-item" }}>
            {text}
          </Typography>
        ))}
      </Stack>
    );
  }, [
    submitDisabled,
    sections.length,
    hasChanges,
    hasSectionWithoutExemption,
    missingSectionMandatory,
    missingExemptionMandatory,
  ]);

  /** Single toolbar: view mode opens edit; edit mode adds sections (no duplicate "Sections" row). */
  const sectionsToolbar = (
    <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: editingExemptions ? 2 : 1.5 }}>
      <Typography variant="subtitle1" fontWeight={600}>
        Sections
      </Typography>
      {isEditMode && !editingExemptions && (
        <PrimaryIconButton
          icon={hasExemptions ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
          title={hasExemptions ? "Edit exemptions" : "Add exemptions"}
          onClick={() => {
            setShowFieldErrors(false);
            setEditingExemptions(true);
          }}
          variant="outlined"
          size="small"
        />
      )}
      {isEditMode && editingExemptions && (
        <PrimaryIconButton
          icon={<AddIcon fontSize="small" />}
          title="Add section"
          onClick={addSection}
          variant="outlined"
          size="small"
        />
      )}
    </Stack>
  );

  const accordionBody =
    exemptionsList.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        {isEditMode
          ? "No exemption sections yet. Use the add control next to Sections to add and edit."
          : "No exemption sections configured for this version."}
      </Typography>
    ) : (
      <Stack spacing={2.5} gap={1.5}>
        {exemptionsList.map((section, index) => (
          <AccordionElement
            key={section.code || index}
            title={`${section.sectionName} (${section.code}) — Max: ${formatDisplayAmount(section.maxLimit)}`}
            open={expandedSection === index}
            onChange={(_e, expanded) => setExpandedSection(expanded ? index : null)}
          >
            <Stack spacing={2}>
              {(section.subsections ?? []).map((sub, subIndex) => (
                <Box
                  key={sub.code || subIndex}
                  sx={{
                    py: 1.25,
                    px: 1.5,
                    borderRadius: 1,
                    bgcolor: "grey.50",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    {sub.exemptionName} ({sub.code})
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }} flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      Max limit: {formatDisplayAmount(sub.maxLimit)}
                    </Typography>
                    {sub.componentMapping != null && sub.componentMapping !== "" && (
                      <Typography variant="body2" color="text.secondary">
                        Component: {resolveComponentMappingDisplay(sub.componentMapping)}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </AccordionElement>
        ))}
      </Stack>
    );

  const snackbarEl = snackbar.open && (
    <Snackbar
      message={snackbar.message}
      color={snackbar.color}
      onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
    />
  );

  if (!isEditMode) {
    return (
      <Box sx={{ pt: 1 }}>
        {sectionsToolbar}
        {accordionBody}
        {snackbarEl}
      </Box>
    );
  }

  if (!editingExemptions) {
    return (
      <Box sx={{ pt: 1 }}>
        {sectionsToolbar}
        {accordionBody}
        {snackbarEl}
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 1 }}>
      {sectionsToolbar}

      <Stack spacing={3}>
        {sections.map((section, sectionIndex) => (
          <Box
            key={sectionIndex}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              width: "100%",
            }}
          >
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-start">
                  <TextFieldElement
                    label="Section code"
                    value={section.sectionCode}
                    onChange={(e) => updateSection(sectionIndex, "sectionCode", e.target.value)}
                    placeholder="Section code"
                    required
                    fullWidth
                    error={showFieldErrors && !requiredStr(section.sectionCode)}
                    helperText={
                      showFieldErrors && !requiredStr(section.sectionCode) ? "Required" : undefined
                    }
                    sx={{ flex: "1 1 200px", minWidth: 180 }}
                  />
                  <TextFieldElement
                    label="Section name"
                    value={section.sectionName}
                    onChange={(e) => updateSection(sectionIndex, "sectionName", e.target.value)}
                    placeholder="Section name"
                    required
                    fullWidth
                    error={showFieldErrors && !requiredStr(section.sectionName)}
                    helperText={
                      showFieldErrors && !requiredStr(section.sectionName) ? "Required" : undefined
                    }
                    sx={{ flex: "1 1 200px", minWidth: 180 }}
                  />
                  <TextFieldElement
                    label="Maximum amount"
                    value={formatNumberForTyping(section.maximumAmount, COMMA_SEPARATION)}
                    onChange={(e) =>
                      updateSection(sectionIndex, "maximumAmount", parseIntegerAmountForTyping(e.target.value))
                    }
                    placeholder="0"
                    required
                    fullWidth
                    error={showFieldErrors && !requiredStr(section.maximumAmount)}
                    helperText={
                      showFieldErrors && !requiredStr(section.maximumAmount) ? "Required" : undefined
                    }
                    sx={{ flex: "1 1 160px", minWidth: 140 }}
                    slotProps={{
                      htmlInput: { style: { textAlign: "right" } },
                    }}
                  />
                </Stack>

                {/* Exemptions block: Add adds an exemption to this section only */}
                <Box sx={{ pl: 2, borderLeft: "2px solid", borderColor: "divider", width: "100%" }}>
                  <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Exemptions
                    </Typography>
                    <PrimaryIconButton
                      icon={<AddIcon />}
                      variant="outlined"
                      size="small"
                      onClick={() => addExemption(sectionIndex)}
                      sx={{ textTransform: "none" }}
                    >
                      Add
                    </PrimaryIconButton>
                  </Stack>
                  <Stack spacing={2}>
                    {section.exemptions.map((exemption, exIndex) => (
                      <Stack key={exIndex} direction="row" alignItems="flex-start" spacing={1}>
                        <Box sx={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 2 }}>
                          <TextFieldElement
                            label="Exemption code"
                            value={exemption.exemptionCode}
                            onChange={(e) => updateExemption(sectionIndex, exIndex, "exemptionCode", e.target.value)}
                            placeholder="Exemption code"
                            required
                            error={showFieldErrors && !requiredStr(exemption.exemptionCode)}
                            helperText={
                              showFieldErrors && !requiredStr(exemption.exemptionCode)
                                ? "Required"
                                : undefined
                            }
                            sx={{ flex: "1 1 140px", minWidth: 140 }}
                          />
                          <TextFieldElement
                            label="Exemption name"
                            value={exemption.exemptionName}
                            onChange={(e) => updateExemption(sectionIndex, exIndex, "exemptionName", e.target.value)}
                            placeholder="Exemption name"
                            required
                            error={showFieldErrors && !requiredStr(exemption.exemptionName)}
                            helperText={
                              showFieldErrors && !requiredStr(exemption.exemptionName)
                                ? "Required"
                                : undefined
                            }
                            sx={{ flex: "1 1 140px", minWidth: 140 }}
                          />
                          <TextFieldElement
                            label="Maximum amount"
                            value={formatNumberForTyping(exemption.maximumAmount, COMMA_SEPARATION)}
                            onChange={(e) =>
                              updateExemption(
                                sectionIndex,
                                exIndex,
                                "maximumAmount",
                                parseIntegerAmountForTyping(e.target.value),
                              )
                            }
                            placeholder="0"
                            required
                            error={showFieldErrors && !requiredStr(exemption.maximumAmount)}
                            helperText={
                              showFieldErrors && !requiredStr(exemption.maximumAmount)
                                ? "Required"
                                : undefined
                            }
                            sx={{ flex: "1 1 120px", minWidth: 120 }}
                            slotProps={{
                              htmlInput: { style: { textAlign: "right" } },
                            }}
                          />
                          <SingleSelectElement
                            label="Component mapping"
                            value={exemption.componentMapping}
                            onChange={(value) => updateExemption(sectionIndex, exIndex, "componentMapping", value)}
                            options={componentMappingOptions}
                            clearable
                            sx={{ minWidth: 180 }}
                          />
                        </Box>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => removeExemption(sectionIndex, exIndex)}
                          disabled={section.exemptions.length <= 1}
                          title={
                            section.exemptions.length <= 1
                              ? "Each section must keep at least one exemption."
                              : "Remove exemption"
                          }
                          sx={{ alignSelf: "flex-start" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Box>
              <IconButton
                color="error"
                size="small"
                onClick={() => removeSection(sectionIndex)}
                sx={{ alignSelf: "flex-start" }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>

      {sections.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Use &quot;Add section&quot; above, then add exemptions under each section.
        </Typography>
      )}

      <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
        <PrimaryButton onClick={handleCancelEdit} variant="outlined">
          Cancel
        </PrimaryButton>
        {submitDisabled && submitDisabledTooltip ? (
          <Tooltip title={submitDisabledTooltip} maxWidth={360} placement="top">
            <PrimaryButton onClick={handleSubmit} loading={isSaving} disabled={submitDisabled}>
              Submit
            </PrimaryButton>
          </Tooltip>
        ) : (
          <PrimaryButton onClick={handleSubmit} loading={isSaving} disabled={submitDisabled}>
            Submit
          </PrimaryButton>
        )}
      </Stack>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        />
      )}
    </Box>
  );
}
