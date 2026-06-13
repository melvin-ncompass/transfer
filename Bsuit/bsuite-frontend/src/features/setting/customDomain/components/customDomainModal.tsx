import {
    Stack,
    Typography,
    InputAdornment,
    TextField,
    Divider,
    IconButton,
    List,
    ListItem,
} from "@mui/material";
import { useRef, useState } from "react";
import { Edit, ContentCopy, CheckCircle } from "@mui/icons-material";
import { PrimaryButton } from "../../../../components/atom/button";
import { Tooltip } from "../../../../components/atom/tooltip";
import {
    useLazyCheckCustomDomainExistsQuery,
    useSaveCustomDomainMutation,
} from "../api/customDomain.api";

interface CustomDomainDialogProps {
    isEdit: boolean;
    handleClose: () => void;
    setSnackbar: (s: { open: boolean; message: string; color: "success" | "error" }) => void;
    existingDomain?: string;
    existingCname?: string;
}

export default function CustomDomainDialog({
    isEdit,
    handleClose,
    setSnackbar,
    existingDomain,
    existingCname
}: CustomDomainDialogProps) {
    const [domain, setDomain] = useState(existingDomain ?? "");
    const [submittedDomain, setSubmittedDomain] = useState(existingDomain ?? "");
    const [isMapped, setIsMapped] = useState(!!existingDomain);
    const [isEditing, setIsEditing] = useState(!existingDomain || isEdit);
    const [cnameValue, setCnameValue] = useState(existingCname ?? "");
    const [cnameHost, setCnameHost] = useState(existingDomain ?? "");

    const domainRef = useRef(domain);

    const [checkExists, { isLoading: isChecking }] = useLazyCheckCustomDomainExistsQuery();
    const [saveCustomDomain, { isLoading: isSaving }] = useSaveCustomDomainMutation();

    const handleProceed = async () => {
        if (!domain.trim()) return;
        try {
            const res = await checkExists({ customDomain: domain }).unwrap();
            if (res.data.noChange === false) {
                setSnackbar({ open: true, message: res.message, color: "error" });
                return;
            }
            setSubmittedDomain(domain);
            setCnameValue(res.data.value ?? "");
            setIsMapped(true);
            setIsEditing(false);
        } catch (error: any) {
            setSnackbar({ open: true, message: error?.data?.message ?? "Domain check failed. Please try again.", color: "error" });
        }
    };

    const handleVerify = async () => {
        try {
            const res = await saveCustomDomain({ customDomain: submittedDomain }).unwrap();
            setCnameHost(res.data.host);
            setSnackbar({ open: true, message: res.message, color: "success" });
            handleClose();
        } catch (error: any) {
            setSnackbar({ open: true, message: error?.data?.message ?? "Verification failed. Please try again.", color: "error" });
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(cnameValue);
        setSnackbar({ open: true, message: "Copied to clipboard!", color: "success" });
    };

    return (
        <Stack spacing={3} px={1} pb={1}>
            <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={600}>1. Domain Mapping</Typography>
                <Typography variant="body2" color="text.secondary">Enter your custom domain:</Typography>

                <Stack direction="row" spacing={1.5} alignItems="center" pb={!isMapped ? 2 : ''}>
                    <TextField
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="Enter your custom domain (app.custom.domain)"
                        disabled={!isEditing}
                        fullWidth
                        size="small"
                        InputProps={{
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
                            endAdornment: isMapped && !isEditing ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setIsEditing(true)}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                    />
                    {isEditing && (
                        <PrimaryButton onClick={handleProceed} disabled={isChecking || !domain.trim()}>
                            Proceed
                        </PrimaryButton>
                    )}
                </Stack>

                {isMapped && !isEditing && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <CheckCircle sx={{ fontSize: 16, color: "success.main" }} />
                        <Typography variant="body2" color="success.main">
                            Custom Domain has been mapped for your organization
                        </Typography>
                    </Stack>
                )}
            </Stack>

            {isMapped && !isEditing && (
                <>
                    <Divider />
                    <Stack spacing={1.5}>
                        <Typography variant="subtitle1" fontWeight={600}>2. Create CNAME</Typography>
                        <Typography variant="body2">
                            To connect your custom domain to the client portal, please follow these steps{" "}
                            <strong>before submitting your domain</strong>:
                        </Typography>

                        <List dense disablePadding sx={{ pl: 1 }}>
                            <ListItem disableGutters sx={{ display: "list-item" }}>
                                <Typography variant="body2" fontWeight={600}>Step 1: Access Your DNS Settings</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Log in to your domain registrar's website and navigate to the{" "}
                                    <strong>DNS Management</strong> or <strong>DNS Settings section</strong>.
                                </Typography>
                            </ListItem>

                            <ListItem disableGutters sx={{ display: "list-item", mt: 1 }}>
                                <Typography variant="body2" fontWeight={600}>Step 2: Create a CNAME Record</Typography>
                                <Typography variant="body2" color="text.secondary" mb={1}>
                                    Add a new <strong>CNAME</strong> record with the following details:
                                </Typography>
                                <List dense disablePadding sx={{ pl: 2 }}>
                                    <ListItem disableGutters>
                                        <Typography variant="body2">• <strong>Host / Name:</strong> {cnameHost || submittedDomain}</Typography>
                                    </ListItem>
                                    <ListItem disableGutters>
                                        <Typography variant="body2">• <strong>Type:</strong> CNAME</Typography>
                                    </ListItem>
                                    <ListItem disableGutters>
                                        <Stack direction="row" alignItems="center" spacing={1} mt={0.5} width="100%">
                                            <Typography variant="body2" whiteSpace="nowrap">• <strong>Value / Points to:</strong></Typography>
                                            <TextField value={cnameValue} disabled size="small" slotProps={{ input: { readOnly: true } }} sx={{ flex: 1 }} />
                                            <IconButton size="small" onClick={handleCopy}><ContentCopy fontSize="small" /></IconButton>
                                        </Stack>
                                    </ListItem>
                                    <ListItem disableGutters>
                                        <Typography variant="body2">
                                            • <strong>TTL (Time To Live):</strong> 3600 seconds{" "}
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                (or the default value provided by your registrar)
                                            </Typography>
                                        </Typography>
                                    </ListItem>
                                </List>
                            </ListItem>

                            <ListItem disableGutters sx={{ display: "list-item", mt: 1 }}>
                                <Typography variant="body2" fontWeight={600}>Step 3: Save and Wait</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Save the DNS settings. Please note that DNS changes may take anywhere from{" "}
                                    <strong>a few minutes to a few hours</strong> to propagate globally.
                                </Typography>
                            </ListItem>

                            <ListItem disableGutters sx={{ display: "list-item", mt: 1 }}>
                                <Typography variant="body2" fontWeight={600}>Step 4: Verify Your Domain</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Once the DNS has propagated, return to the portal and click{" "}
                                    <strong>"Verify"</strong> to confirm your custom domain.
                                </Typography>
                            </ListItem>
                        </List>
                    </Stack>

                    <Stack direction="row" justifyContent="flex-end">
                        <Tooltip title={domain === domainRef.current ? "No changes to save" : ""}>
                            <PrimaryButton onClick={handleVerify} disabled={isSaving || domain === domainRef.current}>
                                Save
                            </PrimaryButton>
                        </Tooltip>
                    </Stack>
                </>
            )}
        </Stack>
    );
}