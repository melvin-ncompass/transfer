import CardAtom from "../../../../../components/atom/card/Card";
import { Typography, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { InfoRow } from "./InfoRow";
import type { IPayrollInformation } from "../types/profile.types";

interface Props {
    data: IPayrollInformation;
    onEdit?: () => void;
}

export default function PayrollInfoCard({ data, onEdit }: Props) {
    return (
        <CardAtom elevation={2} sx={{ height: "100%", p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>Payroll Information</Typography>
                {onEdit && <PrimaryIconButton icon={<EditIcon />} title="Edit" variant="outlined" onClick={onEdit} />}
            </Box>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 3,
                }}
            >
                <InfoRow label="Salary Template Name" value={data.salaryTemplateName ?? ""} />
                <InfoRow label="Income Tax Config" value={data.incomeTaxConfig} />
                <InfoRow label="UAN Number" value={data.uanNumber} />
                <InfoRow label="PF Number" value={data.pfNumber} />
                <InfoRow label="PF Enabled" value={data.pfEnabled ? "Yes" : "No"} />
            </Box>
        </CardAtom>
    );
}

