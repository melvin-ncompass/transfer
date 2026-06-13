import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box } from "@mui/system";
import CustomCircularProgress from "../../../../components/atom/circular-progress/CircularProgress";
import { TabsAtom } from "../../../../components/tabs";
import OpeningBalanceView from "../openingBalance/components/OpeningBalanceView";
import UnCategorizedHomeView from "../uncatogorized/UnCategorizedHomeView";
import { TransactTabCard } from "../transactHome/components/TransactTabCard";
import { useGetTransactCountQuery } from "../transactHome/api/transact.api";
import { useGetUncategorizedCountQuery } from "../uncatogorized/home/api/uncategorized.api";
import { UncategorizedTabActions } from "../uncatogorized/transfer/components/UncategorizedTabActions";
import { TransactHomeTaskBar } from "../transactHome/components/TransactHomeTaskBar";
import { Snackbar } from "../../../../components/atom/snackbar";
import { useSelector } from "react-redux";
import { UploaderTab } from "../uploader/UploaderTab";
import { useGetHeaderDataQuery } from "../../../company/api/company.api";
import { setTransactCount } from "../slice/transcatSlice";
import { useAppDispatch } from "../../../../store/store";
import { usePermission } from "../../../../context/PermissionContext";
import { useGetUserPermissionsQuery } from "../../../../api/permission.api";

export const TransactHomeView = () => {
  const dispatch = useAppDispatch();
  const { permissions, setPermissions } = usePermission();
  const { data: userPermissions, refetch } = useGetUserPermissionsQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const navEntry = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming;

  const isRefresh = navEntry?.type === "reload";
  const refetchPermissions = async () => {
    await refetch();
    setPermissions(userPermissions?.data?.permissions || []);
  }
  const [activeIndex, setActiveIndex] = useState<number | null>(
    tabParam
      ? tabParam.startsWith("t")
        ? 0
        : tabParam.startsWith("u")
          ? permissions.includes("manage_uncategorized_transactions") ? 1 : 0
          : tabParam.startsWith("o")
            ? permissions.includes("view_opening_balances") ? 2 : 0
            : tabParam.startsWith("up")
              ? permissions.includes("manage_transactions") ? 3 : 0
              : 0
      : 0,
  );

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnackBar = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  /* ---------- Common date and filter parameters (from URL) ---------- */
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const filter = searchParams.getAll("filter");

  /* ---------- State for applied filters in Transact tab ---------- */
  const [isUncatFilterOpen, setIsUncatFilterOpen] = useState(false);
  const [appliedFilters, _setAppliedFilters] = useState({
    fromDate,
    toDate,
    selectedTransactionType: filter,
  });

  const { data: headerData } = useGetHeaderDataQuery();
  const companyId = headerData?.data?.companyId ?? "";

  /* -------------------- Fetch Transact Count -------------------- */
  const {
    data: transactCountRes,
    isLoading: isTransactCountLoading,
    isFetching: isTransactFetching,
    refetch: refetchTransactCount,
  } = useGetTransactCountQuery(
    {
      fromDate: appliedFilters.fromDate,
      toDate: appliedFilters.toDate,
      filter: appliedFilters.selectedTransactionType,
    },
    {
      skip: false,
    },
  );

  const transactCount = useSelector(
    (state: any) => state.transact.transactCount,
  );
  /* ---------- State for filtered accounts ---------- */

  const [uncatFilterAccountIds, setUncatFilterAccountIds] = useState<string[]>(
    [],
  );

  /* ---------- Fetch Uncategorized Count (based on filters) ---------- */
  const {
    data: uncategorizedCountRes,
    isLoading: isUncatCountLoading,
    isFetching: isUncatFetching,
  } = useGetUncategorizedCountQuery(uncatFilterAccountIds);

  const uncategorizedCount = uncategorizedCountRes?.data ?? 0;

  /* ---------- Memoize tab content separately ---------- */
  const transactTabContent = useMemo(() => <TransactTabCard />, []);

  const uncategorizedTabContent = useMemo(
    () => (
      <UnCategorizedHomeView
        totalCount={uncategorizedCount}
        isActive={activeIndex === 1}
        filterAccountIds={uncatFilterAccountIds}
        setFilterAccountIds={setUncatFilterAccountIds}
        isFilterOpen={isUncatFilterOpen}
        setIsFilterOpen={setIsUncatFilterOpen}
        refetchTransactCount={refetchTransactCount}
      />
    ),
    [uncategorizedCount, activeIndex, uncatFilterAccountIds, isUncatFilterOpen],
  );

  const openingBalanceTabContent = useMemo(() => <OpeningBalanceView />, []);
  const uploaderTabContent = useMemo(
    () => <UploaderTab showSnackBar={showSnackBar} />,
    [],
  );

  /* ---------- Handle tab change ---------- */
  const handleTabChange = (newIndex: number) => {
    setActiveIndex(newIndex);
    const tabLabel = tabs[newIndex].label.toLowerCase().replace(/\s+/g, "-");
    setSearchParams({ tab: tabLabel });
  };

  /* ---------- Tabs setup ---------- */
  const canViewUncategorized = permissions?.includes(
    "manage_uncategorized_transactions",
  );
  const canManageTransactions = permissions?.includes("manage_transactions");

  const tabs = useMemo(() => {
    return [
      {
        label:
          isTransactCountLoading || isTransactFetching
            ? "Transact..."
            : `Transact (${transactCount})`,
        content: transactTabContent,
        filterComponent: (
          <TransactHomeTaskBar showSnackBar={showSnackBar} />
        ),
      },

      ...(canViewUncategorized
        ? [
          {
            label:
              isUncatCountLoading || isUncatFetching
                ? "Uncategorized..."
                : `Uncategorized (${uncategorizedCount})`,
            content: uncategorizedTabContent,
            filterComponent: (
              <UncategorizedTabActions
                filterAccountIds={uncatFilterAccountIds}
                setFilterAccountIds={setUncatFilterAccountIds}
                setIsFilterOpen={setIsUncatFilterOpen}
              />
            ),
          },
        ]
        : []),

      ...(permissions.includes("view_opening_balance") ? [{
        label: "Opening Balance",
        content: openingBalanceTabContent,
      },] : []),
      ...(canManageTransactions
        ? [
          {
            label: "Uploader",
            content: uploaderTabContent,
          }] : []),
    ];
  }, [
    permissions,
    transactCount,
    uncategorizedCount,
    isTransactCountLoading,
    isUncatCountLoading,
    isTransactFetching,
    isUncatFetching,
    transactTabContent,
    uncategorizedTabContent,
    openingBalanceTabContent,
    uploaderTabContent,
    canViewUncategorized,
  ]);

  /* ---------- Refetch counts on filter change ---------- */
  useEffect(() => {
    if (activeIndex === 0) {
      refetchTransactCount();
    }
  }, [
    appliedFilters.fromDate,
    appliedFilters.toDate,
    JSON.stringify(appliedFilters.selectedTransactionType),
    refetchTransactCount,
  ]);

  const syncTabWithPermissions = async (tab: string) => {
    const res = await refetch();

    const perms = res?.data?.data?.permissions || [];
    setPermissions(perms);

    const index = tabs.findIndex((t) =>
      t.label.toLowerCase().replace(/\s+/g, "-").startsWith(tab.toLowerCase())
    );

    const canViewUncat = perms.includes("manage_uncategorized_transactions");
    const canManage = perms.includes("manage_transactions");

    if (index === -1) {
      setActiveIndex(0);
      return;
    }

    const label = tabs[index]?.label;

    if (
      (label === "Uncategorized" && !canViewUncat) ||
      (label === "Uploader" && !canManage) ||
      (label === "Opening Balance" && !perms.includes("view_opening_balance"))
    ) {
      setActiveIndex(0);
    } else {
      setActiveIndex(index);
    }
  };
  /* ---------- Sync tab with URL param only once ---------- */
  useEffect(() => {
    if (!tabParam) return;
    syncTabWithPermissions(tabParam);
  }, [tabParam]);

  useEffect(() => {
    if (isRefresh && transactCountRes?.data?.count !== undefined) {
      dispatch(setTransactCount(transactCountRes.data.count));
    }
  }, [isRefresh, transactCountRes, dispatch, activeIndex]);

  return (
    <>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {activeIndex !== null ? (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexDirection:
                  activeIndex === 0 ? { xs: "column", lg: "row" } : "row",
                gap: 2,
              }}
            >
              <Box>
                <TabsAtom
                  tabs={tabs.map((tab, _index) => ({
                    ...tab,
                    content: null,
                  }))}
                  value={activeIndex}
                  onChange={handleTabChange}
                />
              </Box>

              <Box sx={{ pl: 2 }}>{tabs[activeIndex]?.filterComponent}</Box>
            </Box>

            <Box
              key={
                activeIndex === 3
                  ? `uploader-${companyId}`
                  : `tab-${activeIndex}`
              }
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              {tabs[activeIndex]?.content}
            </Box>
          </>
        ) : (
          <CustomCircularProgress />
        )}
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
};
