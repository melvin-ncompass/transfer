import { Box } from "@mui/material";
import { TabsAtom, type TabItem } from "../../../../components/tabs";
import { MeOrgDocumentLayout } from "./components/org-docs/meOrgDocuments";
import EmpDocsView from "./components/empDocs/EmpDocsView";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

function MeDocumentsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubTab = Number(searchParams.get("subtab") ?? 0);
  const [subTab, setSubTab] = useState(initialSubTab);

  useEffect(() => {
    const subtabParam = searchParams.get("subtab");
    if (subtabParam !== null) {
      setSubTab(Number(subtabParam));
    }
  }, [searchParams]);

  const handleSubTabChange = (newValue: number) => {
    setSubTab(newValue);
    setSearchParams((prev) => {
      prev.set("subtab", String(newValue));
      return prev;
    });
  };

  const tabs: TabItem[] = [
    {
      label: "Employee Documents",
      content: <EmpDocsView />
    },
    {
      label: "Organization Documents",
      content: <MeOrgDocumentLayout />,
    },
  ];
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TabsAtom 
        tabs={tabs} 
        value={subTab} 
        onChange={handleSubTabChange} 
        contentSx={{ flex: 1, overflow: "auto" }}
      />
    </Box>
  );
}

export default MeDocumentsView;
