import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { useEffect, useState } from "react";
import { Stack } from "@mui/system";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import type {
    EmployeeFolderType,
    EmployeeFolderRequestType,
    PermissionsType
} from "../api/employee-doc.api";

type Role = "Employee (Self)" | "Reporting Manager" | "Admins";
type PermissionState = {
    [key in Role]: PermissionsType;
};
const roles: Role[] = [
    "Employee (Self)",
    "Reporting Manager",
    "Admins",
];

export const EmpFolderModal = ({
    open,
    onClose,
    isEdit,
    editRow,
    onSave,
}: {
    open: boolean,
    onClose: () => void,
    isEdit: boolean,
    editRow?: EmployeeFolderType | null,
    onSave: (folderData: EmployeeFolderRequestType) => void | Promise<void>,
}) => {
    const [folderName, setFolderName] = useState("");
    const [folderDescription, setFolderDescription] = useState("");

    const [permissions, setPermissions] = useState<PermissionState>({
        "Employee (Self)": {
            view: false,
            download: false,
            addUpdate: false,
        },
        "Reporting Manager": {
            view: false,
            download: false,
            addUpdate: false,
        },
        "Admins": {
            view: false,
            download: false,
            addUpdate: false,
        },
    });

    useEffect(() => {
        if (editRow) {
            setFolderName(editRow.documentFolderName);
            setFolderDescription(editRow.description);
            setPermissions({
                "Employee (Self)": editRow.employeeSelfPermission,
                "Reporting Manager": editRow.reportingManagerPermission,
                "Admins": editRow.globalAdminPermission,
            });
        }
    }, [editRow]);

    const hasChanges = folderName.trim() !== editRow?.documentFolderName || 
        folderDescription.trim() !== editRow?.description || 
        permissions["Employee (Self)"] !== editRow?.employeeSelfPermission || 
        permissions["Reporting Manager"] !== editRow?.reportingManagerPermission || 
        permissions["Admins"] !== editRow?.globalAdminPermission;

    const handleChange = (role: Role, type: keyof PermissionsType) => {
        setPermissions((prev) => {
            const updatedRolePermissions = {
                ...prev[role],
                [type]: !prev[role][type],
            };
            if (
                type === "view" &&
                prev[role].view &&
                (prev[role].download || prev[role].addUpdate)
            ) {
                return prev; 
            }
            if (
                (type === "download" || type === "addUpdate") &&
                !prev[role][type] 
            ) {
                updatedRolePermissions.view = true;
            }
            return {
                ...prev,
                [role]: updatedRolePermissions,
            };
        });
    };

    const handelClose = () => {
        if (!isEdit) {
            clearForm();
        }
        onClose();
    }

    const clearForm = () => {
        setFolderName("");
        setFolderDescription("");
        setPermissions({
            "Employee (Self)": {
                view: false,
                download: false,
                addUpdate: false,
            },
            "Reporting Manager": {
                view: false,
                download: false,
                addUpdate: false,
            },
            "Admins": {
                view: false,
                download: false,
                addUpdate: false,
            },
        });
    }

    const handleSave = async () => {
        const payload: EmployeeFolderRequestType = {
            documentFolderName: folderName.trim(),
            description: folderDescription.trim(),
            employeeSelfPermission: permissions["Employee (Self)"],
            reportingManagerPermission: permissions["Reporting Manager"],
            globalAdminPermission: permissions["Admins"],
        };
        try {
            await Promise.resolve(onSave(payload));
            clearForm();
            onClose();
        } catch {
            // Parent shows error; keep modal open and form as-is
        }
    };

    const hasAnyPermission = Object.values(permissions).some(
        (rolePerms) => rolePerms.view || rolePerms.download || rolePerms.addUpdate
    );

    const isValid = folderName.trim() !== "" && folderDescription.trim() !== "" && hasAnyPermission;

    const getDisabledReason = () => {
        if (isEdit && !hasChanges) {
            return "No changes made";
        }
        const reasons: string[] = [];
        if (folderName.trim() === "") {
            reasons.push("Folder Name is required");
        }
        if (folderDescription.trim() === "") {
            reasons.push("Folder Description is required");
        }
        if (!hasAnyPermission) {
            reasons.push("At least one permission must be assigned");
        }
        return reasons.join(", ");
    };

    return (
        <ModalElement
            maxWidth="md"
            open={open}
            title={isEdit ? "Edit Folder" : "Add Folder"}
            onClose={() => {
                handelClose();
                clearForm();
            }}
            sx={{
                "& .MuiDialog-paper": { width: { xs: "90vw", sm: 500, md: 800 }, margin: 2 }
            }}
        >
            <Box sx={{ p: 2 }} key={editRow?.id || "create"} >
                <Stack spacing={1.5} gap={3} direction="column">
                    <TextFieldElement
                        fullWidth
                        label="Folder Name"
                        placeholder="Enter folder name"
                        value={folderName}
                        required
                        onChange={(e) => setFolderName(e.target.value)}
                        inputProps={{ maxLength: 100 }}
                    />
                    <TextFieldElement
                        fullWidth
                        label="Folder Description"
                        placeholder="Enter folder description"
                        value={folderDescription}
                        onChange={(e) => setFolderDescription(e.target.value)}
                        multiline
                        rows={2}
                        required
                        inputProps={{ maxLength: 500 }}
                    />

                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            Permissions
                        </Typography>

                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Role</strong></TableCell>
                                    <TableCell align="center">
                                        <strong>View Documents</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Download Documents</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Add or Update Documents</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role}>
                                        <TableCell>{role}</TableCell>

                                         <TableCell align="center">
                                             {permissions[role].download || permissions[role].addUpdate ? (
                                                 <Tooltip title="View Documents is required to Add or Update Documents" placement="top">
                                                     <Checkbox
                                                         disabled={true}
                                                         checked={permissions[role].view}
                                                         onChange={() => handleChange(role, "view")}
                                                     />
                                                 </Tooltip>
                                             ) : (
                                                 <Checkbox
                                                     disabled={false}
                                                     checked={permissions[role].view}
                                                     onChange={() => handleChange(role, "view")}
                                                 />
                                             )}
                                         </TableCell>

                                        <TableCell align="center">
                                            <Checkbox
                                                checked={permissions[role].download}
                                                onChange={() => handleChange(role, "download")}
                                            />
                                        </TableCell>

                                        <TableCell align="center">
                                            <Checkbox
                                                checked={permissions[role].addUpdate}
                                                onChange={() => handleChange(role, "addUpdate")}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                    </Box>
                </Stack>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                {!hasChanges || !isValid ? (
                    <Tooltip title={getDisabledReason()} placement="top">
                        <PrimaryButton
                            disabled={true}
                            onClick={() => {
                                void handleSave();
                            }}
                        >
                            Save
                        </PrimaryButton>
                    </Tooltip>
                ) : (
                    <PrimaryButton
                        disabled={false}
                        onClick={() => {
                            void handleSave();
                        }}
                    >
                        Save
                    </PrimaryButton>
                )}
            </Box>
        </ModalElement>
    );
}