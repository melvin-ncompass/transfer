import React from "react";
import {
  Tabs,
  Tab,
  Chip,
  Box,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { TabSectionRef } from "../../features/people/salary/structure/SalaryStructureView";

export interface TabItem {
  label: string;
  icon?: React.ReactElement;
  chipLabel?: string | number;
  content?: React.ReactNode;
  ref?: React.RefObject<TabSectionRef | null>
}

export interface TabsAtomProps {
  tabs: TabItem[];
  defaultValue?: number;
  value?: number;
  onChange?: (newValue: number) => void;
  scrollable?: boolean;
  sx?: SxProps<Theme>;
  tabSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  action?: React.ReactNode;
  /** When set, briefly pulses the tab button at this index (e.g. after navigating from a notification). */
  highlightedIndex?: number | null;
}

export const TabsAtom = ({
  tabs,
  value,
  onChange,
  defaultValue = 0,
  scrollable = true,
  sx,
  tabSx,
  contentSx,
  action,
  highlightedIndex,
}: TabsAtomProps) => {
  const theme = useTheme();
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = typeof value === "number";
  const activeValue = isControlled ? value : internalValue;
  const [highlightAnimKey, setHighlightAnimKey] = React.useState(0);

  React.useEffect(() => {
    if (highlightedIndex == null) return;
    setHighlightAnimKey((k) => k + 1);
  }, [highlightedIndex]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    if (!isControlled) setInternalValue(newValue);
    onChange?.(newValue);
  };

  // Track which tabs have been visited to enable lazy mounting.
  const [visitedTabs, setVisitedTabs] = React.useState<Set<number>>(
    () => new Set([activeValue])
  );

  // When the active tab changes, mark it as visited so its content gets mounted.
  React.useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeValue)) return prev;
      const next = new Set(prev);
      next.add(activeValue);
      return next;
    });
  }, [activeValue]);

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", ...sx }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Tabs
          value={activeValue}
          onChange={handleChange}
          variant={scrollable ? "scrollable" : "standard"}
          scrollButtons={scrollable ? "auto" : false}
          sx={{
            minHeight: "auto",
            "& button": {
              minWidth: 100,
            },
            "& .MuiTab-root": {
              minHeight: "auto",
              minWidth: 10,
              // py: 1,
              // px: 1,
              mr: 2.25,
              color: "grey.900",
              ...theme.applyStyles?.("dark", { color: "grey.600" }),
              textTransform: "none",
            },
            "& .Mui-selected": { color: "primary.main" },
            ...tabSx,
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={
                highlightedIndex === index
                  ? `tab-${index}-highlight-${highlightAnimKey}`
                  : index
              }
              icon={tab.icon}
              iconPosition={tab.icon ? "start" : undefined}
              label={
                <Box display="flex" alignItems="center">
                  {tab.label}
                  {tab.chipLabel && (
                    <Chip
                      label={tab.chipLabel}
                      size="small"
                      color="secondary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              }
              sx={
                highlightedIndex === index
                  ? {
                      "@keyframes tabHighlightPulse": {
                        "0%":   { backgroundColor: "rgba(25, 118, 210, 0.18)", borderRadius: "6px" },
                        "60%":  { backgroundColor: "rgba(25, 118, 210, 0.12)", borderRadius: "6px" },
                        "100%": { backgroundColor: "transparent" },
                      },
                      animation: "tabHighlightPulse 1.5s ease-out forwards",
                    }
                  : undefined
              }
            />
          ))}
        </Tabs>

        {/* action button */}
        {action && (
          <Box sx={{ mr: 2, flexShrink: 0 }}>
            {action}
          </Box>
        )}
      </Box>


      {/* Tab Panels Container — minHeight:0 so flex children can shrink; avoid nested scroll with inner tables */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tabs.map((tab, index) => {
          // Only mount the tab panel if it has been visited at least once
          if (!visitedTabs.has(index)) return null;

          return (
            <Box
              key={index}
              role="tabpanel"
              hidden={activeValue !== index}
              id={`tab-panel-${index}`}
              aria-labelledby={`tab-${index}`}
              sx={{
                p: 1,
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                ...contentSx,
                ...(activeValue !== index ? { display: "none" } : {}),
              }}
          >
            {typeof tab.content === "string" ? (
              <Typography>{tab.content}</Typography>
            ) : (
              tab.content
            )}
          </Box>
        );
      })}
      </Box>
    </Box>
  );
};
