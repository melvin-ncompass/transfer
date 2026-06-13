import CardAtom from "../../../../../components/atom/card/Card";
import { Box, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { InfoRow } from "./InfoRow";
import type { IPaymentInformation } from "../types/profile.types";
import { PrimaryIconButton } from "../../../../../components/atom/button";

interface Props {
    data: IPaymentInformation;
    onEdit?: () => void;
}

export default function PaymentInfoCard({ data, onEdit }: Props) {
    return (
        <CardAtom elevation={2} sx={{ height: "100%", p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                    Payment Information
                </Typography>
                {onEdit && <PrimaryIconButton icon={<EditIcon />} title="Edit" variant="outlined" onClick={onEdit} />}
            </Box>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 3,
                }}
            >
                <InfoRow label="Account Number" value={data.bankAccountNumber} />
                <InfoRow label="Account Holder Name" value={data.bankAccountHolderName} />
                <InfoRow label="Bank name" value={data.bankName} />
                <InfoRow label="Bank Branch" value={data.bankBranchName} />
                <InfoRow label="Bank IFSC Code" value={data.bankIfscCode} />
            </Box>
        </CardAtom>
    );
}
