import { useState } from "react";
import CardAtom from "../../../../../components/atom/card/Card";
import { Typography, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { InfoRow } from "./InfoRow";
import type { IAttendanceInformation } from "../types/profile.types";
import ShiftHistoryModal from "./ShiftHistoryModal";

interface Props {
    data: IAttendanceInformation;
    onEdit?: () => void;
    employeeId?: string | number;
    employeeName?: string;
}

export default function AttendanceInfoCard({ data, onEdit, employeeId, employeeName }: Props) {
    const [historyOpen, setHistoryOpen] = useState(false);

    return (
        <>
            <CardAtom elevation={2} sx={{ height: "100%", p: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>Attendance information</Typography>
                    <Box display="flex" gap={1}>
                        {onEdit && (
                            <PrimaryIconButton icon={<EditIcon />} title="Edit" variant="outlined" onClick={onEdit} />
                        )}
                    </Box>
                </Box>
                 <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 3,
                    
                }}
                
            >
                <InfoRow 
                    
                    label="Shift Info"
                    value={data.shiftInfo}
                    labelAction={
                        employeeId && data.isAttendanceEnabled !== false ? (
                            <PrimaryIconButton
                                icon={<HistoryIcon sx={{ fontSize: 25 }} />}
                                title="Shift History"
                                variant="outlined"
                                size="small"
                                onClick={() => setHistoryOpen(true)}
                                aria-label="Shift History"
                                sx={{ width: 28, height: 28, minWidth: 28 }}
                            />
                        ) : undefined
                    }
                />
                <InfoRow label="Leave Plan" value={data.leavePlan} />
                <InfoRow label="WeekOff Policy" value={data.weekoffPolicy} />
                <InfoRow label="Holiday Plan" value={data.holidayPlan} />
                </Box>
            </CardAtom>

            {employeeId && data.isAttendanceEnabled !== false && (
                <ShiftHistoryModal
                    open={historyOpen}
                    onClose={() => setHistoryOpen(false)}
                    employeeId={employeeId}
                    employeeName={employeeName}
                />
            )}
        </>
    );
}
