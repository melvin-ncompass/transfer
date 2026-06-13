export const UI_CONSTANTS = {
  fontSize: {
    tableCell: "0.9rem",
    tableHeader: "0.9rem",
    tab: { xs: "0.7rem", sm: "0.8rem" },
    searchInput: "0.8rem",
    typography: "0.9rem",
  },

  spacing: {
    tableCellPadding: 0.5,
    tableHeaderPadding: 0.75,
    tableGroupHeaderPadding: 0.5,
    tableNoDataPadding: 1.5,
    tableNoGroupPadding: 1,
    tabPadding: 0.5,
    tabMinHeight: { xs: 32, sm: 36 },
  },

  lineHeight: {
    typography: 1.2,
  },

  rowHeight: {
    groupHeader: "40px",
    tableRow: "30px",
  },
} as const;

// export const getTableCellStyles = () => ({
//   fontSize: UI_CONSTANTS.fontSize.tableCell,
//   py: UI_CONSTANTS.spacing.tableCellPadding,
// });

export const getTableCellStyles = () => ({
  fontSize: UI_CONSTANTS.fontSize.tableCell,
  paddingTop: 0,
  paddingBottom: 0,
  verticalAlign: "middle",
});

export const getTableHeaderStyles = () => ({
  fontSize: UI_CONSTANTS.fontSize.tableHeader,
  py: UI_CONSTANTS.spacing.tableHeaderPadding,
});

export const getTableGroupHeaderStyles = () => ({
  fontSize: UI_CONSTANTS.fontSize.tableCell,
  py: UI_CONSTANTS.spacing.tableGroupHeaderPadding,
});

export const getTypographyStyles = () => ({
  fontSize: UI_CONSTANTS.fontSize.typography,
  lineHeight: UI_CONSTANTS.lineHeight.typography,
});

export const getTabStyles = () => ({
  fontSize: UI_CONSTANTS.fontSize.tab,
  py: UI_CONSTANTS.spacing.tabPadding,
  minHeight: UI_CONSTANTS.spacing.tabMinHeight,
});

export const getSearchInputStyles = () => ({
  fontSize: UI_CONSTANTS.fontSize.searchInput,
});
