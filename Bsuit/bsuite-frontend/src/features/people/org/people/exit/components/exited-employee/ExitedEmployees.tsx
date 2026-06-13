import { Box, Stack, Typography } from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import { StandardTable } from "../../../../../../../components/tables/standard-table";
import { Chip } from "../../../../../../../components/atom/chips";
import { PrimaryIconButton } from "../../../../../../../components/atom/button";
import { ConfirmDialog } from "../../../../../../../components/dialogs/confirm-dialog";
import { useSnackbar } from "../../../../../../../context/SnackbarContext";
import {
    useGetExitedQuery,
    useRevertExitRequestMutation,
    type Employee,
    type ExitRequest,
} from "../../api/exit.api";

import type { StandardTableColumn } from "../../../../../../../types/types";

import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { SearchBoxAtom } from "../../../../../../../components/searchbar/SearchBoxAtom";

const getExitId = (row: ExitRequest & { id?: number }) =>
    row.exit?.id ?? row.id;

const ExitedEmployees = () => {
    const { showSnackbar } = useSnackbar();
    const { data: exitedEmployees, isFetching } = useGetExitedQuery();
    const [revertExitRequest] = useRevertExitRequestMutation();

    const [openConfirm, setOpenConfirm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<ExitRequest | null>(null);
    const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const tableRows = exitedEmployees ?? [];

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
                <Box sx={{ display: "flex", justifyContent: "center", pt: 0.5 }}>
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
            id: "actions",
            label: "Actions",
            align: "center",
            render: (row: ExitRequest) => (
                <Box display="flex" justifyContent="center">
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
        const exitId = selectedEmployee ? getExitId(selectedEmployee as ExitRequest & { id?: number }) : undefined;
        if (exitId == null) {
            showSnackbar("Unable to find exit request for this employee.", "error");
            setOpenConfirm(false);
            setSelectedEmployee(null);
            return;
        }

        try {
            const res = await revertExitRequest({ exitId }).unwrap();
            showSnackbar(
                res?.message || "Exit request reverted successfully",
                "success"
            );
        } catch (error: unknown) {
            const err = error as { data?: { message?: string }; message?: string };
            showSnackbar(
                err?.data?.message || err?.message || "Failed to revert exit request",
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
                overflow: "hidden",
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
                    Exited Employees
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
                    loading={isFetching}
                    emptyMessage="No exited employees found"
                />
            </Box>

            <ConfirmDialog
                open={openConfirm}
                onClose={handleCloseRevert}
                title="Revert Exit Request"
                message={`Are you sure you want to revert the exit request for ${
                    selectedEmployee?.employee?.contact?.name ??
                    selectedEmployee?.exit?.employee?.contact?.name ??
                    ""
                }?`}
                confirmText="Revert"
                confirmColor="primary"
                onConfirm={handleConfirmRevert}
            />
        </Box>
    );
};

export default ExitedEmployees;