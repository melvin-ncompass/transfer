import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Tooltip } from "@mui/material";
import { PrimaryButton } from "../../../../../../components/atom/button/PrimaryButton";
import { MatchTableAtom } from "../../../../../../components/tables/standard-table/MatchTableAtom";
import CustomCircularProgress from "../../../../../../components/atom/circular-progress/CircularProgress";
import { formatDateShort } from "../../../../../../utils/numberFormatter";
import {
    useLazyGetJournalMatchQuery,
    useSaveUncategorizedJournalMatchMutation,
} from "../api/match.api";
import { RadioButton } from "../../../../../../components/atom/radio-button";

interface JournalMatchTabProps {
    isOpen: boolean;
    uncatId?: string;
    total?: number;
    amountType: "credit" | "debit";
    showSnackbar: (message: string, color: "success" | "error") => void;
    refetchTransactCount: (() => void) | undefined;
    onClose: () => void;
}

export default function JournalMatchTab({
    isOpen,
    uncatId,
    total,
    amountType,
    showSnackbar,
    onClose,
    refetchTransactCount,
}: JournalMatchTabProps) {
    const navigate = useNavigate();
    const [selectedJournalKey, setSelectedJournalKey] = useState<string | null>(null);

    const [triggerGetJournalMatch, { data: journalMatchData, isLoading, isFetching }] = useLazyGetJournalMatchQuery();

    const [saveUncategorizedJournalMatch, { isLoading: isSaving }] =
        useSaveUncategorizedJournalMatchMutation();

    const journalMatches = journalMatchData?.data?.journalMatches || [];

    const journalTableRows = journalMatches.map((item: any, index: number) => ({
        id: index,
        transactionTypeId: item.transactionTypeId,
        transactionTypeName: item.transactionTypeName,
        description: item.description,
        date: item.date,
        fromAccounts: item.fromAccounts?.map((a: any) => a.name).join(", ") || "-",
        toAccounts: item.toAccounts?.map((a: any) => a.name).join(", ") || "-",
    }));

    const journalColumns = [
        { field: "select", headerName: "Select", width: "60px" },
        { field: "description", headerName: "Description", headerAlign: "left" as const },
        { field: "fromAccounts", headerName: "From", headerAlign: "left" as const },
        { field: "toAccounts", headerName: "To", headerAlign: "left" as const },
        // { field: "date", headerName: "Date", headerAlign: "left" as const },
    ];


    const journalRows = journalTableRows.map((row: any) => ({
        id: row.id,
        select: (
            <RadioButton
                checked={selectedJournalKey === row.transactionTypeId}
                onChange={() =>
                    setSelectedJournalKey((prev) =>
                        prev === row.transactionTypeId ? null : row.transactionTypeId,
                    )
                }
            />
        ),
        date: formatDateShort(row.date),
        description: row.description == "" ? "-" : row.description,
        fromAccounts: row.fromAccounts,
        toAccounts: row.toAccounts,
    }));

    useEffect(() => {
        if (isOpen && uncatId) {
            triggerGetJournalMatch({
                amount: total?.toString() || "0",
                amountType,
                uncategorizedId: Number(uncatId),
            });
        }
    }, [isOpen, uncatId]);

    const handleSave = async () => {
        if (!selectedJournalKey || !uncatId) return;

        const selected = journalTableRows.find(
            (r: any) => r.transactionTypeId === selectedJournalKey,
        );
        if (!selected) return;

        try {
            const response = await saveUncategorizedJournalMatch({
                uncatId,
                transactionTypeId: selected.transactionTypeId,
                transactionTypeName: selected.transactionTypeName,
            }).unwrap();

            const transactionId = String(response.data?.transactionTypeId || "");
            const transactionType = response.data?.transactionTypeName || "journal";

            showSnackbar("Journal match saved successfully.", "success");
            navigate(
                `/books/transact/home?tab=transact&highlightId=${transactionId}&transactionType=${transactionType}`,
            );
            refetchTransactCount();
            onClose();
        } catch (err) {
            console.error("Journal save failed:", err);
            showSnackbar("Failed to save journal match.", "error");
        }
    };

    if (isLoading || isFetching) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30vh" }}>
                <CustomCircularProgress size={40} />
            </Box>
        );
    }

    return (
        <Box sx={{ pt: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <MatchTableAtom
                columns={journalColumns}
                rows={journalRows}
                tableHeight="55vh"
                expandedRowIds={[]}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Tooltip title={!selectedJournalKey ? "Select atleast one journal for match" : ""}>
                    <span>
                        <PrimaryButton onClick={handleSave} disabled={!selectedJournalKey || isSaving}>
                            {isSaving ? "Saving..." : "Save"}
                        </PrimaryButton>
                    </span>
                </Tooltip>
            </Box>
        </Box>
    );
}