import { Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DatePickerElement } from "../../../../../components/atom/date-picker";
import dayjs, { Dayjs } from "dayjs";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import type { Dispatch, SetStateAction } from "react";

export type OpeningBalanceLine = {
    accountId: string;
    debit: string | number;
    credit: string | number;
    fxRate: number;
};

type OpeningBalanceProps = {
    items: OpeningBalanceLine[];
    setItems: Dispatch<SetStateAction<OpeningBalanceLine[]>>;
    initialItem: OpeningBalanceLine;
    date: Dayjs | null;
    setDate: (val: Dayjs | null) => void;
    onChange?: Dispatch<SetStateAction<any[]>>;
    dateRangeData?: any;
};


export default function OpeningBalanceAdd({
    initialItem,
    setItems,
    items,
    onChange,
    date,
    dateRangeData,
    setDate
}: OpeningBalanceProps) {
    const handleAdd = () => {
        const newItem =
            typeof initialItem === "object" && initialItem !== null
                ? { ...(initialItem as any) }
                : (initialItem as any);

        const newItems = [...items, newItem];
        setItems(newItems);
        onChange?.(newItems);
    };
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, pr: 1.5, pb: 1.5, borderBottom: 1, borderColor: "divider", }}>
            <DatePickerElement
                label="Date"
                value={date ? dayjs(date) : null}
                min={
                    dateRangeData?.data?.openingBalanceExists
                        ? dayjs(dateRangeData?.data.minDate)
                        : null
                }
                onChange={(val) => setDate(val ?? null)}
                required
            />
            <PrimaryIconButton
                title="Add row"
                icon={<AddIcon />}
                onClick={handleAdd}
                sx={{ textTransform: "none", ml: 2 }}
            />
        </Box>
    )
}