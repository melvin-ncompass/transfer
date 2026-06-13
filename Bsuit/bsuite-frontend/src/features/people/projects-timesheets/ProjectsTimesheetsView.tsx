import { Box, Card, InputAdornment } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AccountTree, AccessTime, Settings, Add, Search } from "@mui/icons-material";
import { TabsAtom, type TabItem } from "../../../components/tabs";
import type { TabSectionRef } from "../salary/structure/SalaryStructureView";
import { PrimaryIconButton } from "../../../components/atom/button";
import { TextFieldElement } from "../../../components/atom/text-field";
import ProjectsView from "./projects/ProjectsView";
import TimesheetsView from "./timesheets/TimesheetsView";
import SettingsView from "./settings/SettingsView";

const ProjectsTimesheetsView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubTab = parseInt(searchParams.get("subtab") || "0", 10);
  const [activeTab, setActiveTab] = useState(initialSubTab);
  const [searchText, setSearchText] = useState("");

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

  const projectsRef = useRef<TabSectionRef>(null);
  const timesheetsRef = useRef<TabSectionRef>(null);

  const tabs: TabItem[] = useMemo(
    () => [
      {
        label: "Projects",
        icon: <AccountTree />,
        content: <ProjectsView ref={projectsRef} />,
        ref: projectsRef,
      },
      {
        label: "Time Sheets",
        icon: <AccessTime />,
        content: <TimesheetsView ref={timesheetsRef} />,
        ref: timesheetsRef,
      },
      {
        label: "Settings",
        icon: <Settings />,
        content: <SettingsView />,
      },
    ],
    [],
  );

  const handleOpenModal = () => {
    tabs[activeTab]?.ref?.current?.openAddModal?.();
  };

  const handleSearch = () => {
    if (tabs[activeTab]?.ref?.current?.search) {
      tabs[activeTab]?.ref?.current?.search(searchText);
    }
  };

  useEffect(() => {
    if (activeTab !== 0) return;
    handleSearch();
  }, [searchText, activeTab]);

  const showProjectsActions = activeTab === 0;

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
      <Box>
        <TabsAtom
          tabs={tabs}
          value={activeTab}
          onChange={handleTabChange}
          action={
            showProjectsActions && (
              <Box
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                width={"100%"}
                gap={2}
              >
                <Box display={"flex"}>
                  <TextFieldElement
                    label={""}
                    fullWidth
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={`Search ${tabs[activeTab]?.label || "Projects"}`}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
                <PrimaryIconButton
                  icon={<Add />}
                  variant="outlined"
                  onClick={handleOpenModal}
                />
              </Box>
            )
          }
        />
      </Box>
    </Card>
  );
};

export default ProjectsTimesheetsView;
