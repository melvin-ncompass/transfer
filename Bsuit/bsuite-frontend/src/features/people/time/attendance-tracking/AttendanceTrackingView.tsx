import { forwardRef, useState } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import {
    AttendanceTrackingDetails,
    type AttendanceTrackingRef,
} from "./components/AttendanceTrackingDetails";
import { useGetNextPayableQuery } from "../../salary/payrun/runpayroll/api/payrun.api";



export const AttendanceTrackingView = forwardRef<AttendanceTrackingRef>(
    (_props, ref) => {
        const { data } = useGetNextPayableQuery();
        const [startDate, setStartDate] = useState<Dayjs>(() => dayjs(data?.payableDate).startOf("month"));
        const [endDate, setEndDate] = useState<Dayjs>(() => dayjs(data?.payableDate));

        return (
            <AttendanceTrackingDetails
                ref={ref}
                startDate={startDate}
                endDate={endDate}
                onDateRangeChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                }}
            />
        );
    },
);

export default AttendanceTrackingView;