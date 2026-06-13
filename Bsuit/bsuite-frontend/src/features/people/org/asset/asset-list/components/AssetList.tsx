import { Box, useTheme, Typography, List, ListItemButton, ListItemText, alpha } from "@mui/material";
import { useEffect, useState } from "react";
import Skeleton from "../../../../../../components/atom/skeleton/Skeleton";
import { Snackbar } from "../../../../../../components/atom/snackbar";

import { AssetListPanel } from "./AssetListPanel";
import { 
    useGetAssetCategoriesQuery, 
    type AssetCategoryType, 
    type AssetType,
} from "../../asset-category/api/assetCategory.api";

export const AssetList = () => {
    const theme = useTheme();

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        color: "success" as "success" | "error",
    });
    
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    
    const { 
        data: assetCategories, 
        isLoading,  
        isFetching 
    } = useGetAssetCategoriesQuery();

    const selectedCategory = assetCategories?.find(c => c.id === selectedCategoryId) || null;
    const selectedType = selectedCategory?.assetTypes?.find(t => t.id === selectedTypeId) || null;
    
    
    useEffect(() => {
        if (assetCategories?.length) {
            const currentCat = assetCategories.find(c => c.id === selectedCategoryId);
            const currentType = currentCat?.assetTypes?.find(t => t.id === selectedTypeId);

            if (!currentType) {
                const firstCategoryWithType = assetCategories.find(c => c.assetTypes && c.assetTypes.length > 0);
                if (firstCategoryWithType?.assetTypes?.[0]) {
                    const firstType = firstCategoryWithType.assetTypes[0];
                    if (firstCategoryWithType.id !== undefined && firstType.id !== undefined) {
                        if (selectedCategoryId !== firstCategoryWithType.id) setSelectedCategoryId(firstCategoryWithType.id);
                        if (selectedTypeId !== firstType.id) setSelectedTypeId(firstType.id);
                    }
                }
            }
        }
    }, [assetCategories, selectedCategoryId, selectedTypeId]);

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    height: "100%",
                    overflow: "hidden",
                    pb: 0,
                }}
            >
                <Box
                    sx={{
                        flex: "0 0 16%",
                        borderRight: `1px solid ${theme.palette.divider}`,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                    }}
                >
                    {/* Folder Panel */}
                    <Box
                        sx={{
                            px: 1,
                            py: 0.5,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <Typography variant="subtitle2">Asset List</Typography>
                    </Box>

                    <Box sx={{ flex: 1, overflowY: "auto" }}>
                        {isLoading || isFetching ? (
                            <Box sx={{ px: 1, pt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} height={48} />
                                ))}
                            </Box>
                        ) : (
                            <List
                                className="folder-list"
                                sx={{
                                    borderRadius: 1,
                                    flex: 1,
                                    minHeight: 0,
                                    pr: 1,
                                }}
                            >
                                {!assetCategories || assetCategories.length === 0 ? (
                                    <Box sx={{ p: 2, textAlign: "center" }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No categories available
                                        </Typography>
                                    </Box>
                                ) : (
                                    assetCategories.map((category: AssetCategoryType) => (
                                        <Box key={category.id}>
                                            {/* CATEGORY HEADER */}
                                            <Typography
                                                color="textSecondary"
                                                variant="body1"
                                                sx={{
                                                    px: 1.5,
                                                    py: 0.4,
                                                    mb: 0.5,
                                                    bgcolor: theme.palette.grey[100],
                                                }}
                                            >
                                                {category.categoryName}
                                            </Typography>

                                            {/* ASSET TYPES */}
                                            {category.assetTypes?.map((type: AssetType) => {
                                                const isSelected = selectedType?.id === type.id;

                                                return (
                                                    <ListItemButton
                                                        key={type.id}
                                                        selected={isSelected}
                                                        onClick={() => {
                                                            setSelectedTypeId(type.id ?? null);
                                                            setSelectedCategoryId(category.id);
                                                        }}
                                                        sx={{
                                                            pl: 3,
                                                            borderRadius: 1,
                                                            mb: 0.5,
                                                            py: 0.25,
                                                            minHeight: 20,
                                                            bgcolor: isSelected
                                                                ? alpha(theme.palette.primary.main, 0.16)
                                                                : "transparent",
                                                            color: isSelected ? "primary.main" : "text.primary",
                                                            "&:hover": {
                                                                bgcolor: isSelected
                                                                    ? alpha(theme.palette.primary.main, 0.24)
                                                                    : "action.hover",
                                                            },
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={type.typeName}
                                                            slotProps={{
                                                                primary: {
                                                                    variant: "body2"
                                                                }
                                                            }}
                                                        />
                                                    </ListItemButton>
                                                );
                                            })}
                                        </Box>
                                    ))
                                )}
                            </List>
                        )}
                    </Box>
                </Box>

                {/* Document Panel */}
                <Box
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        pl: 3,
                    }}
                >
                    <AssetListPanel
                        activeType={selectedType}
                        activeCategory={selectedCategory}
                    />
                </Box>
            </Box>

            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                />
            )}
        </>
    );
}