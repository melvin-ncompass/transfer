import { useCallback, useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { StandardTable } from "../../../../../../../components/tables/standard-table";
import { PrimaryButton, PrimaryIconButton } from "../../../../../../../components/atom/button";
import { Chip } from "../../../../../../../components/atom/chips";
import { ProgressModal } from "./ExitProgressModal";
import UndoIcon from "@mui/icons-material/Undo";

import { formatReason } from "../../util/formatReason";
import { useGetInProgressQuery, useRevertExitRequestMutation } from "../../api/exit.api";

import type { Employee, ExitRequest } from "../../api/exit.api";
import type { StandardTableColumn } from "../../../../../../../types/types";

import { ConfirmDialog } from "../../../../../../../components/dialogs/confirm-dialog";
import { useSnackbar } from "../../../../../../../context/SnackbarContext";
import dayjs from "dayjs";
import { SearchBoxAtom } from "../../../../../../../components/searchbar/SearchBoxAtom";

export const ExitProgressTab = () => {
    const { showSnackbar } = useSnackbar();

    const [openProgress, setOpenProgress] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<ExitRequest | null>(null);
    const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const { data: apiRows } = useGetInProgressQuery();
    const tableRows = apiRows ?? [];

    const [revertExitRequest] = useRevertExitRequestMutation();

    const handleFilteredData = useCallback((data: any[]) => {
        setFilteredEmployees(data);
        setIsSearching(data.length !== tableRows.length);
    }, [tableRows]);

    useEffect(() => {
        setIsSearching(false);
        setFilteredEmployees([]);
    }, [tableRows]);

    const columns: StandardTableColumn[] = [
        {
            id: "employeeDetails",
            label: "Employee Details",
            render: (row: ExitRequest) => {
                const employee: Employee = row.employee;

                return (
                    <Stack spacing={0.3}>
                        <Typography variant="body2">
                            {employee?.contact?.name || "-"}
                        </Typography>
                    </Stack>
                );
            },
        },

        {
            id: "exitDetails",
            label: "Exit Details",
            render: (row: ExitRequest) => (
                <Stack spacing={0.3}>
                    <Typography variant="body2">
                        Initiated by {row.initiateExitBy || "-"}
                    </Typography>
                </Stack>
            ),
        },

        {
            id: "status",
            label: "Review Status",
            align: "center",
            render: (row: ExitRequest) => (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Chip
                        label={row.status || "-"}
                        color={
                            row.status === "exited"
                                ? "success"
                                : row.status === "pending"
                                    ? "warning"
                                    : "info"
                        }
                        size="small"
                    />
                </Box>
            ),
        },

        {
            id: "exitInitiatedDate",
            label: "Exit Initiated Date",
            align: "center",
            render: (row: ExitRequest) => (
                <Typography variant="body2">
                    {row.exitInitiatedDate
                        ? dayjs(row.exitInitiatedDate).format("MMM DD, YYYY")
                        : "-"}
                </Typography>
            ),
        },

        {
            id: "lastWorkingDate",
            label: "Last Working Date",
            align: "center",
            render: (row: ExitRequest) => (
                <Typography variant="body2">
                    {row.lastWorkingDate
                        ? dayjs(row.lastWorkingDate).format("MMM DD, YYYY")
                        : "-"}
                </Typography>
            ),
        },

        {
            id: "action",
            label: "Action",
            align: "center",
            render: (row: ExitRequest) => (
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={1}
                >
                    <PrimaryButton
                        variant="text"
                        color="info"
                        onClick={() => {
                            setSelectedEmployee(row);
                            setOpenProgress(true);
                        }}
                    >
                        Manage
                    </PrimaryButton>

                    <PrimaryIconButton
                        variant="outlined"
                        color="warning"
                        title="Revert"
                        icon={<UndoIcon />}
                        onClick={() => {
                            setSelectedEmployee(row);
                            setOpenConfirm(true);
                        }}
                    />
                </Box>
            ),
        },
    ];

    const handleConfirmRevert = async () => {
        try {
            const res = await revertExitRequest({
                exitId: selectedEmployee?.id,
            }).unwrap();

            showSnackbar(
                res?.data?.message || "Exit request reverted successfully",
                "success"
            );
        } catch (error: any) {
            showSnackbar(
                error?.data?.message ||
                error?.message ||
                "Failed to revert exit request",
                "error"
            );
        } finally {
            setOpenConfirm(false);
            setSelectedEmployee(null);
        }
    };

    const handleCloseRevert = () => {
        setOpenConfirm(false);
        setSelectedEmployee(null);
    };

    return (
        <Box
            sx={{
                height: "100%",
                width: "100%",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                    gap: 2,
                }}
            >
                <Typography variant="h6">
                    Exit in Progress
                </Typography>

                <Box minWidth="240px">
                    <SearchBoxAtom
                        data={tableRows}
                        searchKeys={[
                            "status",
                            "initiateExitBy",
                            "employee.contact.name",
                            "employee.employeeId",
                            "employee.employeeType",
                        ]}
                        placeholder="Search employee..."
                        onFilteredData={handleFilteredData}
                    />
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto" }}>
                <StandardTable
                    columns={columns}
                    rows={isSearching ? filteredEmployees : tableRows}
                    emptyMessage="No exits in progress"
                />
            </Box>

            <ProgressModal
                open={openProgress}
                onClose={() => {
                    setOpenProgress(false);
                    setSelectedEmployee(null);
                }}
                exitId={selectedEmployee?.id}
            />

            <ConfirmDialog
                open={openConfirm}
                onClose={handleCloseRevert}
                title="Revert Exit Request"
                message={`Are you sure you want to revert the exit request for ${selectedEmployee?.employee?.contact?.name ?? ""
                    }?`}
                confirmText="Revert"
                confirmColor="primary"
                onConfirm={handleConfirmRevert}
            />
        </Box>
    );
};