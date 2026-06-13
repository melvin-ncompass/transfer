import { Box, Typography } from "@mui/material";
import { useGetEmployeesQuery } from "../../../directory/api/directory.api";
import { useState, useEffect } from "react";
import {
    useGetManagerExpenseApproverQuery,
    useReassignManagerMutation,
    useReassignApproverMutation,
} from "../../api/exitManagerReassign.api";

import { TabsAtom } from "../../../../../../../components/tabs/Tabs";
import { ReassignTabContent } from "../reassign-manager-approver/ReassignTabContent";
import { PrimaryButton } from "../../../../../../../components/atom/button";
import { Snackbar } from "../../../../../../../components/atom/snackbar";

type TabType = "manager" | "approver";

export const TeamTab = ({
    employeeId,
}: {
    employeeId: string | number | null;
}) => {
    const [activeTab, setActiveTab] = useState<number>(0);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: "success" | "error" | "info" | "warning";
    }>({
        open: false,
        message: "",
        color: "success",
    });

    // ── Manager tab state ──────────────────────────────────────────────────
    const [reassignManager] = useReassignManagerMutation();
    const [managerSelectedMap, setManagerSelectedMap] = useState<Record<string, string>>({});
    const [managerApplyToAll, setManagerApplyToAll] = useState(false);
    const [managerBulkId, setManagerBulkId] = useState("");
    const [filteredManagerRows, setFilteredManagerRows] = useState<any[]>([]);

    const {
        data: managerApproverStatus,
        isFetching: isFetchingManagerApprover,
        isLoading: isLoadingManagerApprover,
    } = useGetManagerExpenseApproverQuery(employeeId ?? undefined, {
        skip: !employeeId,
    });
    const loadingManager = isFetchingManagerApprover || isLoadingManagerApprover;
    const reportingEmployees = managerApproverStatus?.reportingEmployees;

    // ── Approver tab state ─────────────────────────────────────────────────
    const [approverSelectedMap, setApproverSelectedMap] = useState<Record<string, string>>({});
    const [reassignApprover] = useReassignApproverMutation();
    const [approverApplyToAll, setApproverApplyToAll] = useState(false);
    const [approverBulkId, setApproverBulkId] = useState("");
    const [filteredApproverRows, setFilteredApproverRows] = useState<any[]>([]);

    const loadingApprover = isFetchingManagerApprover || isLoadingManagerApprover;
    const reportingApprovers = managerApproverStatus?.expensePolicies;

    // ── Shared employee dropdown options ───────────────────────────────────
    const { data: employees } = useGetEmployeesQuery();
    const employeeOptions =
        employees?.data
            ?.filter((employee) => employee.id !== Number(employeeId))
            .map((employee) => ({
                label:
                    employee.nameAsPerAadhar ||
                    employee.nameAsPerPan ||
                    employee.contact?.name ||
                    "",
                value: String(employee.id),
            })) ?? [];

    // ── Sync filtered rows when data arrives ───────────────────────────────
    useEffect(() => {
        if (!loadingManager && reportingEmployees) {
            setFilteredManagerRows(reportingEmployees);
        }
    }, [reportingEmployees, loadingManager]);

    useEffect(() => {
        if (!loadingApprover && reportingApprovers) {
            setFilteredApproverRows(reportingApprovers);
        }
    }, [reportingApprovers, loadingApprover]);

    // ── Switch tab if only approver ────────────────────────────────────────
    useEffect(() => {
        setActiveTab(0);
    }, [managerApproverStatus]);

    // ── Manager handlers ───────────────────────────────────────────────────
    const handleManagerChange = (rowId: string, managerId: string) =>
        setManagerSelectedMap((prev) => ({ ...prev, [rowId]: managerId }));



    const handleBulkReassignManager = async () => {
        if (!employeeId || !managerBulkId) return;
        try {
            await reassignManager({
                employeeId: employeeId,
                body: { applyToEveryone: true, newManagerId: Number(managerBulkId) },
            }).unwrap();
            setSnackbar({
                message: "Manager reassigned successfully",
                open: true,
                color: "success",
            })

        } catch (error: any) {
            setSnackbar({
                message: error?.data?.message || "Failed to reassign manager",
                open: true,
                color: "error",
            })
            console.error("Bulk reassign manager error:", error);
        }
    };

    // ── Approver handlers ──────────────────────────────────────────────────
    const handleApproverChange = (rowId: string, approverId: string) =>
        setApproverSelectedMap((prev) => ({ ...prev, [rowId]: approverId }));



    const handleBulkReassignApprover = async () => {
        if (!employeeId || !approverBulkId) return;
        try {
            await reassignApprover({
                employeeId: employeeId,
                body: { applyToAll: true, newApproverId: Number(approverBulkId) },
            }).unwrap();
            setSnackbar({
                message: "Approver reassigned successfully",
                open: true,
                color: "success",
            })
        } catch (error: any) {
            setSnackbar({
                message: error?.data?.message || "Failed to reassign approver",
                open: true,
                color: "error",
            })
            console.error("Bulk reassign approver error:", error);
        }
    };

    const handleSubmit = async () => {
        if (!employeeId) return;

        try {
            // ───── MANAGER TAB ─────
            if (tabs[activeTab]?.type === "manager") {

                // BULK
                if (managerApplyToAll && managerBulkId) {
                    await reassignManager({
                        employeeId: employeeId,
                        body: {
                            applyToEveryone: true,
                            newManagerId: Number(managerBulkId),
                        },
                    }).unwrap();
                }

                // INDIVIDUAL
                else {
                    const reassignments = Object.entries(managerSelectedMap)
                        .filter(([_, newManagerId]) => newManagerId)
                        .map(([employeeId, newManagerId]) => ({
                            employeeId: Number(employeeId),
                            newManagerId: Number(newManagerId),
                        }));

                    if (!reassignments.length) return;

                    await reassignManager({
                        employeeId: employeeId,
                        body: { reassignments },
                    }).unwrap();
                }
                setSnackbar({
                    message: "Manager reassigned successfully",
                    open: true,
                    color: "success",
                })
            }

            // ───── APPROVER TAB ─────
            if (tabs[activeTab]?.type === "approver") {

                // BULK
                if (approverApplyToAll && approverBulkId) {
                    await reassignApprover({
                        employeeId: employeeId,
                        body: {
                            applyToAll: true,
                            newApproverId: Number(approverBulkId),
                        },
                    }).unwrap();
                }

                // INDIVIDUAL
                else {
                    const reassignments = Object.entries(approverSelectedMap)
                        .filter(([_, newApproverId]) => newApproverId)
                        .map(([policyId, newApproverId]) => ({
                            policyId: Number(policyId),
                            newApproverId: Number(newApproverId),
                        }));

                    if (!reassignments.length) return;

                    await reassignApprover({
                        employeeId: employeeId,
                        body: { reassignments },
                    }).unwrap();
                }

                setSnackbar({
                    message: "Approver reassigned successfully",
                    open: true,
                    color: "success",
                })
            }

        } catch (error: any) {
            setSnackbar({
                message: error?.data?.message || "Failed to reassign",
                open: true,
                color: "error",
            })
            console.error("Reassign error:", error);
        }
    };

    const tabs: { label: string; type: TabType; content: React.ReactNode }[] = [];

    if (managerApproverStatus?.isManager) {
        tabs.push({
            label: "Direct Reports",
            type: 'manager',
            content: (<ReassignTabContent
                employeeOptions={employeeOptions}
                rows={filteredManagerRows}
                loading={loadingManager}
                applyToAll={managerApplyToAll}
                setApplyToAll={(v) => {
                    setManagerApplyToAll(v);
                    setManagerBulkId("");
                    setManagerSelectedMap({});
                }}
                bulkManagerId={managerBulkId}
                setBulkManagerId={setManagerBulkId}
                selectedManagers={managerSelectedMap}
                handleManagerChange={handleManagerChange}
                handleBulkReassign={handleBulkReassignManager}
                allRows={reportingEmployees}
                setFilterRows={setFilteredManagerRows}
                bulkLabel="Reassign for all employees?"
            />)
        });
    }

    if (managerApproverStatus?.isExpenseApprover) {
        tabs.push({
            label: "Transfer Expense Approver",
            type: 'approver',
            content: (<ReassignTabContent
                employeeOptions={employeeOptions}
                rows={filteredApproverRows}
                loading={loadingApprover}
                applyToAll={approverApplyToAll}
                setApplyToAll={(v) => {
                    setApproverApplyToAll(v);
                    setApproverBulkId("");
                    setApproverSelectedMap({});
                }}
                bulkManagerId={approverBulkId}
                setBulkManagerId={setApproverBulkId}
                selectedManagers={approverSelectedMap}
                handleManagerChange={handleApproverChange}
                handleBulkReassign={handleBulkReassignApprover}
                allRows={reportingApprovers}
                setFilterRows={setFilteredApproverRows}
                bulkLabel="Reassign for all policies?"
                columnName="Policy"
            />)
        });
    }

    const isSaveDisabled =
        tabs[activeTab]?.type === "manager"
            ? (
                managerApplyToAll
                    ? !managerBulkId // bulk mode → manager must be selected
                    : !Object.values(managerSelectedMap).some(Boolean) // individual → at least one row must be selected
            )
            : (
                approverApplyToAll
                    ? !approverBulkId // bulk mode → approver must be selected
                    : !Object.values(approverSelectedMap).some(Boolean) // individual → at least one row must be selected
            );

    return (
        <>
            <Box display="flex" flexDirection="column" flex={1} minHeight={0} height={'100%'}>
                <Box flex={1} minHeight={0} display="flex" flexDirection="column">
                    {tabs.length === 0 ? (
                        <Box
                            flex={1}
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            gap={1}
                        >
                            <Typography variant="body2" color="textSecondary">
                                No reassignments required
                            </Typography>
                            <Typography variant="caption" color="textDisabled">
                                This employee has no direct reports or expense approvals to transfer.
                            </Typography>
                        </Box>
                    ) : (
                        <TabsAtom
                            value={activeTab}
                            onChange={(val) => setActiveTab(val)}
                            tabs={tabs}
                            contentSx={{ py: 2 }}
                        />
                    )}
                </Box>

                <Box display="flex" justifyContent="flex-end" mt="auto" pt={2}>
                    <PrimaryButton
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={isSaveDisabled || tabs.length === 0}
                    >
                        Save
                    </PrimaryButton>
                </Box>
            </Box>
            {/* </ModalElement> */}
            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    autoClose={4000}
                />
            )}
        </>
    );
};