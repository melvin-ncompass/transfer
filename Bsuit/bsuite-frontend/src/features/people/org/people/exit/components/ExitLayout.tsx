import { TabsAtom } from "../../../../../../components/tabs";
import ExitedEmployees from "./exited-employee/ExitedEmployees";
import { UnderReviewTab } from "./under-review/UnderReviewTab";
import { ExitProgressTab } from "./exit-progress/ExitProgressTab";
import type { TabItem } from "../../../../../../components/tabs";

const ExitLayout = () => {

    const tabs: TabItem[] = [
        { label: "Under review", content: <UnderReviewTab /> },
        { label: "Exit in progress", content: <ExitProgressTab /> },
        { label: "Exited employees", content: <ExitedEmployees /> }
    ];
    return (
        <TabsAtom
            tabs={tabs}
            tabSx={{ px: 2 }}
            contentSx={{ px: 2 }}
            sx={{ height: "100%" }}
        />
    );
};

export default ExitLayout;