import { useState, useRef } from "react";
import { Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { TabsAtom, type TabItem } from "../../../../../components/tabs";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { AssetIdSeriesTab, type AssetIdSeriesTabRef } from "./components/AssetIdSeriesTab";
import { UnavailableStatusTab, type UnavailableStatusTabRef } from "./components/UnavailableStatusTab";
import { AssetConditionsTab, type AssetConditionsTabRef } from "./components/AssetConditionsTab";
import { AssetRequestSettingsTab } from "./components/AssetRequestSettingsTab";

export const AssetSettingsView = () => {
    const [activeTab, setActiveTab] = useState(0);
    const assetIdSeriesRef = useRef<AssetIdSeriesTabRef>(null);
    const unavailableStatusRef = useRef<UnavailableStatusTabRef>(null);
    const assetConditionsRef = useRef<AssetConditionsTabRef>(null);

    const tabs: TabItem[] = [
        {
            label: "Asset ID Series",
            content: <AssetIdSeriesTab ref={assetIdSeriesRef} />
        },
        {
            label: "Unavailable Status",
            content: <UnavailableStatusTab ref={unavailableStatusRef} />
        },
        {
            label: "Asset Conditions",
            content: <AssetConditionsTab ref={assetConditionsRef} />
        },
        {
            label: "Asset Request Settings",
            content: <AssetRequestSettingsTab />
        }
    ];

    // Show Add button on tabs that support it
    const showAddButton = activeTab === 0 || activeTab === 1 || activeTab === 2;

    const handleAddClick = () => {
        if (activeTab === 0) assetIdSeriesRef.current?.openAddModal();
        else if (activeTab === 1) unavailableStatusRef.current?.openAddModal();
        else if (activeTab === 2) assetConditionsRef.current?.openAddModal();
    };

    return (
        <Box height={"100%"} display={"flex"} flexDirection={"column"} gap={2} >
            <TabsAtom
                tabs={tabs}
                value={activeTab}
                onChange={setActiveTab}
                sx={{ height: "100%" }}
                scrollable
                contentSx={{ pt: 0, height: "100%" }}
                action={
                    showAddButton && (
                        <Box display="flex" alignItems="center" gap={2}>
                            <PrimaryIconButton
                                icon={<AddIcon />}
                                title="Add"
                                variant="outlined"
                                onClick={handleAddClick}
                            />
                        </Box>
                    )
                }
            />
        </Box>
    );
};
