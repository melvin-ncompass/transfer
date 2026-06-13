import { useState } from "react";
import { TabsAtom, type TabItem } from "../../../../../components/tabs";
import UnderConstruction from "../../../../../pages/UnderConstruction";
import { PendingAssetAcknowledgement } from "./components/PendingAssetAcknowledgement";
import { CompletedAcknowledgementAssets } from "./components/CompletedAcknowledgementAssets";

export const AssetAcknowledgementView = () => {

    const [assetAcknowledgementActiveTab, setAssetAcknowledgementActiveTab] = useState(0);

    const assetAcknowledgementTabs: TabItem[] = [
        { label: "Pending Acknowledgement", content: <PendingAssetAcknowledgement /> },
        { label: "Completed Acknowledgement", content: <CompletedAcknowledgementAssets /> },
    ];

    return (
        <TabsAtom
            tabs={assetAcknowledgementTabs}
            value={assetAcknowledgementActiveTab}
            onChange={setAssetAcknowledgementActiveTab}
            scrollable
            sx={{
                height: "100%",
                "& .MuiTabScrollButton-root": {
                    display: { xs: "flex", lg: "none" },
                },
            }}
            contentSx={{
                pt: 1,
                height: "100%",
                overflow: "hidden",
            }}
        />
    );
};

