import { type ButtonProps } from "@mui/material";
import type { ReactElement, MouseEvent } from "react";
import type { SxProps, TextFieldProps, Theme } from "@mui/material";
import { Dayjs } from "dayjs";
import type { ReactNode } from "react";
import { type GridColDef, type GridRowsProp, type GridRowHeightParams, } from "@mui/x-data-grid";
import {
  type GridRowSelectionModel,
} from "@mui/x-data-grid";

export interface BaseButtonProps extends ButtonProps {
  loading?: boolean;
}
export interface ChipProps {
  label?: string;
  size?: "xs" | "small" | "medium";
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
  variant?: "default" | "count";
  sx?: SxProps<Theme>;
  icon?: ReactElement; // static icon
  onClick?: (event: MouseEvent<HTMLDivElement>) => void; // entire chip click
  onDelete?: (event: MouseEvent<HTMLDivElement>) => void; // delete icon
}
export interface BadgeProps {
  size?: "small" | "medium";
  label?: string;
  variant?: "filled" | "soft";
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
  sx?: SxProps<Theme>;
  icon?: ReactElement;
}
export type Option = { label: string; value: string };
export type GroupedOption = { label: string; options: Option[] };

export type MultiSelectElementProps = {
  label: string;
  value: string[];
  onChange: (val: string[]) => void;
  options: Option[] | GroupedOption[];
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  sx?: any;
  menuMaxHeight?: number;
  menuWidth?: number | string;
  width?: number | string;
  highlightedValues?: any[];
  fullWidth?: boolean;
};
export interface SingleSelectElementProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options:
    | {
        label: string;
        value: string;
      }[]
    | {
        label: string;
        options: { label: string; value: string }[];
      }[];
  // accountId?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  width?: string | number;
  disabled?: boolean;
  fullWidth?: boolean;
  menuHeight?: number; // dropdown max height
  menuWidth?: number | string; // dropdown width
  sx?: SxProps<Theme>;
  extraMenuItems?: React.ReactNode; // optional extra menu items rendered after options
  groupBy?: (option: any) => string;
  renderGroup?: (params: any) => React.ReactNode;
  clearable?: boolean;
  placeholder?: string;
  showSearch?: boolean;
  searchThreshold?: number;
  variant?: "default" | "people";
}
export interface ShowCodeAccordionProps {
  code: string; // code content to display
  label?: string; // label for collapsed state
  labelOpen?: string; // label for expanded state
  sx?: any; // extra styling
}
export interface SnackbarProps {
  message: string | string[];
  color?: "success" | "error" | "info" | "warning";
  sx?: SxProps<Theme>;
  autoClose?: number;
  positionFixed?: boolean;
  onClose?: () => void; // optional callback for dynamic usage
}
export interface TextFieldElementProps {
  name?: string;
  label: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  variant?: "outlined" | "filled" | "standard";
  required?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  helperText?: string;
  placeholder?: string;
  sx?: SxProps<Theme>;
  width?: string | number;
  type?: string;
  slotProps?: TextFieldProps["slotProps"];
  inputProps?: TextFieldProps["inputProps"];
  multiline?: boolean;
  rows?: number;
}
export interface DatePickerElementProps {
  label?: string;
  value?: Dayjs | null;
  size?: "small" | "medium";
  onChange?: (value: Dayjs | null) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  width?: string | number;
  disabled?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  referenceDate?: Dayjs | null;
}

export type MetaItem = {
  key: string;
  value: string;
  errors: {
    key: string;
    value: string;
  };
};
export interface RepeaterElementProps<T> {
  label?: string;
  initialItem: any;
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  renderItem: (
    item: T,
    index: number,
    onChange: (field: keyof T, value: any) => void,
  ) => React.ReactNode;
  onChange?: (items: T[]) => void;
  gap?: number;
  minItems?: number;
  boxed?: boolean;
  /** Visually separates each repeater row with border, background, and optional labels. */
  separateItems?: boolean;
  canDeleteItem?: (index: number) => boolean;
  onDelete?: (item: any) => void;
}
export interface TimePickerElementProps {
  label: string;
  value?: Dayjs | null;
  onChange?: (value: Dayjs | null) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  width?: string | number;
  /** Display / parse format, e.g. `"HH:mm"` (24h, good for typing `6:39`) or `"hh:mm A"`. */
  format?: string;
  /** When true (default), users can type in the field or use the clock dropdown. */
  allowKeyboardInput?: boolean;
  /** Close the clock popover after picking a time (default true). */
  closeOnSelect?: boolean;
  /** Minute step in the dropdown (default 1). */
  minutesStep?: number;
  sx?: SxProps<Theme>;
}
export interface FileUploadField {
  label?: string;
  value?: File | File[] | null;
  onChange: (value: File | File[] | null) => void;
  required?: boolean;
  disabled?: boolean;
  accept?: string | string[];
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  sx?: any;
}
export interface TextAreaFieldProps {
  label: string;
  value: string;
  width?: number | string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  rows?: number;
  sx?: SxProps<Theme>;
  maxLength?: number;
}
export interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange?: (color: string) => void;
  disabled?: boolean;
}
export interface ModalElementProps {
  open: boolean;
  title?: React.ReactNode;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  height?: string | number;
  disableBackdropClick?: boolean;
  hideCloseButton?: boolean;
  keepMounted?: boolean;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  draggable?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** Shown when `disabled` is true (e.g. hover on Save). */
  disabledActionTooltip?: ReactNode;
  headerActions?: React.ReactNode;
  leftHeaderAction?: React.ReactNode;
}
export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string | ReactNode;
  onClose: () => void; // triggered by close icon or backdrop click
  onConfirm: () => void; // triggered by confirm button
  confirmText?: string; // default: "Confirm"
  confirmColor?: "primary" | "error" | "warning" | "success" | "info";
  maxWidth?: "xs" | "sm" | "md"; // optional dialog size
  /** Use when this dialog is stacked on another modal so closing it does not toggle body scroll lock (avoids layout jump). */
  disableScrollLock?: boolean;
  disableConfirmButton?: boolean;
}
export interface DataTableProps {
  columns: GridColDef[];
  rows: any[];
  getRowId?: (row: any) => string | number;
  loading?: boolean;
  pageSizeOptions?: number[];
  checkboxSelection?: boolean;
  action?: React.ReactNode;
  filterName?: string;
  onFilterName?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sx?: SxProps<Theme>;
  headerBgColor?: string;
  bodyBgColor?: string;
  tableHeight?: number | string;
  maxHeight?: number | string;
  pagination?: boolean;
  disableRowClickSelection?: boolean;
  localeText?: any;
}
export interface StandardTableColumn {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
  headerAlign?: "left" | "center" | "right";
  /** When set, replaces `label` in the header cell (e.g. checkbox column). */
  headerRender?: () => ReactNode;
  render?: (row: any) => ReactNode; // optional custom renderer
  width?: string | number;
  minWidth?: string | number;
  flex?: number;
}
export interface StandardTableProps {
  columns: StandardTableColumn[];
  rows: any[];
  loading?: boolean;
  tableSx?: SxProps<Theme>;
  /** Optional vertical row gap in px (uses border-spacing). */
  gap?: number;
  sticky?: boolean;
  stickyTop?: number; // distance from top when sticky is true
  emptyMessage?: string;
  showSkeleton?: boolean;
  /** When true, table cells use `whiteSpace: "nowrap"` (default matches previous normal wrap). */
  nowrapCells?: boolean;
  /** MUI TableRow `selected` — e.g. bulk selection highlight */
  isRowSelected?: (row: any, rowIndex: number) => boolean;
  onRowClick?: (row: any, rowIndex: number) => void;
  isRowClickable?: (row: any, rowIndex: number) => boolean;
  sx?: object;
  minWidth?: number;
  /**
   * When this returns a non-null node, it replaces the default `<TableRow>` for that row.
   * Use for merged cells (e.g. colSpan + badge). Return `null` to fall back to default cells.
   */
  renderCustomRow?: (
    row: any,
    rowIndex: number,
    opts: {
      rowId: string;
      rowRef: (el: HTMLTableRowElement | null) => void;
      highlightBackground: string;
      columns: StandardTableColumn[];
    }
  ) => ReactNode | null;
}

export type FlexibleColumn<T = any> = {
  //  Unique identifier (preferred)
  id?: keyof T | string;

  //  Data field
  field?: keyof T | string;

  //  Header text (support both styles)
  label?: string;
  headerName?: string;

  //  Renderers (support both styles)
  render?: (row: T) => React.ReactNode;
  renderCell?: (params: { value: any; row: T }) => React.ReactNode;

  //  Layout
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  flex?: number;

  //  Alignment
  align?: "left" | "center" | "right";
  headerAlign?: "left" | "center" | "right";
};
// type FlexibleColumn = DenseTableColumn | StandardTableColumn;

export type HighlightedRow = {
  key: "id" | "paymentId" | "transactionTypeId" | "transactionId";
  value: string;
  type: "add" | "edit";
  counter?: number; // new
} | null;

export interface DenseTableAtomProps<T = any> {
  columns: FlexibleColumn<T>[];
  rows: T[];

  ariaLabel?: string;
  loading?: boolean;
  showSkeleton?: boolean;
  emptyMessage?: string;
  sticky?: boolean;
  highlightedRowId?: string | null;
  sx?: any;
  highlightedRow?: HighlightedRow;

  onRowClick?: (row: T) => void;
}

export interface DateRangePickerAtomProps {
  label?: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onChange: (range: { startDate: Dayjs | null; endDate: Dayjs | null }) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}
export interface ToggleSwitchProps {
  label?: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
  disabled?: boolean;
}
export interface RadioButtonProps {
  label?: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  name?: string;
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
  disabled?: boolean;
  /** Size of the radio and label. */
  size?: "small" | "medium";
}
export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  indeterminate?: boolean;
  required?: boolean;
}
export interface ChipDualIconProps extends ChipProps {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  size?: "small" | "medium";
}
export interface AccordionElementProps {
  title: string;
  open: boolean;
  onChange: (event: React.SyntheticEvent, expanded: boolean) => void;
  showCheckbox?: boolean;
  checkboxProps?: CheckboxProps;
  children?: React.ReactNode;
  headerActions?: React.ReactNode;
}

// Template Setup
export interface ColorProps {
  readonly [key: string]: string;
}
export interface ConfigStates {
  presetColor: PresetColor;
}
export interface ConfigContextValue {
  state: ConfigStates;
  setState: (newState: ConfigStates) => void;
  setField: <K extends keyof ConfigStates>(
    field: K,
    value: ConfigStates[K],
  ) => void;
  resetState: () => void;
}
// ----TYPES----
export type PresetColor =
  | "default"
  | "theme1"
  | "theme2"
  | "theme3"
  | "theme4"
  | "theme5"
  | "theme6";

export type CustomGridColDef = Omit<GridColDef, "type"> & {
  type?: GridColDef["type"] | "multiSelect";
  options?: { label: string; value: string }[];
};
export interface EditableDataGridProps {
  title?: string;
  rows: GridRowsProp;
  columns: CustomGridColDef[];
  exportActions?: React.ReactNode;
  headerBgColor?: string;
  bodyBgColor?: string;
  successMessage?: string;
  errorMessage?: string;
  sx?: object;
  processRowUpdate?: (newRow: any, oldRow: any) => Promise<any>;
  onProcessRowUpdateError?: (error: any) => void;
  validateRow?: (
    newRow: any,
    oldRow: any,
  ) => { valid: boolean; message?: string };
}
export interface QuickFilterDataGridProps {
  columns: GridColDef[];
  rows: GridRowsProp;
  pageSize?: number;
  quickFilterValues?: string[];
  headerBgColor?: string;
  bodyBgColor?: string;
  showToolbar?: boolean;
  loading?: boolean;
  sx?: object;
  pagination?: boolean;
  disableRowSelectionOnClick?: boolean;
  onRowClick?: (params: any, event: any) => void;
  disableRowSelection?: boolean;
  onCellClick?: (params: any, event: any) => void;
  checkboxSelection?: boolean;
  rowSelectionModel?: GridRowSelectionModel;
  onRowSelectionChange?: (model: GridRowSelectionModel) => void;
  maxHeight?: number | string;
  getRowHeight?: (params: GridRowHeightParams) => number | "auto"; // dynamic row height based on row content
  csvFilename?: string;
  disableColumnMenu?: boolean;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
}
export interface DenseTableColumn {
  label: string;
  field: string;
  align?: "left" | "right" | "center" | string;
  render?: (value: any, row: any) => React.ReactNode;
}
export interface MenuItemData {
  label: string;
  onClick?: () => void;
  children?: MenuItemData[];
  disabled?: boolean;
  icon?: React.ReactNode;
}
export interface GroupedRow<T> {
  id: string;
  isGroupHeader: boolean;
  groupName?: string;
  data?: T; // the actual row data
}

export interface Group<T> {
  groupName: string;
  items: T[];
}
export interface GroupedDataTableProps<T> {
  columns: GridColDef[];
  groupedRows: Group<T>[];
  expandAll: boolean;
  loading?: boolean;
  tableHeight?: string | number;
  pageSizeOptions?: number[];
  headerBgColor?: string;
  bodyBgColor?: string;
  useDepth?: boolean;
  renderGroupHeader?: (group: Group<T>) => React.ReactNode;
  renderRowActions?: (row: T) => React.ReactNode;
  onToggleRow?: (rowId: string, expanded: boolean) => void;
  dateFrom?: string;
  dateTo?: string;
  singleDate?: string;
  groupHeaderColumns?: GridColDef[];
  /** Extra query params added to navigation URL (e.g. source=tds for TDS Summary) */
  extraQueryParams?: Record<string, string>;
}
export interface ICurrencyItem {
  cc: string;
  symbol: string;
  name: string;
}
