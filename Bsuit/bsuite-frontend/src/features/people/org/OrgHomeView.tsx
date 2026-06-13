import { useState, useRef, useEffect, useMemo } from "react";
import { Badge, Box, Card, InputAdornment } from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useGetEmployeeInfoQuery } from "../api/people.api";
import PeopleIcon from "@mui/icons-material/People";
import DescriptionIcon from "@mui/icons-material/Description";
import PaidIcon from "@mui/icons-material/Paid";
import DevicesOtherIcon from "@mui/icons-material/DevicesOther";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import { Download, Search, Upload } from "@mui/icons-material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FilterListIcon from "@mui/icons-material/FilterList";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AddIcon from "@mui/icons-material/Add";
import type { TabItem } from "../../../components/tabs";
import { SingleSelectElement } from "../../../components/atom/select-field/SingleSelect";
import { TextFieldElement } from "../../../components/atom/text-field";
import { PrimaryIconButton } from "../../../components/atom/button";
import PeopleSettingsView from "./people/settings/PeopleSettingsView";
import {
  PeopleProvider,
  type PeopleContextValue,
} from "./people/context/PeopleContext";
import UnderConstruction from "../../../pages/UnderConstruction";
import {
  DesignationSection,
  type DesignationSectionRef,
} from "./people/designation/components/DesignationSection";
import {
  DepartmentTreeView,
  type DepartmentTreeViewRef,
} from "./people/department/components/DepartmentTreeView";
import { DirectoryTab } from "./people/directory/components/DirectoryTab";
import { DirectoryFiltersModal } from "./people/directory/components/DirectoryFiltersModal";
import type { EmployeeFilterParams } from "./people/directory/api/directory.api";
import { useGetNoticePeriodQuery } from "./people/settings/NoticePeriod/api/notice.api";
import { useGetEmployeeIdPrefixQuery } from "./people/settings/EmpIdGeneration/api/empidgen.api";
import { useGetAllDepartmentsQuery } from "./people/department/api/department.api";
import { useLazyGetAllSubDepartmentsByDepartmentIdQuery } from "./people/department/sub-department/api/sub-department.api";
import { useGetAllDesignationsQuery } from "./people/designation/api/designation.api";
import { OrgDocumentsView } from "./documents/org-documents/OrgDocumentsView";
import { EmployeeDocumentsView } from "./documents/emp-documents/EmployeeDocumentsView";
import OrgChartView from "./people/orgChart/components/OrgChartView";
import { ExpensePolicyTab, type ExpensePolicyTabRef } from "./expense/policy/components/ExpensePolicyTab";
import { ExpenseCategoryTab, type ExpenseCategoryTabRef } from "./expense/category/components/ExpenseCategoryTab";
import { AssetCategoryView } from "./asset/asset-category/AssetCategoryView";
import { AssetList } from "./asset/asset-list/components/AssetList";
import DocumentTemplateView from "./documents/documentTemplates/DocumentTemplateView";
import { AssetIdSeriesTab, type AssetIdSeriesTabRef } from "./asset/settings/components/AssetIdSeriesTab";
import { UnavailableStatusTab, type UnavailableStatusTabRef } from "./asset/settings/components/UnavailableStatusTab";
import { AssetConditionsTab, type AssetConditionsTabRef } from "./asset/settings/components/AssetConditionsTab";
import { AssetRequestSettingsTab } from "./asset/settings/components/AssetRequestSettingsTab";
import { UnderReviewTab } from "./people/exit/components/under-review/UnderReviewTab";
import { ExitProgressTab } from "./people/exit/components/exit-progress/ExitProgressTab";
import ExitedEmployees from "./people/exit/components/exited-employee/ExitedEmployees";
import OrgEmployeeView from "./OrgEmployeeView";
import ExportColumnsModal from "./people/directory/components/ExportColumnsModal";
import { Snackbar } from "../../../components/atom/snackbar";
import { AssetAcknowledgementView } from "./asset/asset-acknowledgement/AssetAcknowledgmentView";
import Summary from "./helpdesk/employer/views/Summary";
import Tickets from "./helpdesk/employer/views/Tickets";
import HelpdeskReports from "./helpdesk/employer/views/HelpdeskReports";
import TicketCategory, { type TicketCategoryRef } from "./helpdesk/employer/settings/TicketCategory";
import BusinessHours, { type BusinessHoursRef } from "./helpdesk/employer/settings/BusinessHours";
import CannedResponses, { type CannedResponsesRef } from "./helpdesk/employer/settings/CannedResponses";
import ClosingReasons, { type ClosingReasonsRef } from "./helpdesk/employer/settings/ClosingReasons";

export default function OrgHomeView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMainTab = parseInt(searchParams.get("mainTab") || "0", 10);
  const [mainTab, setMainTab] = useState(initialMainTab);

  const { data: employeeInfo } = useGetEmployeeInfoQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  /** Full org module (People, Documents, Expense, Asset, …) is shown only for admins. */
  const isPeopleOrgAdmin = employeeInfo?.data?.isAdmin === true;
  const initialSubTab = parseInt(searchParams.get("subtab") || "0", 10);
  const [peopleSubTab, setPeopleSubTab] = useState(initialSubTab);
  const initialDocumentsSubTab = parseInt(searchParams.get("documentsSubTab") || "0", 10);
  const [documentsSubTab, setDocumentsSubTab] = useState(initialDocumentsSubTab);
  const initialHelpdeskSubTab = parseInt(searchParams.get("helpdeskTab") || "0", 10);
  const [helpdeskSubTab, setHelpdeskSubTab] = useState(initialHelpdeskSubTab);
  const initialHelpdeskSettingsSubTab = parseInt(searchParams.get("helpdeskSettingsTab") || "0", 10);
  const [helpdeskSettingsSubTab, setHelpdeskSettingsSubTab] = useState(initialHelpdeskSettingsSubTab);

  // Sync state if URL changes externally
  useEffect(() => {
    const subtabParam = searchParams.get("subtab");
    if (subtabParam !== null) {
      setPeopleSubTab(parseInt(subtabParam, 10));
    }

    const mainTabParam = searchParams.get("mainTab");
    if (mainTabParam !== null) {
      setMainTab(parseInt(mainTabParam, 10));
    }

    const documentsSubTabParam = searchParams.get("documentsSubTab");
    if (documentsSubTabParam !== null) {
      setDocumentsSubTab(parseInt(documentsSubTabParam, 10));
    }

    const helpdeskTabParam = searchParams.get("helpdeskTab");
    if (helpdeskTabParam !== null) {
      setHelpdeskSubTab(parseInt(helpdeskTabParam, 10));
    }

    const helpdeskSettingsTabParam = searchParams.get("helpdeskSettingsTab");
    if (helpdeskSettingsTabParam !== null) {
      setHelpdeskSettingsSubTab(parseInt(helpdeskSettingsTabParam, 10));
    }
  }, [searchParams, setPeopleSubTab, setMainTab, setDocumentsSubTab, setHelpdeskSubTab, setHelpdeskSettingsSubTab]);

  const handlePeopleSubTabChange = (newValue: number) => {
    setPeopleSubTab(newValue);
    setSearchParams((prev) => {
      prev.set("subtab", String(newValue));
      return prev;
    });
  };
  const handleDocumentsSubTabChange = (newValue: number) => {
    setDocumentsSubTab(newValue);
    setSearchParams((prev) => {
      prev.set("documentsSubTab", String(newValue));
      return prev;
    });
  };
  const [expenseSubTab, setExpenseSubTab] = useState(0);
  const [assetSubTab, setAssetSubTab] = useState(0);
  const [assetSettingsSubTab, setAssetSettingsSubTab] = useState(0);
  const [docTemplatesSubTab, setDocTemplatesSubTab] = useState(0);
  const [exitSubTab, setExitSubTab] = useState(0);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportSnackbar, setExportSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({ open: false, message: "", color: "success" });

  // Search states for Directory, Department and Designation tabs
  const [directorySearchText, setDirectorySearchText] = useState("");
  const [departmentSearchText, setDepartmentSearchText] = useState("");
  const [designationSearchText, setDesignationSearchText] = useState("");
  const [expensePolicySearchText, setExpensePolicySearchText] = useState("");
  const [expenseCategorySearchText, setExpenseCategorySearchText] = useState("");
  const [directoryFiltersOpen, setDirectoryFiltersOpen] = useState(false);
  const [employeeFiltersOpened, setEmployeeFiltersOpened] = useState(false);
  const [directoryFilters, setDirectoryFilters] = useState<EmployeeFilterParams>({});
  const [ticketCategorySearchText, setTicketCategorySearchText] = useState("");
  const [businessHoursSearchText, setBusinessHoursSearchText] = useState("");
  const [cannedResponsesSearchText, setCannedResponsesSearchText] = useState("");
  const [closingReasonsSearchText, setClosingReasonsSearchText] = useState("");
  const navigate = useNavigate();

  // Refs for accessing component methods
  const departmentRef = useRef<DepartmentTreeViewRef>(null);
  const designationRef = useRef<DesignationSectionRef>(null);
  const expensePolicyRef = useRef<ExpensePolicyTabRef>(null);
  const expenseCategoryRef = useRef<ExpenseCategoryTabRef>(null);
  const ticketCategoryRef = useRef<TicketCategoryRef>(null);
  const businessHoursRef = useRef<BusinessHoursRef>(null);
  const cannedResponsesRef = useRef<CannedResponsesRef>(null);
  const closingReasonsRef = useRef<ClosingReasonsRef>(null);
  const assetIdSeriesRef = useRef<AssetIdSeriesTabRef>(null);
  const unavailableStatusRef = useRef<UnavailableStatusTabRef>(null);
  const assetConditionsRef = useRef<AssetConditionsTabRef>(null);

  const isPeopleTab = mainTab === 0;
  const isPeopleSettingsSubTab = peopleSubTab === 5;
  const isPeopleExitSubTab = peopleSubTab === 4;
  const isPeopleDirectorySubTab = peopleSubTab === 0;
  const shouldFetchPeopleSettings = isPeopleTab && (isPeopleSettingsSubTab || isPeopleDirectorySubTab || isPeopleExitSubTab);

  const [noticeConfigId, setNoticeConfigId] = useState<number | null>(1);
  const { data: noticePeriodResponse, isLoading: isNoticePeriodLoading } =
    useGetNoticePeriodQuery(noticeConfigId ?? 1, {
      skip: !shouldFetchPeopleSettings,
    });
  const noticePeriodData = noticePeriodResponse?.data ?? null;

  const { data: empIdPrefixData, isLoading: isEmpIdPrefixLoading } =
    useGetEmployeeIdPrefixQuery(undefined, {
      skip: !shouldFetchPeopleSettings,
    });

  // Always fetch so Directory filter modal has department/designation options
  const { data: departmentData, isLoading: isDepartmentLoading } =
    useGetAllDepartmentsQuery();
  const [fetchSubDepartments] =
    useLazyGetAllSubDepartmentsByDepartmentIdQuery();
  const [subDepartmentsByDept, setSubDepartmentsByDept] = useState<
    Record<number, { id: number; subDepartmentName: string }[]>
  >({});

  const { data: designationData, isLoading: isDesignationLoading } =
    useGetAllDesignationsQuery();

  useEffect(() => {
    if (!directoryFiltersOpen && !employeeFiltersOpened) return;
    const list = departmentData?.data ?? [];
    if (list.length === 0) return;

    list.forEach((dep) => {
      fetchSubDepartments(dep.id)
        .then((res: any) => {
          const body = res?.data;
          const subs = Array.isArray(body) ? body : body?.data ?? [];
          setSubDepartmentsByDept((prev) => ({
            ...prev,
            [dep.id]: subs.map((s: any) => ({
              id: s.id,
              subDepartmentName: s.subDepartmentName ?? "",
            })),
          }));
        })
        .catch(() => {
          setSubDepartmentsByDept((prev) => ({ ...prev, [dep.id]: [] }));
        });
    });
  }, [departmentData?.data, fetchSubDepartments, directoryFiltersOpen, employeeFiltersOpened]);

  useEffect(() => {
    if (noticePeriodData?.id != null) setNoticeConfigId(noticePeriodData.id);
  }, [noticePeriodData?.id]);

  /** ---------- SUB-TAB DEFINITIONS ---------- */
  const exitSubTabs = [
    { label: "Under review", content: <UnderReviewTab /> },
    { label: "Exit in progress", content: <ExitProgressTab /> },
    { label: "Exited employees", content: <ExitedEmployees /> }
  ];

  const activeExitContent = exitSubTabs[exitSubTab]?.content ?? null;

  const peopleSubTabs: TabItem[] = [
    {
      label: "Directory",
      content: (
        <DirectoryTab
          searchQuery={directorySearchText}
          filters={directoryFilters}
        />
      ),
    },
    {
      label: "Department",
      content: (
        <DepartmentTreeView
          ref={departmentRef}
          searchQuery={departmentSearchText}
        />
      ),
    },
    {
      label: "Designation",
      content: (
        <DesignationSection
          ref={designationRef}
          searchQuery={designationSearchText}
        />
      ),
    },
    {
      label: "Org Chart",
      content: (
        <Box
          height={"100%"}
          width={"100%"}
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <OrgChartView />
        </Box>
      ),
    },
    { label: "Exit", content: activeExitContent },
    {
      label: "Settings",
      content: <PeopleSettingsView />,
    },
  ];

  const documentsSubTabs: TabItem[] = [
    { label: "Document Templates", content: <DocumentTemplateView hideTabs activeTab={docTemplatesSubTab} /> },
    { label: "Employee Documents", content: <EmployeeDocumentsView hideTabs /> },
    { label: "Organizational Documents", content: <OrgDocumentsView /> },
  ];

  const expenseSubTabs: TabItem[] = [
    {
      label: "Expense Policy",
      content: (
        <ExpensePolicyTab
          ref={expensePolicyRef}
          searchQuery={expensePolicySearchText}
        />
      ),
    },
    {
      label: "Expense Category",
      content: (
        <ExpenseCategoryTab
          ref={expenseCategoryRef}
          searchQuery={expenseCategorySearchText}
        />
      ),
    },
  ];

  const assetSettingsSubTabs: TabItem[] = [
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

  const activeAssetSettingsContent = assetSettingsSubTabs[assetSettingsSubTab]?.content ?? null;

  const assetSubTabs: TabItem[] = [
    { label: "Summary", content: <UnderConstruction /> },
    { label: "Asset Acknowledgement", content: <AssetAcknowledgementView/> },
    { label: "Asset List", content: <AssetList /> },
    {
      label: "Asset Categories and Types",
      content: <AssetCategoryView key={assetSubTab} />,
    },
    { label: "Settings", content: activeAssetSettingsContent },
  ];

  const helpdeskSettingsSubTabs: TabItem[] = [
    { label: "Ticket Categories", content: <TicketCategory ref={ticketCategoryRef} searchQuery={ticketCategorySearchText} /> },
    { label: "Business Hours",    content: <BusinessHours ref={businessHoursRef} searchQuery={businessHoursSearchText} /> },
    { label: "Canned Responses",  content: <CannedResponses ref={cannedResponsesRef} searchQuery={cannedResponsesSearchText} /> },
    { label: "Closing Reasons",   content: <ClosingReasons ref={closingReasonsRef} searchQuery={closingReasonsSearchText} /> },
  ];

  const activeHelpdeskSettingsContent = helpdeskSettingsSubTabs[helpdeskSettingsSubTab]?.content ?? null;

  const helpdeskSubTabs: TabItem[] = [
    { label: "Summary", content: <Summary /> },
    { label: "Tickets", content: <Tickets /> },
    { label: "Reports", content: <HelpdeskReports /> },
    { label: "Settings", content: activeHelpdeskSettingsContent },
  ];

  const handleHelpdeskSubTabChange = (newValue: number) => {
    setHelpdeskSubTab(newValue);
    setHelpdeskSettingsSubTab(0);
    setSearchParams((prev) => {
      prev.set("helpdeskTab", String(newValue));
      prev.delete("helpdeskSettingsTab");
      return prev;
    });
  };

  const handleHelpdeskSettingsSubTabChange = (newValue: number) => {
    setHelpdeskSettingsSubTab(newValue);
    setSearchParams((prev) => {
      prev.set("helpdeskSettingsTab", String(newValue));
      return prev;
    });
  };

  const departmentOptions = useMemo(() => {
    const list = departmentData?.data ?? [];
    const options: { label: string; value: string }[] = [];
    list.forEach((d) => {
      options.push({ label: d.departmentName, value: `d-${d.id}` });
      const subs = subDepartmentsByDept[d.id] ?? [];
      subs.forEach((s) => {
        options.push({
          label: `${d.departmentName} - ${s.subDepartmentName}`,
          value: `d-${d.id}-s-${s.id}`,
        });
      });
    });
    return options;
  }, [departmentData?.data, subDepartmentsByDept]);
  const designationOptions = useMemo(
    () =>
      (designationData?.data ?? []).map((d) => ({
        label: d.designationName,
        value: String(d.id),
      })),
    [designationData?.data],
  );

  const peopleContextValue: PeopleContextValue = useMemo(
    () => ({
      noticePeriod: {
        data: noticePeriodData,
        isLoading: isNoticePeriodLoading,
        configId: noticeConfigId ?? 1,
        onConfigCreated: setNoticeConfigId,
      },
      empIdPrefix: { data: empIdPrefixData, isLoading: isEmpIdPrefixLoading },
      department: { data: departmentData, isLoading: isDepartmentLoading },
      designation: { data: designationData, isLoading: isDesignationLoading },
    }),
    [
      noticePeriodData,
      isNoticePeriodLoading,
      noticeConfigId,
      empIdPrefixData,
      isEmpIdPrefixLoading,
      departmentData,
      isDepartmentLoading,
      designationData,
      isDesignationLoading,
    ],
  );
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (directoryFilters.designationId?.length) count++;
    if (directoryFilters.employeeType?.length) count++;
    if (directoryFilters.employeeStatus?.length) count++;

    // IMPORTANT: only ONE of these should contribute
    if (directoryFilters.subDepartmentId?.length) {
      count += directoryFilters.subDepartmentId.length;
    } else if (directoryFilters.departmentId?.length) {
      count += directoryFilters.departmentId.length;
    }

    return count;
  }, [directoryFilters]);
  /** ---------- MAIN TABS (admin or reporting manager) ---------- */
  const mainTabs: TabItem[] = [
    { label: "People", icon: <PeopleIcon /> },
    { label: "Documents", icon: <DescriptionIcon /> },
    { label: "Expense", icon: <PaidIcon /> },
    { label: "Asset", icon: <DevicesOtherIcon /> },
    { label: "Helpdesk", icon: <HelpOutlineIcon /> },
    { label: "Settings", icon: <SettingsIcon /> },
  ];

  const handleMainTabChange = (val: number) => {
    setMainTab(val);
    setPeopleSubTab(0);
    setDocumentsSubTab(0);
    setExpenseSubTab(0);
    setAssetSubTab(0);
    setHelpdeskSubTab(0);
    setHelpdeskSettingsSubTab(0);
    setSearchParams((prev) => {
      prev.set("mainTab", String(val));
      if (val !== 1) prev.delete("documentsSubTab");
      return prev;
    });
  };

  if (!isPeopleOrgAdmin) {
    return (
      <OrgEmployeeView
        departmentOptions={departmentOptions}
        designationOptions={designationOptions}
        peopleContextValue={peopleContextValue}
        onFilterOpen={() => setEmployeeFiltersOpened(true)}
      />
    );
  }

  /** ---------- SELECT OPTIONS ---------- */
  const mainTabOptions = mainTabs.map((t, i) => ({ label: t.label, value: String(i) }));

  const subTabsMap: Record<number, TabItem[]> = {
    0: peopleSubTabs,
    1: documentsSubTabs,
    2: expenseSubTabs,
    3: assetSubTabs,
    4: helpdeskSubTabs, // Helpdesk – under construction, no subtabs shown
    5: [], // Settings – no subtabs
  };
  const currentSubTabs = subTabsMap[mainTab] ?? [];
  const subTabOptions = currentSubTabs.map((t, i) => ({ label: t.label, value: String(i) }));

  const currentSubTabIndex =
    mainTab === 0 ? peopleSubTab
      : mainTab === 1 ? documentsSubTab
        : mainTab === 2 ? expenseSubTab
          : mainTab === 3 ? assetSubTab
            : mainTab === 4 ? helpdeskSubTab
              : 0;

  const handleSubTabSelectChange = (val: string) => {
    const idx = parseInt(val, 10);
    if (mainTab === 0) handlePeopleSubTabChange(idx);
    else if (mainTab === 1) handleDocumentsSubTabChange(idx);
    else if (mainTab === 2) setExpenseSubTab(idx);
    else if (mainTab === 3) setAssetSubTab(idx);
    else if (mainTab === 4) handleHelpdeskSubTabChange(idx);
  };

  /** ---------- Derive active content from select state ---------- */
  const activePeopleContent = peopleSubTabs[peopleSubTab]?.content ?? null;
  const activeDocumentsContent = documentsSubTabs[documentsSubTab]?.content ?? null;
  const activeExpenseContent = expenseSubTabs[expenseSubTab]?.content ?? null;
  const activeAssetContent = assetSubTabs[assetSubTab]?.content ?? null;
  const activeHelpdeskContent = helpdeskSubTabs[helpdeskSubTab]?.content ?? null;

  const showPeopleToolbar = mainTab === 0 && (peopleSubTab === 0 || peopleSubTab === 1 || peopleSubTab === 2);
  const showExpenseToolbar = mainTab === 2;
  const isHelpdeskSettings = mainTab === 4 && helpdeskSubTab === 3;
  const showHelpdeskSettingsToolbar = isHelpdeskSettings;
  const isAssetSettings = mainTab === 3 && assetSubTab === 4;
  const showAssetSettingsToolbar = isAssetSettings && (assetSettingsSubTab === 0 || assetSettingsSubTab === 1 || assetSettingsSubTab === 2);

  const isDocTemplatesSettings = mainTab === 1 && documentsSubTab === 0;
  const docTemplatesSubTabs = [
    { label: "Active" },
    { label: "Archive" }
  ];
  const showDocTemplatesToolbar = isDocTemplatesSettings;

  const isEmployeeDocsSettings = mainTab === 1 && documentsSubTab === 1;
  const employeeDocsSubTab = Number(searchParams.get("employeeDocsTab")) || 0;
  const employeeDocsSubTabs = [
    { label: "Pending on Employee" },
    { label: "Pending Verification" },
    { label: "Verified documents" },
    { label: "Settings" }
  ];
  const handleEmployeeDocsSubTabChange = (newValue: number) => {
    setSearchParams((prev) => {
      prev.set("employeeDocsTab", String(newValue));
      return prev;
    });
  };

  const isExitSettings = mainTab === 0 && peopleSubTab === 4;

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
          <Box display="flex" alignItems="center" gap={1.5} >
            <SingleSelectElement
              sx={{ width: 220 }}
              label=""
              value={String(mainTab)}
              onChange={(val) => handleMainTabChange(parseInt(val, 10))}
              options={mainTabOptions}
              variant="people"
            />
            {subTabOptions.length > 0 && (
              <>
                <ArrowForwardIosIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                <SingleSelectElement
                  sx={{ width: 220 }}
                  label=""
                  value={String(currentSubTabIndex)}
                  onChange={handleSubTabSelectChange}
                  options={subTabOptions}
                  variant="people"
                />
              </>
            )}
            {isHelpdeskSettings && (
              <>
                <ArrowForwardIosIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                <SingleSelectElement
                  label=""
                  sx={{ width: 220 }}
                  value={String(helpdeskSettingsSubTab)}
                  onChange={(val) => handleHelpdeskSettingsSubTabChange(parseInt(val, 10))}
                  options={helpdeskSettingsSubTabs.map((t, i) => ({ label: t.label, value: String(i) }))}
                  variant="people"
                />
              </>
            )}
            {isAssetSettings && (
              <>
                <ArrowForwardIosIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                <SingleSelectElement
                  label=""
                  sx={{ width: 220 }}
                  value={String(assetSettingsSubTab)}
                  onChange={(val) => setAssetSettingsSubTab(parseInt(val, 10))}
                  options={assetSettingsSubTabs.map((t, i) => ({ label: t.label, value: String(i) }))}
                  variant="people"
                />
              </>
            )}
            {isDocTemplatesSettings && (
              <>
                <ArrowForwardIosIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                <SingleSelectElement
                  label=""
                  sx={{ width: 220 }}
                  value={String(docTemplatesSubTab)}
                  onChange={(val) => setDocTemplatesSubTab(parseInt(val, 10))}
                  options={docTemplatesSubTabs.map((t, i) => ({ label: t.label, value: String(i) }))}
                  variant="people"
                />
              </>
            )}
            {isEmployeeDocsSettings && (
              <>
                <ArrowForwardIosIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                <SingleSelectElement
                  label=""
                  sx={{ width: 220 }}
                  value={String(employeeDocsSubTab)}
                  onChange={(val) => handleEmployeeDocsSubTabChange(parseInt(val, 10))}
                  options={employeeDocsSubTabs.map((t, i) => ({ label: t.label, value: String(i) }))}
                  variant="people"
                />
              </>
            )}
            {isExitSettings && (
              <>
                <ArrowForwardIosIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                <SingleSelectElement
                  label=""
                  sx={{ width: 220 }}
                  value={String(exitSubTab)}
                  onChange={(val) => setExitSubTab(parseInt(val, 10))}
                  options={exitSubTabs.map((t, i) => ({ label: t.label, value: String(i) }))}
                  variant="people"
                />
              </>
            )}
          </Box>

          {/* ---- People toolbar ---- */}
          {showPeopleToolbar && (
            <Box display="flex" gap={1} ml="auto">
              <TextFieldElement
                width={250}
                label=""
                value={
                  peopleSubTab === 0 ? directorySearchText
                    : peopleSubTab === 1 ? departmentSearchText
                      : designationSearchText
                }
                onChange={(e) =>
                  peopleSubTab === 0 ? setDirectorySearchText(e.target.value)
                    : peopleSubTab === 1 ? setDepartmentSearchText(e.target.value)
                      : setDesignationSearchText(e.target.value)
                }
                placeholder={
                  peopleSubTab === 0 ? "Search employees"
                    : peopleSubTab === 1 ? "Search Departments"
                      : "Search Designations"
                }
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
              {peopleSubTab === 0 && (
                <Badge
                  badgeContent={activeFilterCount}
                  color="primary"
                  overlap="rectangular"
                  showZero={false}
                  sx={{ "& .MuiBadge-badge": { right: -4, top: 6, minWidth: 18, height: 18, fontSize: "0.7rem" } }}
                >
                  <PrimaryIconButton icon={<FilterListIcon />} title="Filters" variant="outlined" onClick={() => setDirectoryFiltersOpen(true)} />
                </Badge>
              )}
              {peopleSubTab === 0 && Object.keys(directoryFilters).length > 0 && (
                <PrimaryIconButton icon={<RestartAltIcon />} title="Clear filters" variant="outlined" onClick={() => setDirectoryFilters({})} />
              )}
              <PrimaryIconButton
                icon={<AddIcon />}
                title="Add"
                variant="outlined"
                onClick={() =>
                  peopleSubTab === 0 ? navigate("/people/directory/add")
                    : peopleSubTab === 1 ? departmentRef.current?.openAddModal()
                      : designationRef.current?.openAddModal()
                }
              />
              {peopleSubTab === 0 && (
                <PrimaryIconButton variant="outlined" icon={<Upload />} title="Export" onClick={() => setExportModalOpen(true)} />
              )}
              {peopleSubTab === 0 && (
                <PrimaryIconButton variant="outlined" icon={<Download />} title="Import" onClick={() => navigate("/people/employee/import")} />
              )}
            </Box>
          )}

          {/* ---- Expense toolbar ---- */}
          {showExpenseToolbar && (
            <Box display="flex" gap={1} ml="auto">
              <TextFieldElement
                width={250}
                label=""
                value={expenseSubTab === 0 ? expensePolicySearchText : expenseCategorySearchText}
                onChange={(e) =>
                  expenseSubTab === 0
                    ? setExpensePolicySearchText(e.target.value)
                    : setExpenseCategorySearchText(e.target.value)
                }
                placeholder={expenseSubTab === 0 ? "Search Policy" : "Search Category"}
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
              <PrimaryIconButton
                icon={<AddIcon />}
                title="Add"
                variant="outlined"
                onClick={() =>
                  expenseSubTab === 0
                    ? expensePolicyRef.current?.openAddModal()
                    : expenseCategoryRef.current?.openAddModal()
                }
              />
            </Box>
          )}

          {/* ---- Asset Settings toolbar ---- */}
          {showAssetSettingsToolbar && (
            <Box display="flex" gap={1} ml="auto">
              <PrimaryIconButton
                icon={<AddIcon />}
                title="Add"
                variant="outlined"
                onClick={() => {
                  if (assetSettingsSubTab === 0) assetIdSeriesRef.current?.openAddModal();
                  else if (assetSettingsSubTab === 1) unavailableStatusRef.current?.openAddModal();
                  else if (assetSettingsSubTab === 2) assetConditionsRef.current?.openAddModal();
                }}
              />
            </Box>
          )}

          {/* ---- Document Templates toolbar ---- */}
          {showDocTemplatesToolbar && (
            <Box display="flex" gap={1} ml="auto">
              <PrimaryIconButton
                icon={<AddIcon />}
                title="Add"
                variant="outlined"
                onClick={() => navigate("/people/document/template/add")}
              />
            </Box>
          )}

          {/* ---- Helpdesk Settings toolbar ---- */}
          {showHelpdeskSettingsToolbar && (
            <Box display="flex" gap={1} ml="auto">
              <TextFieldElement
                label=""
                value={
                  helpdeskSettingsSubTab === 0 ? ticketCategorySearchText
                    : helpdeskSettingsSubTab === 1 ? businessHoursSearchText
                      : helpdeskSettingsSubTab === 2 ? cannedResponsesSearchText
                        : closingReasonsSearchText
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (helpdeskSettingsSubTab === 0) setTicketCategorySearchText(v);
                  else if (helpdeskSettingsSubTab === 1) setBusinessHoursSearchText(v);
                  else if (helpdeskSettingsSubTab === 2) setCannedResponsesSearchText(v);
                  else setClosingReasonsSearchText(v);
                }}
                placeholder={
                  helpdeskSettingsSubTab === 0 ? "Search Categories"
                    : helpdeskSettingsSubTab === 1 ? "Search Business Hours"
                      : helpdeskSettingsSubTab === 2 ? "Search Canned Responses"
                        : "Search Closing Reasons"
                }
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
              <PrimaryIconButton
                icon={<AddIcon />}
                title="Add"
                variant="outlined"
                onClick={(e) => {
                  if (helpdeskSettingsSubTab === 0) ticketCategoryRef.current?.openAddMenu(e);
                  else if (helpdeskSettingsSubTab === 1) businessHoursRef.current?.openAddModal();
                  else if (helpdeskSettingsSubTab === 2) cannedResponsesRef.current?.openAddModal();
                  else closingReasonsRef.current?.openAddModal();
                }}
              />
            </Box>
          )}
        </Box>

        {/* ---- Active content ---- */}
        <Box flex={1} overflow="hidden">
          {mainTab === 0 && <PeopleProvider value={peopleContextValue}>{activePeopleContent}</PeopleProvider>}
          {mainTab === 1 && activeDocumentsContent}
          {mainTab === 2 && activeExpenseContent}
          {mainTab === 3 && activeAssetContent}
          {mainTab === 4 && activeHelpdeskContent}
          {mainTab === 5 && <UnderConstruction />}
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
      <ExportColumnsModal
        isModalOpen={exportModalOpen}
        onClose={setExportModalOpen}
        onSuccess={(message) =>
          setExportSnackbar({ open: true, message, color: "success" })
        }
        onError={(message) =>
          setExportSnackbar({ open: true, message, color: "error" })
        }
      />

      {exportSnackbar.open && (
        <Snackbar
          message={exportSnackbar.message}
          color={exportSnackbar.color}
          onClose={() => setExportSnackbar((s) => ({ ...s, open: false }))}
        />
      )}
    </>
  );
}
