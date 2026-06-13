import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { Box } from "@mui/material";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { useState, useEffect } from "react";
import { Stack } from "@mui/system";
import { MultiSelectElement } from "../../../../../../components/atom/select-field/MultiSelect";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { useGetAllDepartmentsQuery } from "../../../people/department/api/department.api";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { type CreateOrganizationDocumentFolderRequest, type OrganizationDocumentFolder } from "../api/organization.api";

export const FolderModal = ({
    open,
    onClose,
    isEdit,
    editRow,
    onSave,
}: {
    open: boolean,
    onClose: () => void,
    isEdit: boolean,
    editRow?: OrganizationDocumentFolder | null,
    onSave: (data: CreateOrganizationDocumentFolderRequest) => void,
}) => {
    const [folderName, setFolderName] = useState("");
    const [folderDescription, setFolderDescription] = useState("");
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [employeeType, setEmployeeType] = useState<string>("");

    const { data: departmentsData } = useGetAllDepartmentsQuery();

    const departmentsOptions = departmentsData?.data
        ? [
            {
                label: "All Departments",
                value: "all"
            },
            ...departmentsData.data.map((department) => ({
                label: department.departmentName,
                value: String(department.id),
            }))
        ]
        : [];

    useEffect(() => {
        if (open && isEdit && editRow) {
            setFolderName(editRow.folderName);
            setFolderDescription(editRow.description);
            setSelectedDepartments(editRow.departments || []);
            setEmployeeType(editRow.employeeType);
        } else if (open && !isEdit) {
            clearForm();
        }
    }, [open, isEdit, editRow]);

    const clearForm = () => {
        setFolderName("");
        setFolderDescription("");
        setSelectedDepartments([]);
        setEmployeeType("");
    }

    const handleSave = () => {
        const payload: CreateOrganizationDocumentFolderRequest = {
            folderName: folderName.trim(),
            description: folderDescription.trim(),
            departments: selectedDepartments,
            employeeType: employeeType as any,
        };
        onSave(payload);
        // onClose();
        // clearForm();
    };

    const hasChanges = () => {
        return folderName.trim() !== editRow?.folderName ||
            folderDescription.trim() !== editRow?.description ||
            selectedDepartments !== editRow?.departments ||
            employeeType !== editRow?.employeeType;
    }
    const isValid = folderName.trim() !== "" && folderDescription.trim() !== "" && selectedDepartments.length > 0 && employeeType.trim() !== "";

    return (
        <ModalElement
            maxWidth="md"
            open={open}
            height={450}
            title={isEdit ? "Edit Folder" : "Add Folder"}
            onClose={() => {
                onClose();
                clearForm();
            }}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                "& .MuiDialog-paper": { width: { xs: "90vw", sm: 500, md: 800 }, margin: 2 },
            }}
        >
            <Box sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }} key={editRow?.id || "create"}>

                <Box sx={{ flex: 1, overflowY: "auto", pt: 1 }}>
                    <Stack spacing={2} gap={3} direction="column">
                        <TextFieldElement
                            fullWidth
                            label="Folder Name"
                            placeholder="Enter folder name"
                            value={folderName}
                            required
                            inputProps={{ maxLength: 255 }}
                            helperText={
                                folderName.length === 255
                                    ? "Maximum 255 characters reached"
                                    : `${folderName.length}/255`
                            }
                            error={folderName.length === 255}
                            onChange={(e) => setFolderName(e.target.value)}
                        />
                        <TextFieldElement
                            fullWidth
                            label="Folder Description"
                            placeholder="Enter folder description"
                            value={folderDescription}
                            inputProps={{ maxLength: 255 }}
                            helperText={
                                folderDescription.length === 255
                                    ? "Maximum 255 characters reached"
                                    : `${folderDescription.length}/255`
                            }
                            error={folderDescription.length === 255}
                            onChange={(e) => setFolderDescription(e.target.value)}
                            multiline
                            rows={2}
                            required
                        />

                        <Stack direction="row" spacing={2} gap={3} width="100%">
                            <MultiSelectElement
                                value={selectedDepartments}
                                onChange={(value) => {
                                    const departmentIds =
                                        departmentsData?.data.map((d) => String(d.id)) ?? [];

                                    if (value.includes("all")) {
                                        setSelectedDepartments(["all"]);
                                        return;
                                    }

                                    const isAllSelected =
                                        departmentIds.length > 0 &&
                                        departmentIds.every((id) => value.includes(id));

                                    if (isAllSelected) {
                                        setSelectedDepartments(["all"]);
                                    } else {
                                        setSelectedDepartments(value);
                                    }
                                }}
                                options={departmentsOptions}
                                label="Departments"
                                required
                                sx={{ flex: 1 }}
                            />

                            <SingleSelectElement
                                value={employeeType}
                                onChange={(value) => setEmployeeType(value)}
                                options={[{
                                    label: "All Employee Types",
                                    value: "all"
                                }, {
                                    label: "Permanent",
                                    value: "permanent"
                                }, {
                                    label: "Intern",
                                    value: "intern"
                                }]}
                                label="Employee Type"
                                required
                            />
                        </Stack>
                    </Stack>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        pt: 2,
                        mt: "auto",
                    }}
                >
                    <PrimaryButton
                        disabled={!isValid || !hasChanges()}
                        onClick={handleSave}
                    >
                        Save
                    </PrimaryButton>
                </Box>

            </Box>
        </ModalElement>
    );
}