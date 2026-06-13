import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { StandardTable } from "../../../../../../../components/tables/standard-table";
import { PrimaryButton, PrimaryIconButton } from "../../../../../../../components/atom/button";
import { Chip } from "../../../../../../../components/atom/chips";
import { ReviewModal } from "./ReviewModal";
import UndoIcon from "@mui/icons-material/Undo";
import { SearchBoxAtom } from "../../../../../../../components/searchbar/SearchBoxAtom";
import { useCallback, useEffect, } from "react";

import { useGetInReviewQuery, useRevertExitRequestMutation } from "../../api/exit.api";

import type { Employee, Exit, ExitRequest } from "../../api/exit.api";
import type { StandardTableColumn } from "../../../../../../../types/types";

import { ConfirmDialog } from "../../../../../../../components/dialogs/confirm-dialog";
import { useSnackbar } from "../../../../../../../context/SnackbarContext";
import dayjs from "dayjs";

export const UnderReviewTab = () => {
    const { showSnackbar } = useSnackbar();

    const [openReview, setOpenReview] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Exit | null>(null);

    const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const { data: apiRows } = useGetInReviewQuery();
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
            label: "Employee Name",
            render: (row: Exit) => {
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
            render: (row: Exit) => (
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
            render: (row: Exit) => (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Chip
                        label={row.status || "-"}
                        color="warning"
                        size="small"
                    />
                </Box>
            ),
        },

        {
            id: "exitInitiatedDate",
            label: "Exit Initiated Date",
            align: "center",
            render: (row: Exit) => (
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
            render: (row: Exit) => (
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
            render: (row: Exit) => (
                <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="center"
                    gap={1}
                >
                    <PrimaryButton
                        variant="text"
                        color="info"
                        title="review exit details"
                        onClick={() => {
                            setSelectedEmployee(row);
                            setOpenReview(true);
                        }}
                    >
                        Review
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
                    Under Review
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
                    emptyMessage="No exit requests under review"
                />
            </Box>

            <ReviewModal
                open={openReview}
                onClose={() => {
                    setOpenReview(false);
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