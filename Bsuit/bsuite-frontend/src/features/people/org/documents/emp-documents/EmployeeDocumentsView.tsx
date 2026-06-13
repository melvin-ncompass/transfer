import { EmployeeDocumentLayout } from "./components/EmpDocumentLayout";
import { TabsAtom } from "../../../../../components/tabs";
import { PendingDocumentsPage } from "./components/PendingDocuments";
import { PendingVerificationPage } from "./components/PendingVerification";
import { VerifiedDocumentsPage } from "./components/VerifiedDocuments";
import { useSearchParams } from "react-router-dom";

export const EmployeeDocumentsView = ({ hideTabs = false }: { hideTabs?: boolean }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = Number(searchParams.get("employeeDocsTab")) || 0;

  const handleTabChange = (newValue: number) => {
    setSearchParams((prev) => {
      prev.set("employeeDocsTab", String(newValue));
      return prev;
    });
  };

  const tabs = [
    {
      label: "Pending on Employee",
      content: <PendingDocumentsPage />,
    },
    {
      label: "Pending Verification",
      content: <PendingVerificationPage />,
    },
    {
      label: "Verified documents",
      content: <VerifiedDocumentsPage />,
    },
    {
      label: "Settings",
      content: <EmployeeDocumentLayout />,
    },
  ];

  if (hideTabs) {
    return tabs[activeTab]?.content ?? null;
  }

  return (
    <TabsAtom
      tabs={tabs}
      value={activeTab}
      onChange={handleTabChange}
      sx={{ height: "100%",overflow:"clip" }}
      contentSx={{ height: "100%", overflow: "clip" }}
    />
  );
};
