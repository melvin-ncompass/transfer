import { Avatar, Box, Stack, Typography } from "@mui/material";
import { StandardTable } from "../../../../../../../components/tables/standard-table";
import { PrimaryIconButton } from "../../../../../../../components/atom/button";
import { SingleSelectElement } from "../../../../../../../components/atom/select-field/SingleSelect";
import { SearchBoxAtom } from "../../../../../../../components/searchbar/SearchBoxAtom";
import SendIcon from "@mui/icons-material/Send";
import type { StandardTableColumn } from "../../../../../../../types/types";

interface ReassignTabContentProps {
    employeeOptions: { label: string; value: string }[];
    rows: any[];
    loading: boolean;
    applyToAll: boolean;
    setApplyToAll: (v: boolean) => void;
    bulkManagerId: string;
    setBulkManagerId: (v: string) => void;
    selectedManagers: Record<string, string>;
    handleManagerChange: (rowId: string, managerId: string) => void;
    handleBulkReassign: () => void;
    allRows: any[] | undefined;
    setFilterRows: (rows: any[]) => void;
    searchLabel?: string;
    bulkLabel?: string;
    columnName?: string;
}

export const ReassignTabContent = ({
    employeeOptions,
    rows,
    loading,
    applyToAll,
    setApplyToAll,
    bulkManagerId,
    setBulkManagerId,
    selectedManagers,
    handleManagerChange,
    handleBulkReassign,
    allRows,
    setFilterRows,
    searchLabel = "search...",
    bulkLabel = "Reassign for all employees ?",
    columnName = "Employee",
}: ReassignTabContentProps) => {
    const columns: StandardTableColumn[] = [
        {
            id: "name",
            label: columnName,
            render(row: any) {
                const name =
                    row.policyName ||
                    row.name ||
                    row.nameAsPerAadhar ||
                    row.nameAsPerPan ||
                    row.contact?.name ||
                    "—";
                return (
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 36, height: 36, fontSize: "0.85rem" }}>
                            {name?.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="body2">{name}</Typography>
                            {row.employeeId && (
                                <Typography variant="caption" color="text.secondary">
                                    {row.employeeId}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                );
            },
        },
        ...(!applyToAll
            ? [
                {
                    id: "action",
                    label: "Action",
                    align: "center" as const,
                    width: "30%",
                    render(row: any) {
                        return (
                            <Box
                                display="flex"
                                alignItems="center"
                                p={0.4}
                                gap={1}
                                justifyContent="center"
                            >
                                <Box width={200} pt={1}>
                                    <SingleSelectElement
                                        label="New Assignee"
                                        placeholder="Select"
                                        options={employeeOptions}
                                        value={selectedManagers[row.id] ?? ""}
                                        onChange={(value) =>
                                            handleManagerChange(row.id, value)
                                        }
                                        disabled={applyToAll}
                                    />
                                </Box>
                            </Box>
                        );
                    },
                },
            ]
            : []),
    ];

    return (
        <Stack spacing={2} sx={{ height: '100%' }}>
            {/* Bulk controls + search */}
            <Box
                display="flex"
                alignItems="center"
                gap={2}
                justifyContent="space-between"
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <Box minWidth={170}>
                        <SingleSelectElement
                            label={bulkLabel}
                            options={[
                                { label: "Yes", value: "true" },
                                { label: "No", value: "false" },
                            ]}
                            value={applyToAll ? "true" : "false"}
                            onChange={(val) => {
                                setApplyToAll(val === "true");
                                setBulkManagerId("");
                            }}
                        />
                    </Box>

                    {applyToAll && (
                        <>
                            <Box minWidth={170}>
                                <SingleSelectElement
                                    label="New Assignee"
                                    options={employeeOptions}
                                    value={bulkManagerId}
                                    onChange={(val) => setBulkManagerId(val)}
                                    placeholder="Select"
                                />
                            </Box>
                            <PrimaryIconButton
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={handleBulkReassign}
                                title="Reassign All"
                                disabled={!bulkManagerId}
                                icon={<SendIcon />}
                            />
                        </>
                    )}
                </Box>

                <Box minWidth={220}>
                    <SearchBoxAtom
                        data={allRows!}
                        searchKeys={[
                            "nameAsPerPan",
                            "nameAsPerAadhar",
                            "personalEmail",
                            "status",
                            "employeeId",
                            "contact.name",
                            "name",
                            "policyName"
                        ]}
                        placeholder={searchLabel}
                        onFilteredData={(data) => setFilterRows(data)}
                    />
                </Box>
            </Box>

            {/* Table */}
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <StandardTable
                    rows={rows}
                    columns={columns}
                    sticky
                    rowHeight={50}
                    loading={loading}
                />
            </Box>
        </Stack>
    );
};
