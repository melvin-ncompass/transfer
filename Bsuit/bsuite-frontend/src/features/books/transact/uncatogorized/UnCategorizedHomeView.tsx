import { Box, Typography } from "@mui/material";

import type { Dispatch, SetStateAction } from "react";

import HomePage from "./home/components/HomePage";

export default function UnCategorizedHomeView({
  isActive = true,
  totalCount,
  filterAccountIds,
  setFilterAccountIds,
  isFilterOpen,
  setIsFilterOpen,
  highlightUncategorizedIds = [],
  refetchTransactCount,
}: {
  isActive?: boolean;
  onAccountFilterChange?: (accountIds: string[]) => void;
  totalCount: number;
  filterAccountIds: string[];
  setFilterAccountIds: Dispatch<SetStateAction<string[]>>;
  isFilterOpen: boolean;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  highlightUncategorizedIds?: number[];
  refetchTransactCount: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 230px)",
      }}
    >
      {/* Home Page content */}
      <HomePage
        isActive={isActive}
        totalCount={totalCount}
        filterAccountIds={filterAccountIds}
        setFilterAccountIds={setFilterAccountIds}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        highlightUncategorizedIds={highlightUncategorizedIds}
        refetchTransactCount={refetchTransactCount}
      />
    </Box>
  );
}
