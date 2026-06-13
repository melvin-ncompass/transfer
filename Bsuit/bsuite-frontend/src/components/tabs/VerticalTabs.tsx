import React from "react";
import {
  Tabs,
  Tab,
  Typography,
  Stack,
  Box,
  type SxProps,
  type Theme,
  type TypographyProps,
} from "@mui/material";

export interface VerticalTabItem {
  label: string;
  subLabel?: string;
  icon?: React.ReactElement;
  action?: React.ReactNode;
  content?: React.ReactNode;
}

export interface VerticalTabsAtomProps {
  tabs: VerticalTabItem[];
  value?: number;
  onChange?: (newValue: number) => void;
  defaultValue?: number;
  sx?: SxProps<Theme>;
  tabSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  labelTypographyVariant?: TypographyProps["variant"];
}

/**
 * 🧩 VerticalTabsAtom - reusable vertical tab layout
 */
export const VerticalTabsAtom = ({
  tabs,
  value,
  onChange,
  defaultValue = 0,
  sx,
  tabSx,
  contentSx,
  labelTypographyVariant = "subtitle1"
}: VerticalTabsAtomProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const controlled = typeof value === "number";
  const activeValue = controlled ? value : internalValue;

  // Track visited tabs for lazy mounting
  const [visitedTabs, setVisitedTabs] = React.useState<Set<number>>(
    () => new Set([activeValue])
  );

  React.useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeValue)) return prev;
      const next = new Set(prev);
      next.add(activeValue);
      return next;
    });
  }, [activeValue]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    if (!controlled) setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, ...sx }}>
      {/* Left: Tabs */}
      <Box sx={{
        width: { xs: "100%", sm: 300 },
        flexShrink: 0,
        height: "100%",
        minHeight: 0,
      }}>
        <Tabs
          orientation="vertical"
          variant="scrollable"
          scrollButtons="auto"
          value={activeValue}
          onChange={handleChange}
          sx={{
            height: "100%",
            overflowY: "auto",
            "& .MuiTabs-scroller": {
              height: "100%",
              overflowY: "auto",
            },
            "& .MuiTabs-indicator": {
              display: "none",
            },
            "& .MuiTabs-flexContainer": {
              borderBottom: "none",
            },
            "& .MuiTab-root": {
              px: 2,
              py: 1.25,
              borderRadius: 1,
              textTransform: "none",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              minHeight: 44, 
              color: "text.primary",
              mb: 0.5,
            },

            "& .MuiTab-root:hover": {
              bgcolor: "action.hover",
            },


            "& .MuiTab-root.Mui-selected": {
              bgcolor: "action.selected",
              color: "text.primary",
            },

            ...tabSx,
          }}
        >
          {tabs.map((tab, i) => (
            <Tab
              key={i}
              icon={tab.icon}
              iconPosition={tab.icon ? "start" : undefined}
              label={
                <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                  <Stack>
                    <Typography variant={labelTypographyVariant} sx={{ color: "inherit" }}>
                      {tab.label}
                    </Typography>
                    {tab.subLabel && (
                      <Typography
                        variant="caption"
                        sx={{ textTransform: "capitalize" }}
                      >
                        {tab.subLabel}
                      </Typography>
                    )}
                  </Stack>
                  {tab.action}
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Right: Tab panels */}
      <Box sx={{
        flex: 1,
        width: { xs: "100%", sm: "auto" },
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}>
        {tabs.map((tab, i) => {
          if (!visitedTabs.has(i)) return null;

          return (
            <Box
              key={i}
              role="tabpanel"
              hidden={activeValue !== i}
              id={`vertical-tabpanel-${i}`}
              aria-labelledby={`vertical-tab-${i}`}
              sx={{
                p: 2,
                display: activeValue === i ? "block" : "none",
                ...contentSx,
              }}
            >
              {tab.content}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
