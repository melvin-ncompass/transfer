import { SingleSelectElement } from "../../../../../../../components/atom/select-field/SingleSelect";
import { useConfigLeaveMutation, type LeaveImpactConfig, type LeaveImpactResponse } from "../../api/exit.api";
import { useState, useEffect, useRef, useMemo } from "react";
import { TextFieldElement } from "../../../../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../../../../components/atom/button";
import { Box, CircularProgress, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useGetEmployeeLeaveStatsQuery } from "../../../../../time/leaves/api/leaveType.api";
import { Snackbar } from "../../../../../../../components/atom/snackbar";

const buildConfigs = (
  leaveTypes: { leaveTypeId: number; label: string; balance: number | 'Unlimited' }[],
  existingConfigs: LeaveImpactResponse[]
): LeaveImpactConfig[] =>
  leaveTypes.map((lt) => {
    const existing = existingConfigs.find(
      (c) => c.leaveType.id === lt.leaveTypeId
    );

    if (existing) {
      return {
        leaveTypeId: existing.leaveType.id ?? lt.leaveTypeId,
        availability: existing.availability,
        noticePeriodAction: existing.noticePeriodAction,
        extendByMultiplier: Number(existing.extendByMultiplier),
      };
    }

    return {
      leaveTypeId: lt.leaveTypeId,
      availability: "can_apply",
      noticePeriodAction: "extend",
      extendByMultiplier: 0,
    };
  });

export const LeaveSettingsTab = ({
  exitId,
  empId,
  existingConfigs,
}: {
  exitId: number;
  empId: number;
  existingConfigs: LeaveImpactResponse[];
}) => {
  const { data: employeeLeaveStats, isLoading: isLeaveStatsLoading } = useGetEmployeeLeaveStatsQuery(empId ?? undefined, { skip: !empId });

  const leaveTypes = useMemo(() =>
    employeeLeaveStats?.leaveStats.map((leaveStat) => ({
      leaveTypeId: leaveStat.leaveTypeId,
      label: leaveStat.leaveTypeName,
      balance: leaveStat.available ?? 0,
    })) ?? []
    , [employeeLeaveStats]);


  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error"
  }>({ open: false, message: "", type: "success" });

  const [configs, setConfigs] = useState<LeaveImpactConfig[]>([]);
  const [multiplierInputs, setMultiplierInputs] = useState<Record<number, string>>({});
  const [configLeave, { isLoading }] = useConfigLeaveMutation();

  // null = "waiting for first load or waiting for post-save refetch to arrive"
  const savedConfigsRef = useRef<string | null>(null);

  const serializedConfigs = useMemo(() => JSON.stringify(existingConfigs), [existingConfigs]);
  const serializedLeaveTypes = useMemo(() => JSON.stringify(leaveTypes), [leaveTypes]);

  useEffect(() => {
    if (leaveTypes.length === 0) return;

    const rebuilt = buildConfigs(leaveTypes, existingConfigs);
    setConfigs(rebuilt);
    setMultiplierInputs({});

    // Capture baseline whenever it's null:
    // - on first load
    // - after a save resets it to null, so the incoming refetch re-anchors correctly
    if (savedConfigsRef.current === null) {
      savedConfigsRef.current = JSON.stringify(rebuilt);
    }
  }, [serializedConfigs, serializedLeaveTypes]);

  const hasChanges = useMemo(() => {
    if (savedConfigsRef.current === null) return false;
    const hasEmptyMultiplier = Object.values(multiplierInputs).some((v) => v === "");
    return hasEmptyMultiplier || JSON.stringify(configs) !== savedConfigsRef.current;
  }, [configs, multiplierInputs]);

  const updateConfig = (
    index: number,
    field: keyof LeaveImpactConfig,
    value: string | number
  ) => {
    setConfigs((prev) =>
      prev.map((cfg, i) =>
        i === index ? { ...cfg, [field]: value } : cfg
      )
    );
  };

  const handleMultiplierChange = (index: number, raw: string) => {
    if (raw === "") {
      setMultiplierInputs((prev) => ({ ...prev, [index]: "" }));
      return;
    }

    const numeric = Number(raw);
    if (!isNaN(numeric) && numeric >= 0) {
      setMultiplierInputs((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      updateConfig(index, "extendByMultiplier", numeric);
    }
  };

  const handleMultiplierBlur = (index: number) => {
    if (multiplierInputs[index] === "") {
      setMultiplierInputs((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      updateConfig(index, "extendByMultiplier", 0);
    }
  };

  const handleAvailabilityChange = (index: number, val: string) => {
    updateConfig(index, "availability", val);
    if (val === "restricted") {
      updateConfig(index, "extendByMultiplier", 0);
      setMultiplierInputs((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleSave = async () => {
    try {
      await configLeave({
        exitId,
        body: { leaveImpactConfigs: configs },
      }).unwrap();

      setSnackbar({ open: true, message: "Leave configuration saved successfully", type: "success" });
      // Reset to null so the next useEffect run (triggered by the refetched
      // existingConfigs) re-anchors the baseline to the fresh server data.
      savedConfigsRef.current = null;
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message ?? err?.error ?? err?.message ?? "Failed to save leave config.", type: "error" });
    }
  };

  const availabilityOptions = [
    { label: "Can Apply Leave", value: "can_apply" },
    { label: "Restricted", value: "restricted" },
  ];

  return (
    <>
      <Stack 
      // spacing={2.5} 
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        }}
        > 
        <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <Table
            sx={{
              tableLayout: "fixed",
              "& .MuiTableCell-root": { borderColor: "grey.200", py: 1.5, px: 2 },
            }}
          >
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "34%" }} />
            </colgroup>

            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    Leave Type
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    Leave Balances
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    Availability
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    Notice Period Action
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLeaveStatsLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {leaveTypes.map((lt, index) => {
                    const cfg = configs[index];
                    if (!cfg) return null;

                    const multiplierDisplayValue =
                      index in multiplierInputs
                        ? multiplierInputs[index]
                        : String(cfg.extendByMultiplier);

                    return (
                      <TableRow key={lt.leaveTypeId} sx={{ "&:hover": { bgcolor: "grey.50" } }}>
                        <TableCell>
                          <Typography variant="body2">{lt.label}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography
                            variant="body2"
                            color={lt.balance != null ? "text.primary" : "text.secondary"}
                          >
                            {lt.balance != null ? lt.balance : "-"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <SingleSelectElement
                            label=""
                            value={cfg.availability}
                            onChange={(val) => handleAvailabilityChange(index, val)}
                            options={availabilityOptions}
                            fullWidth
                          />
                        </TableCell>

                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" color="text.secondary">
                              Extend by
                            </Typography>

                            <TextFieldElement
                              label=""
                              type="number"
                              disabled={cfg.availability === 'restricted'}
                              value={multiplierDisplayValue}
                              onChange={(e) => handleMultiplierChange(index, e.target.value)}
                              onBlur={() => handleMultiplierBlur(index)}
                              sx={{ width: 72 }}
                            />

                            <Typography variant="body2" color="text.secondary">
                              day
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box
          sx={{
            // position: "relative",
            // bottom: 33,
            // right: 33,
            display: "flex",
            justifyContent: "flex-end",
             flexShrink: 0,
             p: 2
          }}
        >

          <PrimaryButton
            variant="contained"
            disabled={isLoading || !hasChanges}
            onClick={handleSave}
            startIcon={isLoading ? <CircularProgress size={14} color="warning" /> : undefined}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Save
          </PrimaryButton>
        </Box>
      </Stack>
      {snackbar.open && (
        <Snackbar
          onClose={() => setSnackbar({ open: false, message: "", type: "success" })}
          message={snackbar.message}
          color={snackbar.type}
        />
      )}
    </>
  );
};