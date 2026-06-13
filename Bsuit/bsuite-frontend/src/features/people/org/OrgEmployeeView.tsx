import { useState } from "react";
import { Badge, Box, Card, InputAdornment } from "@mui/material";
import { Search } from "@mui/icons-material";
import FilterListIcon from "@mui/icons-material/FilterList";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { TextFieldElement } from "../../../components/atom/text-field";
import { PrimaryIconButton } from "../../../components/atom/button";
import { PeopleProvider, type PeopleContextValue } from "./people/context/PeopleContext";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { SingleSelectElement } from "../../../components/atom/select-field/SingleSelect";
import UnderConstruction from "../../../pages/UnderConstruction";
import { DirectoryFiltersModal } from "./people/directory/components/DirectoryFiltersModal";
import type { EmployeeFilterParams } from "./people/directory/api/directory.api";
import OrgChartView from "./people/orgChart/components/OrgChartView";

export interface OrgEmployeeViewProps {
  departmentOptions: { label: string; value: string }[];
  designationOptions: { label: string; value: string }[];
  peopleContextValue: PeopleContextValue;
  onFilterOpen?: () => void;
}

/**
 * Org view for anyone who is not a People admin (employees, managers without admin, etc.).
 * Two tabs: Employees (Organization Tree; directory sub-tab may be enabled separately), Hiring (Under construction).
 */
export default function OrgEmployeeView({
  departmentOptions,
  designationOptions,
  peopleContextValue,
  onFilterOpen,
}: OrgEmployeeViewProps) {
  const [mainTab, setMainTab] = useState(0);
  const [employeesSubTab, setEmployeesSubTab] = useState(0);
  const [directorySearchText, setDirectorySearchText] = useState("");
  const [directoryFiltersOpen, setDirectoryFiltersOpen] = useState(false);
  const [directoryFilters, setDirectoryFilters] = useState<EmployeeFilterParams>({});

  const mainTabs = [
    { label: "Employees" },
    { label: "Hiring" },
    { label: "Helpdesk" },
  ];

  const employeesSubTabs = [
    // {
    //   label: "Employee Directory",
    //   content: (
    //     <DirectoryTab
    //       searchQuery={directorySearchText}
    //       filters={directoryFilters}
    //     />
    //   ),
    // },
    {
      label: "Organization Tree",
      content: (
        <Box
          height="100%"
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <OrgChartView />
        </Box>
      ),
    },
  ];

  const subTabsMap: Record<number, { label: string; content: React.ReactNode }[]> = {
    0: employeesSubTabs,
    1: [],
    2: [],
  };

  const currentSubTabs = subTabsMap[mainTab] ?? [];
  const mainTabOptions = mainTabs.map((t, i) => ({ label: t.label, value: String(i) }));
  const subTabOptions = currentSubTabs.map((t, i) => ({ label: t.label, value: String(i) }));

  const handleSubTabSelectChange = (val: string) => {
    setEmployeesSubTab(parseInt(val, 10));
  };

  const activeEmployeesContent = employeesSubTabs[employeesSubTab]?.content ?? null;
  const showEmployeesToolbar = mainTab === 0 && employeesSubTab === 0;

  return (
    <>
      <Card
        elevation={2}
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: 2,
        }}
      >
        {/* ---- Breadcrumb selects row ---- */}
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap" width="100%">
          <Box display="flex" alignItems="center" gap={1.5}>
            <SingleSelectElement
              sx={{ width: 220 }}
              label=""
              value={String(mainTab)}
              onChange={(val) => setMainTab(parseInt(val, 10))}
              options={mainTabOptions}
              variant="people"
            />
            {subTabOptions.length > 0 && (
              <>
                <ArrowForwardIosIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                <SingleSelectElement
                  sx={{ width: 220 }}
                  label=""
                  value={String(employeesSubTab)}
                  onChange={handleSubTabSelectChange}
                  options={subTabOptions}
                  variant="people"
                />
              </>
            )}
          </Box>

          {/* ---- Search + Filter toolbar ---- */}
          {showEmployeesToolbar && (
            <Box display="flex" gap={1} ml="auto">
              <TextFieldElement
                width={250}
                label=""
                value={directorySearchText}
                onChange={(e) => setDirectorySearchText(e.target.value)}
                placeholder="Search employees"
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
              <Badge
                badgeContent={Object.keys(directoryFilters).length}
                color="primary"
                overlap="circular"
                showZero={false}
              >
                <PrimaryIconButton
                  icon={<FilterListIcon />}
                  title="Filters"
                  variant="outlined"
                  onClick={() => {
                    onFilterOpen?.();
                    setDirectoryFiltersOpen(true);
                  }}
                />
              </Badge>
              {Object.keys(directoryFilters).length > 0 && (
                <PrimaryIconButton
                  icon={<RestartAltIcon />}
                  title="Clear filters"
                  variant="outlined"
                  onClick={() => setDirectoryFilters({})}
                />
              )}
            </Box>
          )}
        </Box>

        {/* ---- Active content ---- */}
        <Box flex={1} overflow="hidden">
          {mainTab === 0 && (
            <PeopleProvider value={peopleContextValue}>
              {activeEmployeesContent}
            </PeopleProvider>
          )}
          {mainTab === 1 && <UnderConstruction />}
          {mainTab === 2 && <UnderConstruction />}
        </Box>
      </Card>
      <DirectoryFiltersModal
        open={directoryFiltersOpen}
        onClose={() => setDirectoryFiltersOpen(false)}
        initialValues={directoryFilters}
        onApply={(filters) => {
          setDirectoryFilters(filters);
          setDirectoryFiltersOpen(false);
        }}
        departmentOptions={departmentOptions}
        designationOptions={designationOptions}
      />
    </>
  );
}
