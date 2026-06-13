import CardAtom from "../../../../../components/atom/card/Card";
import { Typography, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { InfoRow } from "./InfoRow";
import type { IBasicInformation } from "../types/profile.types";
import { formatDateShort } from "../../../../../utils/numberFormatter";

interface Props {
    data: IBasicInformation;
    onEdit?: () => void;
}

export default function BasicInfoCard({ data, onEdit }: Props) {
    return (
        <CardAtom elevation={2} sx={{ height: "100%", p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>Basic Information</Typography>
                {onEdit && <PrimaryIconButton icon={<EditIcon />} title="Edit" variant="outlined" onClick={onEdit} />}
            </Box>
          
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 3,
                    py: 2,
                }}
            >
                <InfoRow label="Employee ID" value={data.employeeId} />
                <InfoRow label="First Name" value={data.firstName} />
                <InfoRow label="Middle Name" value={data.middleName} />
                <InfoRow label="Last Name" value={data.lastName} />
                <InfoRow label="Gender" value={data.gender.charAt(0).toUpperCase() + data.gender.slice(1)} />
                <InfoRow label="Work Email" value={data.workEmail} />
                <InfoRow label="Date of Joining" value={formatDateShort(data.dateOfJoining)} />
                <InfoRow label="Employee Type" value={data.employeeType.charAt(0).toUpperCase() + data.employeeType.slice(1)} />
                <InfoRow label="Designation" value={data.designation} />
                <InfoRow label="Department" value={data.department} />
                <InfoRow label="Sub-department" value={data.subDepartment || "-"} />
                <InfoRow label="Reporting To" value={data.reportingTo} />
                <InfoRow label="Expense Policy" value={data.expensePolicy} />
            </Box>
        </CardAtom>
    );
}

