import { Box, Stack, Typography, Avatar } from "@mui/material";
import { Chip } from "../../../../../components/atom/chips";
import { useGetShiftEmployeesQuery } from "../api/shifts.api";
import { DenseTableAtom } from "../../../../../components/tables/standard-table/DenseTableAtom";
import { bgcolor, flex, width } from "@mui/system";

export interface ShiftEmployeeListProps {
    shiftId: number;
}

export const ShiftEmployeeList = ({ shiftId }: ShiftEmployeeListProps) => {
    const { data: shiftEmployeesData, isLoading } = useGetShiftEmployeesQuery(shiftId, {
        skip: !shiftId,
    });

    const parsedEmployees = (shiftEmployeesData?.data || []).map((emp: any) => ({
        id: emp.employeeId || emp.id || "-",
        name: emp.contact?.name || emp.nameAsPerAadhar || emp.nameAsPerPan || emp.name || "-",
        designation: emp.designation?.designationName || emp.designation || "-",
        department: emp.department?.departmentName || emp.department || "-",
        status: emp.status || "-",
    }));

    const tableColumns = [
        {
            id: "name",
            label: "Employee Name",
            width: "80%",
            // flex: 1,
            render: (row: any) => (
                <Stack direction="row" gap={2} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>{(row.name && row.name !== "-") ? row.name.charAt(0).toUpperCase() : "?"}</Avatar>
                    <Stack>
                        <Typography variant="body2" fontWeight={500}>{row.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.id}</Typography>
                    </Stack>
                </Stack>
            ),
        },
        {
            id: "status",
            label: "Status",
            width: "20%",
            headerAlign: "center" as const,
            align: "center" as const,
            render: (row: any) => {
                if (!row.status || row.status === "-") return <Typography variant="body2" color="text.secondary">-</Typography>;
                return (
                    <Box sx={{ display: 'inline-block' }}>
                        <Chip
                            label={
                                row.status
                                    ? row.status
                                        .split("_")
                                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(" ")
                                    : "-"
                            }
                            size="xs"
                            color={String(row.status).toLowerCase() === "active" ? "success" : "info"}
                            sx={{
                                minWidth: 70
                            }}
                        />
                    </Box>
                );
            }
        }
    ];

    return (
        <Box pr={2} >
            <DenseTableAtom
                columns={tableColumns}
                rows={parsedEmployees}
                loading={isLoading}
                emptyMessage="No employees assigned to this shift."

                sx={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}
            />
        </Box>
    );
};
