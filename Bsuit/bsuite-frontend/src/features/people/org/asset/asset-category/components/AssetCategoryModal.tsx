import { Stack } from "@mui/system";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { Box } from "@mui/material";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { useState, useEffect } from "react";

export const AssetCategoryModal = ({ open, onSave, isEdit, onClose, categoryData }: any) => {

    const [categoryName, setAssetCategoryName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (open) {
            if (isEdit && categoryData) {
                setAssetCategoryName(categoryData.categoryName || "");
                setDescription(categoryData.description || "");
            } else {
                setAssetCategoryName("");
                setDescription("");
            }
        }
    }, [open, isEdit, categoryData]);

    const handleClose = () => {
        onClose();
        setAssetCategoryName("");
        setDescription("");
    }

    const handleSave = () => {
        const trimmedCategoryName = categoryName.trim();
        const trimmedDescription = description.trim();

        if (isEdit && categoryData?.id) {
            onSave(
                {
                    id: categoryData.id,
                    categoryName: trimmedCategoryName,
                    description: trimmedDescription
                }
            );
        } else {
            onSave(
                {
                    categoryName: trimmedCategoryName,
                    description: trimmedDescription
                }
            );
        }
    }

    const isValid = categoryName.trim() !== "" && description.trim() !== "";

    const hasChanges = isEdit && categoryData
        ? (categoryName !== (categoryData.categoryName || "") || description !== (categoryData.description || ""))
        : true;

    return (
        <ModalElement
            maxWidth="xs"
            open={open}
            height={800}
            title={isEdit ? "Edit Asset Category" : "Add Asset Category"}
            onClose={() => {
                handleClose();
            }}
            sx={{
                "& .MuiDialog-paper": { width: { xs: "90vw", sm: 500, md: 600 }, margin: 2 },
                height: "40vh"
            }}
        >
            <Box display='flex' flexDirection='column' justifyContent='center' height='100%' gap={2}>
                <Stack spacing={2.5}>
                    <TextFieldElement
                        fullWidth
                        required
                        label="Asset Name"
                        value={categoryName}
                        onChange={(e) => setAssetCategoryName(e.target.value)}
                    />
                    <TextFieldElement
                        label="Description"
                        value={description}
                        fullWidth
                        required
                        multiline
                        rows={2}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </Stack>

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <PrimaryButton
                        disabled={!isValid || !hasChanges}
                        onClick={handleSave}
                    >
                        Save
                    </PrimaryButton>
                </Box>
            </Box>
        </ModalElement>

    );
}
