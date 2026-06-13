import { Box } from "@mui/material";
import { TabsAtom, type TabItem } from "../../../../components/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { EarningsView } from "./Earnings/EarningsView";
import { DeductionsView } from "./Deductions/DeductionsView";
import { Card } from "@mui/material";
import SalaryTemplateView, { type SalaryTemplateViewRef } from "./SalaryTemplate/SalaryTemplateView";
import { PrimaryIconButton } from "../../../../components/atom/button";
import AddIcon from "@mui/icons-material/Add";
import { useRef, useState, useMemo } from "react";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import type { EarningsSectionRef } from "./Earnings/components/EarningsSection";
import type { DeductionsSectionRef } from "./Deductions/components/DeductionsSection";
import { DocumentScanner, Download, MoneyOff, Upload } from "@mui/icons-material";
import { Stack } from "@mui/system";

// ----------
// Interfaces
// ----------
export interface TabSectionRef {
  openAddModal?: () => void;
  search?: (query: string) => void;
}

export const SalaryStructureView = () => {
  const navigate = useNavigate();
  // ---------------
  // State Variables
  // ---------------
  const [searchParams, setSearchParams] = useSearchParams();

  // Default to 0, or parse "subtab" if it exists in the query parameters
  const initialTab = parseInt(searchParams.get("subtab") || "0", 10);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state if URL changes externally
  useEffect(() => {
    const subtabParam = searchParams.get("subtab");
    if (subtabParam) {
      setActiveTab(parseInt(subtabParam, 10));
    }
  }, [searchParams]);

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
    setSearchParams((prev) => {
      prev.set("subtab", String(newValue));
      return prev;
    });
  };
  const earningsRef = useRef<EarningsSectionRef>(null);
  const deductionsRef = useRef<DeductionsSectionRef>(null);
  const templatesRef = useRef<SalaryTemplateViewRef>(null);

  // ------------------
  // Memoized Variables
  // ------------------
  const tabs: TabItem[] = useMemo(
    () => [
      {
        label: "Earnings",
        icon: <AttachMoneyIcon />,
        content: <EarningsView ref={earningsRef} />,
        ref: earningsRef,
      },
      {
        label: "Deductions",
        icon: <MoneyOff />,
        content: <DeductionsView ref={deductionsRef} />,
        ref: deductionsRef,
      },
      {
        label: "Templates",
        icon: <DocumentScanner />,
        content: (
          <SalaryTemplateView ref={templatesRef} />
        ),
        ref: templatesRef,
      },
    ],
    [],
  );

  // ---------------
  // Helper Function
  // ---------------
  const handleOpenModal = () => {
    tabs[activeTab]?.ref?.current?.openAddModal!();
  };

  // --
  // UI
  // --
  return (
    <Card
      elevation={2}
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box height={"100%"}>
        <TabsAtom
          tabs={tabs}
          sx={{ height: "100%" }}
          value={activeTab}
          contentSx={{ height: "100%" }}
          onChange={handleTabChange}
          action={
            <Stack direction={"row"} display={"flex"} alignItems={"center"} justifyContent={"center"} spacing={1}>
              {
                activeTab === 2 && <PrimaryIconButton icon={<Upload />} variant="outlined" onClick={() => { navigate("/people/salary/template/import"); }} />
              }
              <PrimaryIconButton
                icon={<AddIcon />}
                onClick={handleOpenModal}
                variant="outlined"
              />
            </Stack>
          }
        />
      </Box>
    </Card>
  );
};
