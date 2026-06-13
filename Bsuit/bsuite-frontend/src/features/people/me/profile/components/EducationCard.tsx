import CardAtom from "../../../../../components/atom/card/Card";
import { Typography, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { InfoRow } from "./InfoRow";
import type { IEducationInformation } from "../types/profile.types";

interface Props {
    data: IEducationInformation;
    onEdit: () => void;
}

export default function EducationCard({ data, onEdit }: Props) {
    return (
        <CardAtom elevation={2} sx={{ height: "100%", p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>Education Information</Typography>
                <PrimaryIconButton icon={<EditIcon />} title="Edit" variant="outlined" onClick={onEdit} />
            </Box>
             <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 3,
                }}
            >
            <InfoRow label="Branch/Specialization" value={data.branch} />
            <InfoRow label="CGPA/Percentage" value={data.cgpa} />
            <InfoRow label="Degree" value={data.degree} />
            <InfoRow label="University/College" value={data.university} />
            <InfoRow label="Tenure" value={data.tenure} />
            </Box>
        </CardAtom>
    );
}
