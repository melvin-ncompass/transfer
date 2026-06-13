import {
    Box,
    Card,
    Typography,
    Stack,
    TextField,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { ContentCopy, Edit } from "@mui/icons-material";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import { Tooltip } from "../../../../components/atom/tooltip";
import { Snackbar } from "../../../../components/atom/snackbar";
import { PrimaryButton } from "../../../../components/atom/button";
import {
    useGetCustomDomainInfoQuery,
    useVerifyCustomDomainQuery,
} from "../api/customDomain.api";
import CustomDomainDialog from "./customDomainModal";
import { PermissionGuard } from "../../../../guards/ComponentGuard";
import { usePermission } from "../../../../context/PermissionContext";

export default function CustomDomainCard() {
    const {permissions} = usePermission();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const { data, refetch } = useGetCustomDomainInfoQuery();

    const hasDomain = !!data?.data?.customDomain;
    const customDomain = data?.data?.customDomain ?? "";
    const expectedCname = data?.data?.expectedCname ?? "";

    const { data: verifyData, isFetching: verifyingDomain, refetch: refetchVerify } = useVerifyCustomDomainQuery(undefined, {
        skip: !hasDomain
    });

    const isSaved = data?.data?.domainStatus === "ACTIVE";

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        color: "success" as "success" | "error",
    });

    const handleClose = () => {
        setIsModalOpen(false);
        refetch();
    };

    const handleCopyDomain = () => {
        navigator.clipboard.writeText(`https://${customDomain}`);
        setSnackbar({ open: true, message: "Domain copied!", color: "success" });
    };

    const handleCopyCname = () => {
        navigator.clipboard.writeText(expectedCname);
        setSnackbar({ open: true, message: "CNAME copied!", color: "success" });
    };

    const handleFinishSetup = async () => {
        const result = await refetchVerify();
        refetch();
        if (result.error) {
            setSnackbar({ open: true, message: "Domain not verified yet", color: "error" });
        } else {
            const message = result.data?.message ?? "Domain setup completed successfully!";
            setSnackbar({ open: true, message , color: "success" });
        }
    };

    return (
        <Card sx={{ p: 2.5, height: '100%' }}>
            <ModalElement
                open={isModalOpen}
                onClose={handleClose}
                title="Custom Domain"
                maxWidth="md"
            >
                <CustomDomainDialog
                    isEdit={isEdit}
                    handleClose={handleClose}
                    setSnackbar={setSnackbar}
                    existingDomain={customDomain}
                    existingCname={expectedCname}
                />
            </ModalElement>

            <Typography variant="h6" mb={3}>
                Custom Domain
            </Typography>

            {!hasDomain ? (
permissions.includes("manage_custom_domain_mapping") ? (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                        View the portal using your custom domain.
                    </Typography>
                    <PrimaryButton onClick={() => setIsModalOpen(true)}>Configure</PrimaryButton>
                </Stack>):(
                    <Typography variant="body2" color="text.secondary">
                        Custom domain setup is not configured. Please contact your administrator.
                    </Typography>
                )
            ) : (
                <Stack spacing={2}>
                    {/* Your Domain row */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 100 }}>
                            Your Domain:
                        </Typography>
                        <TextField
                            value={customDomain}
                            size="small"
                            fullWidth
                            disabled
                            InputProps={{
                                readOnly: true,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ pr: 1, borderRight: "1px solid", borderColor: "divider" }}
                                        >
                                            https://
                                        </Typography>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <IconButton size="small" onClick={handleCopyDomain}>
                            <ContentCopy fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => {
                                setIsModalOpen(true);
                                setIsEdit(true);
                            }}
                            sx={{ visibility: permissions.includes("manage_custom_domain_mapping") ? "visible" : "hidden"   }}
                        >
                            <Edit fontSize="small" />
                        </IconButton>
                    </Stack>

                    {/* CNAME row */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 100 }}>
                            CNAME:
                        </Typography>
                        <TextField
                            value={expectedCname}
                            size="small"
                            fullWidth
                            disabled
                            slotProps={{ input: { readOnly: true } }}
                        />
                        <IconButton size="small" onClick={handleCopyCname}>
                            <ContentCopy fontSize="small" />
                        </IconButton>
                        <IconButton size="small" disabled sx={{ visibility: "hidden" }}>
                            <Edit fontSize="small" />
                        </IconButton>
                    </Stack>

                    {/* Verification status */}
                   <PermissionGuard permission={"manage_custom_domain_mapping"}>
                     <Stack direction="row" justifyContent="space-between">

                        {isSaved ? (
                            <>
                                {!verifyingDomain ?
                                    <Alert severity="success" sx={{ py: 0.5, flex: 1 }}>
                                        Domain has been verified and ready for use.
                                    </Alert>
                                    : (
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Alert severity="warning" sx={{ py: 0.5, mr: 1, flex: 1 }}>
                                                Checking validity for verification status...
                                            </Alert>
                                            <CircularProgress size={16} />
                                        </Stack>
                                    )
                                }
                            </>
                        ) : (
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Alert severity="warning" sx={{ py: 0.5, flex: 1 }}>
                                    CNAME verification is pending.
                                </Alert>
                                {verifyingDomain && <CircularProgress size={16} />}
                            </Stack>
                        )}

                        {!isSaved && (
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Tooltip title={verifyingDomain && "Waiting for verification status"}>
                                    <PrimaryButton onClick={handleFinishSetup} disabled={verifyingDomain}>
                                        Verify and Finish Setup
                                    </PrimaryButton>
                                </Tooltip>
                            </Stack>
                        )}
                    </Stack>
                   </PermissionGuard>
                </Stack>
            )}

            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                />
            )}
        </Card>
    );
}