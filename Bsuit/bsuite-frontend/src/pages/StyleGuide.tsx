import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs, { Dayjs } from "dayjs";
import StyleGuideSidebar from "../components/sidebar/StyleGuideSidebar";
import { ShowCodeAccordion } from "../components/atom/accordion";
import { Label } from "../components/atom/label";
import CheckIcon from "@mui/icons-material/Check";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import { Chip, ChipDualIcon } from "../components/atom/chips";
import StarIcon from "@mui/icons-material/Star";
import { Snackbar } from "../components/atom/snackbar";
import { TextFieldElement } from "../components/atom/text-field";
import { SingleSelectElement } from "../components/atom/select-field/SingleSelect";
import { MultiSelectElement } from "../components/atom/select-field/MultiSelect";
import {
  DatePickerElement,
  MonthPickerElement,
  MonthYearPickerElement,
  YearPickerElement,
} from "../components/atom/date-picker";
import { DateRangePicker } from "../components/atom/custom-date-range-picker";
import { TimePickerElement } from "../components/atom/time-picker";
import { TextAreaField } from "../components/atom/text-area-field";
import { ColorPickerField } from "../components/atom/color-picker-field";
import { FileUploadField } from "../components/atom/file-upload-field";
import { Checkbox } from "../components/atom/check-box";
import { RadioButton } from "../components/atom/radio-button";
import { ToggleSwitch } from "../components/atom/toggle-switch";
import { PrimaryButton, PrimaryIconButton, SecondaryButton } from "../components/atom/button";
import { RepeaterElement } from "../components/atom/form-repeater";
import CardAtom from "../components/atom/card/Card";
import { CollapsibleCard } from "../components/atom/card/CollapsibleCard";
import { PrimaryCard } from "../components/atom/card/PrimaryCard";
import { SecondaryCard } from "../components/atom/card/SecondaryCard";
import { ToggleButtonAtom } from "../components/atom/toggle-button-atom/ToggleButtonAtom";
import { Tooltip } from "../components/atom/tooltip";
import CustomCircularProgress from "../components/atom/circular-progress/CircularProgress";
import { SkeletonText } from "../components/atom/skeleton";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
  CreditCardTwoTone,
  DescriptionTwoTone,
  PanoramaTwoTone,
  PeopleAltTwoTone,
  PersonOutlineTwoTone,
  RecentActorsTwoTone,
  VpnKeyTwoTone,
} from "@mui/icons-material";
import Avatar from "@mui/material/Avatar";
import type { GridColDef, GridRowsProp } from "@mui/x-data-grid";
import { DataTable } from "../components/tables/data-table";
import { EditableDataGridWithConfirm } from "../components/tables/data-table/EditableDataGridWithConfirm";
import { QuickFilterDataGrid } from "../components/tables/data-table/QuickFilterDataGrid";
import { DenseTableAtom } from "../components/tables/standard-table/DenseTableAtom";
import { CollapsibleTableAtom } from "../components/tables/standard-table/CollapsibleTableAtom";
import { CollapsibleRowsTableAtom } from "../components/tables/standard-table/CollapsibleRowsTableAtom";
import { SliderAtom } from "../components/slider";
import { TabsAtom } from "../components/tabs/Tabs";
import { VerticalTabsAtom } from "../components/tabs";

function StyleGuide() {
  const theme = useTheme();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", color: "success" as "success" | "error" });
  const [textValue, setTextValue] = useState("");
  const [description, setDescription] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [multiValue, setMultiValue] = useState<string[]>([]);
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const setDateRange = (dates: [Dayjs | null, Dayjs | null]) => {
    setStartDate(dates[0]);
    setEndDate(dates[1]);
  };
  const [time, setTime] = useState<Dayjs | null>(dayjs());
  const [checked, setChecked] = useState(false);
  const [radioValue, setRadioValue] = useState("a");
  const [toggleOn, setToggleOn] = useState(false);
  const [color, setColor] = useState("#1976d2");
  const [repeaterItems, setRepeaterItems] = useState([{ name: "" }]);
  const [repeaterFiles, setRepeaterFiles] = useState<{ file: File | null }[]>([{ file: null }]);
  const [repeaterUsers, setRepeaterUsers] = useState<{ firstName: string; lastName: string; email: string }[]>([{ firstName: "", lastName: "", email: "" }]);
  const [toggleOption, setToggleOption] = useState("one");
  const [image, setImage] = useState<File | File[] | null>(null);

  const selectOptions = [
    { label: "Option A", value: "a" },
    { label: "Option B", value: "b" },
    { label: "Option C", value: "c" },
  ];

  const skillOptions = [
    { label: "React", value: "react" },
    { label: "Node", value: "node" },
    { label: "Python", value: "python" },
  ];

  const toggleOptions = [
    { value: "one", label: "One" },
    { value: "two", label: "Two" },
    { value: "three", label: "Three" },
  ];

  const grey = theme.palette.grey;
  const colorGroups = [
    { name: "Primary", value: theme.palette.primary.main },
    { name: "Secondary", value: theme.palette.secondary.main },
    { name: "Success", value: theme.palette.success.main },
    { name: "Error", value: theme.palette.error.main },
    { name: "Warning", value: theme.palette.warning.main },
    { name: "Info", value: theme.palette.info.main },
  ];
  const variants: (keyof typeof theme.typography)[] = [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "body1", "body2", "subtitle1", "subtitle2", "caption", "overline",
  ];
  const getResponsiveSizes = (style: Record<string, unknown>) => {
    const breakpoints: Record<string, string> = {};
    if (style["@media (min-width:600px)"])
      breakpoints.sm = (style["@media (min-width:600px)"] as { fontSize?: string })?.fontSize ?? "";
    if (style["@media (min-width:900px)"])
      breakpoints.md = (style["@media (min-width:900px)"] as { fontSize?: string })?.fontSize ?? "";
    if (style["@media (min-width:1200px)"])
      breakpoints.lg = (style["@media (min-width:1200px)"] as { fontSize?: string })?.fontSize ?? "";
    return breakpoints;
  };
  const textColors = [
    { name: "Default Text", color: "text.primary" },
    { name: "Default Secondary Text", color: "text.secondary" },
    { name: "Colored Primary Text", color: "primary.main" },
    { name: "Colored Secondary Text", color: "secondary.main" },
    { name: "Success Text", color: "success.main" },
    { name: "Error Text", color: "error.main" },
    { name: "Info Text", color: "info.main" },
    { name: "Warning Text", color: "warning.main" },
  ];

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.3, minWidth: 60 },
    { field: "name", headerName: "Name", flex: 1, editable: true, minWidth: 120 },
    { field: "email", headerName: "Email", flex: 2, editable: true, minWidth: 180 },
    { field: "role", headerName: "Role", flex: 1, editable: true, minWidth: 100 },
    { field: "status", headerName: "Status", flex: 0.8, editable: true, minWidth: 90 },
    { field: "dateCreated", headerName: "Date Created", type: "date", flex: 1, editable: true, minWidth: 120 },
  ];
  const rows: GridRowsProp = [
    { id: 1, name: "Jane Doe", email: "jane.doe@example.com", role: "Admin", status: "Active", dateCreated: new Date("2025-01-15") },
    { id: 2, name: "Steve Smith", email: "steve.smith@example.com", role: "Manager", status: "Inactive", dateCreated: new Date("2025-03-22") },
    { id: 3, name: "Priya Nair", email: "priya.nair@example.com", role: "Designer", status: "Active", dateCreated: new Date("2025-05-10") },
  ];
  const quickcolumns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", flex: 1, minWidth: 120 },
    { field: "country", headerName: "Country", flex: 1, minWidth: 140 },
    { field: "city", headerName: "City", flex: 1, minWidth: 120 },
    { field: "email", headerName: "Email", flex: 1.5, minWidth: 200 },
    { field: "role", headerName: "Role", flex: 1, minWidth: 120 },
    { field: "status", headerName: "Status", width: 100 },
  ];
  const quickrows = [
    { id: 1, name: "Afzal", country: "India", city: "Bangalore", email: "afzal@example.com", role: "Engineer", status: "Active" },
    { id: 2, name: "John", country: "United Kingdom", city: "London", email: "john@example.com", role: "Manager", status: "Inactive" },
    { id: 3, name: "Sara", country: "United States", city: "New York", email: "sara@example.com", role: "Designer", status: "Active" },
    { id: 4, name: "Mei Lin", country: "Singapore", city: "Singapore", email: "mei.lin@example.com", role: "HR", status: "Active" },
    { id: 5, name: "Carlos", country: "Spain", city: "Madrid", email: "carlos@example.com", role: "QA", status: "Active" },
  ];
  const densecolumns = [
    { id: "name", label: "Dessert (100g serving)", field: "name", align: "left" as const },
    { id: "calories", label: "Calories", field: "calories", align: "right" as const },
    { id: "fat", label: "Fat (g)", field: "fat", align: "right" as const },
    { id: "carbs", label: "Carbs (g)", field: "carbs", align: "right" as const },
    { id: "protein", label: "Protein (g)", field: "protein", align: "right" as const },
  ];
  const denserows = [
    { id: 1, name: "Frozen yoghurt", calories: 159, fat: 6, carbs: 24, protein: 4.0 },
    { id: 2, name: "Ice cream sandwich", calories: 237, fat: 9, carbs: 37, protein: 4.3 },
    { id: 3, name: "Eclair", calories: 262, fat: 16, carbs: 24, protein: 6.0 },
    { id: 4, name: "Cupcake", calories: 305, fat: 3.7, carbs: 67, protein: 4.3 },
    { id: 5, name: "Gingerbread", calories: 356, fat: 16, carbs: 49, protein: 3.9 },
  ];
  const collapsecolumns = [
    { label: "Dessert (100g serving)", field: "name" },
    { label: "Calories", field: "calories", align: "right" as const },
    { label: "Fat (g)", field: "fat", align: "right" as const },
    { label: "Carbs (g)", field: "carbs", align: "right" as const },
    { label: "Protein (g)", field: "protein", align: "right" as const },
  ];
  const collpaserows = [
    { id: 1, name: "Frozen yoghurt", calories: 159, fat: 6.0, carbs: 24, protein: 4.0, history: [{ date: "2020-01-05", customer: "11091700", amount: 3 }, { date: "2020-01-02", customer: "Anonymous", amount: 1 }] },
    { id: 2, name: "Ice cream sandwich", calories: 237, fat: 9.0, carbs: 37, protein: 4.3, history: [{ date: "2020-02-01", customer: "X1257", amount: 2 }, { date: "2020-03-11", customer: "John Doe", amount: 1 }] },
  ];
  const collapsibleRowsTableColumns = [
    { label: "Department", field: "name" },
    { label: "Code", field: "code" },
    { label: "Manager", field: "manager" },
    {
      label: "Action",
      field: "action",
      align: "right" as const,
      render: (_value: unknown, row: Record<string, unknown>, context?: { isChild: boolean }) =>
        context?.isChild ? (
          <SecondaryButton size="small" onClick={() => console.log("Nudge", row)}>Nudge</SecondaryButton>
        ) : null,
    },
  ];
  const collapsibleRowsTableRows = [
    {
      id: "dept-1",
      name: "Engineering",
      code: "ENG",
      manager: "Alex Chen",
      children: Array.from({ length: 10 }, (_, i) => ({
        id: `sub-1-${i}`,
        name: ["Frontend", "Backend", "DevOps", "QA", "Mobile", "Data", "Security", "Platform", "Infra", "SRE"][i] ?? `Sub-team ${i + 1}`,
        code: [`ENG-FE`, `ENG-BE`, `ENG-OPS`, `ENG-QA`, `ENG-MOB`, `ENG-DATA`, `ENG-SEC`, `ENG-PLT`, `ENG-INF`, `ENG-SRE`][i] ?? `ENG-${i + 1}`,
        manager: ["Jane Doe", "Bob Smith", "Carol White", "Dave Brown", "Eve Green", "Frank Lee", "Grace Kim", "Henry Wu", "Ivy Park", "Jack Liu"][i] ?? `Manager ${i + 1}`,
      })),
    },
    {
      id: "dept-2",
      name: "Product",
      code: "PDT",
      manager: "Sam Wilson",
      children: [
        { id: "sub-2-1", name: "Product Ops", code: "PDT-OPS", manager: "Tina Roy" },
        { id: "sub-2-2", name: "Design", code: "PDT-DSN", manager: "Uma Patel" },
        { id: "sub-2-3", name: "Growth", code: "PDT-GRW", manager: "Vik Singh" },
        { id: "sub-2-4", name: "Analytics", code: "PDT-ANA", manager: "Wendy Zhao" },
      ],
    },
  ];
  const collapsibleRowsTableSimpleColumns = [
    { label: "Dessert (100g serving)", field: "name" },
    { label: "Calories", field: "calories", align: "right" as const },
    { label: "Fat (g)", field: "fat", align: "right" as const },
    { label: "Carbs (g)", field: "carbs", align: "right" as const },
  ];
  const collapsibleRowsTableSimpleRows = [
    {
      id: "cat-1",
      name: "Frozen yoghurt",
      calories: 159,
      fat: 6.0,
      carbs: 24,
      children: [
        { id: "c1-1", name: "Vanilla", calories: 140, fat: 5, carbs: 22 },
        { id: "c1-2", name: "Strawberry", calories: 165, fat: 6.5, carbs: 26 },
        { id: "c1-3", name: "Blueberry", calories: 152, fat: 5.8, carbs: 23 },
      ],
    },
    {
      id: "cat-2",
      name: "Ice cream sandwich",
      calories: 237,
      fat: 9.0,
      carbs: 37,
      children: [
        { id: "c2-1", name: "Chocolate", calories: 250, fat: 10, carbs: 38 },
        { id: "c2-2", name: "Caramel", calories: 228, fat: 8.5, carbs: 36 },
      ],
    },
  ];
  const atomtabs = [
    { label: "Profile", icon: <PersonOutlineTwoTone sx={{ fontSize: "1.3rem" }} />, content: "Profile content goes here." },
    { label: "Followers", icon: <RecentActorsTwoTone sx={{ fontSize: "1.3rem" }} />, content: "Followers list..." },
    { label: "Friends", icon: <PeopleAltTwoTone sx={{ fontSize: "1.3rem" }} />, chipLabel: "01", content: "Friends content..." },
    { label: "Gallery", icon: <PanoramaTwoTone sx={{ fontSize: "1.3rem" }} />, content: "Gallery content here." },
  ];
  const verticaltabs = [
    { label: "User Profile", subLabel: "Profile Settings", icon: <PersonOutlineTwoTone />, content: <Stack spacing={2}><Typography>Profile settings content</Typography></Stack> },
    { label: "Billing", subLabel: "Billing Information", icon: <DescriptionTwoTone />, content: <Typography>Billing info content</Typography> },
    { label: "Payment", subLabel: "Add & Update Card", icon: <CreditCardTwoTone />, content: <Typography>Payment content</Typography> },
    { label: "Change Password", subLabel: "Update Profile Security", icon: <VpnKeyTwoTone />, content: <Typography>Password change content</Typography> },
  ];
  const [sliderValue, setSliderValue] = useState(30);

  function handleClick() {
    console.log("Clicked");
  }
  function handleDelete() {
    console.log("Delete");
  }
  function handleToastClose() {
    setSnackbar((s) => ({ ...s, open: false }));
  }

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
      <StyleGuideSidebar />
      <Card
        sx={{
          flexGrow: 1,
          m: { xs: 1, md: 2 },
          pb: { xs: 2, md: 4 },
          border: "none",
          boxShadow: "none",
          mt: { xs: 7, md: 0 },
        }}
      >
        <Box
          sx={{
            m: { xs: 1, md: 2 },
            width: "100%",
            maxWidth: "80vw",
            mx: "auto",
          }}
        >
          <Typography variant="h4" color="primary">
            Atom Components Style Guide
            <Typography variant="body1" color="text.secondary">
              Reusable UI atoms from <code>src/components/atom</code> — use these to build consistent interfaces.
            </Typography>
          </Typography>
        </Box>

        <CardContent>
          {/* === Foundation === */}
          <Card sx={{ display: "flex", flexDirection: "column", gap: 2, p: { xs: 2, md: 5 } }}>
            <Typography variant="h5">Foundation</Typography>
            <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
              The foundational design layer that defines the visual language — including color palette and typography.
            </Typography>
            <Typography variant="h6" sx={{ mt: 2, scrollMarginTop: { xs: 56, md: 24 } }} id="colors">
              Colors
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
              The primary brand and accent colors used throughout the application to create visual hierarchy and emphasis.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
              {colorGroups.map((group) => (
                <Card sx={{ p: 3 }} key={group.name}>
                  <Card sx={{ width: 120, height: 70, bgcolor: group.value, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, boxShadow: 1 }} />
                  <Typography variant="body1" textAlign="center" sx={{ mt: 1 }}>{group.name}</Typography>
                </Card>
              ))}
            </Box>
            <Typography variant="h6" sx={{ mt: 3 }}>Gray Scale</Typography>
            <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
              Neutral shades ranging from light to dark — used for surfaces, borders, backgrounds, and text contrast.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
              {Object.entries(grey)
                .filter(([key]) => Number(key) >= 100 && Number(key) <= 900)
                .map(([shade, hex]) => (
                  <Card
                    key={shade}
                    sx={{
                      width: 70,
                      height: 70,
                      bgcolor: hex,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: Number(shade) < 600 ? "#000" : "#fff",
                      borderRadius: 2,
                      boxShadow: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>{shade}</Typography>
                    <Typography variant="caption" sx={{ color: Number(shade) < 600 ? "#000" : "#fff" }}>{hex}</Typography>
                  </Card>
                ))}
            </Box>
          </Card>

          {/* === Typography === */}
          <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, scrollMarginTop: { xs: 56, md: 24 } }} id="typography">
            <Typography variant="h5" sx={{ mb: 2 }}>Typography</Typography>
            <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
              Defines the hierarchy, readability, and personality of text through consistent font styles and sizes.
            </Typography>
            <Stack spacing={4} sx={{ mt: 3 }}>
              {variants.map((variant) => {
                const style = theme.typography[variant] as Record<string, unknown>;
                const responsiveSizes = getResponsiveSizes(style);
                return (
                  <Card key={variant} sx={{ p: 3 }}>
                    <Typography variant="h6" color="text.secondary">{variant}</Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
                      <Typography variant={variant as "h1" | "h2" | "body1" | "body2"} sx={{ px: 2 }}>This is sample text</Typography>
                      <Box sx={{ px: 2, mt: 1, bgcolor: "grey.200", p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">fontSize: {String(style?.fontSize ?? "")}</Typography>
                        <Typography variant="body2" color="text.secondary">fontWeight: {String(style?.fontWeight ?? "")}</Typography>
                        <Typography variant="body2" color="text.secondary">lineHeight: {String(style?.lineHeight ?? "")}</Typography>
                        {Object.keys(responsiveSizes).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">Responsive Sizes:</Typography>
                            {Object.entries(responsiveSizes).map(([bp, val]) => (
                              <Typography key={bp} variant="body2" color="text.secondary" sx={{ pl: 2 }}>{bp}: {val}</Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          </Card>

          {/* === Text Colors === */}
          <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2, scrollMarginTop: { xs: 56, md: 24 } }} id="text-colors">
            <Typography variant="h5">Text Colors</Typography>
            <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
              Demonstrates the use of color in typography for various states, themes, and semantic meanings.
            </Typography>
            <Card>
              <Stack sx={{ mt: 2, p: 2 }} direction="column" spacing={1}>
                {textColors.map(({ name, color: c }) => (
                  <Typography key={name} variant="body1" color={c as "text.primary" | "primary.main"}>{name}</Typography>
                ))}
              </Stack>
              <ShowCodeAccordion
                code={`
// Default text
<Typography variant="body1" color="text.primary">Default Text</Typography>

// Default Secondary text
<Typography variant="body1" color="text.secondary">Default Secondary Text</Typography>

// Primary color
<Typography variant="body1" color="primary.main">Colored Primary Text</Typography>

// Success / Error / Info / Warning
<Typography variant="body1" color="success.main">Success Text</Typography>
<Typography variant="body1" color="error.main">Error Text</Typography>
<Typography variant="body1" color="info.main">Info Text</Typography>
<Typography variant="body1" color="warning.main">Warning Text</Typography>
`}
              />
            </Card>
          </Card>

          {/* === Components === */}
          <Card sx={{ mt: 3, p: { xs: 2, md: 5 } }}>
            <Typography variant="h5">Components</Typography>

            {/* === Buttons === */}
            <Box id="buttons" sx={{ scrollMarginTop: { xs: 56, md: 24 } }}>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Buttons
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Buttons trigger actions and represent key user interactions across the application.
              </Typography>

              <Box>
                <Card>
                  <Typography variant="h6" sx={{ px: 2, pt: 2 }}>
                    Primary Buttons
                  </Typography>
                  <Typography variant="body2" sx={{ px: 2 }} color="text.secondary">
                    Used for main actions like saving or submitting forms — typically the primary call to action.
                  </Typography>
                  <Stack sx={{ p: 2 }} direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
                    <PrimaryButton onClick={() => setSnackbar({ open: true, message: "Saved!", color: "success" })}>Save</PrimaryButton>
                    <PrimaryButton>Loading...</PrimaryButton>
                    <PrimaryButton disabled>Save</PrimaryButton>
                  </Stack>
                  <ShowCodeAccordion
                    code={`
import { PrimaryButton } from "../components/atom/button";

<PrimaryButton>Save</PrimaryButton>

// Loading state
<PrimaryButton>Loading...</PrimaryButton>

// Disabled state
<PrimaryButton disabled>Save</PrimaryButton>
`}
                  />
                </Card>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Card>
                  <Typography variant="h6" sx={{ px: 2, pt: 2 }}>
                    Secondary Buttons
                  </Typography>
                  <Typography variant="body2" sx={{ px: 2 }} color="text.secondary">
                    Used for supporting actions that complement the primary action.
                  </Typography>
                  <Stack sx={{ p: 2 }} direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
                    <SecondaryButton>Cancel</SecondaryButton>
                    <SecondaryButton>Loading...</SecondaryButton>
                    <SecondaryButton disabled>Cancel</SecondaryButton>
                  </Stack>
                  <ShowCodeAccordion
                    code={`
import { SecondaryButton } from "../components/atom/button";

<SecondaryButton>Cancel</SecondaryButton>

// Loading state
<SecondaryButton>Loading...</SecondaryButton>

// Disabled state
<SecondaryButton disabled>Cancel</SecondaryButton>
`}
                  />
                </Card>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Card>
                  <Typography variant="h6" sx={{ px: 2, pt: 2 }}>
                    Primary Icon Button
                  </Typography>
                  <Typography variant="body2" sx={{ px: 2 }} color="text.secondary">
                    Icon-only primary button for compact actions. Use <code>variant="contained"</code> (default) or <code>variant="outlined"</code>.
                  </Typography>
                  <Stack sx={{ p: 2 }} direction="row" spacing={2} flexWrap="wrap">
                    <PrimaryIconButton icon={<AddIcon />} title="Add" variant="contained" />
                    <PrimaryIconButton icon={<AddIcon />} title="Add outlined" variant="outlined" />
                  </Stack>
                  <ShowCodeAccordion
                    code={`
import { PrimaryIconButton } from "../components/atom/button";
import AddIcon from "@mui/icons-material/Add";

// Contained (default)
<PrimaryIconButton icon={<AddIcon />} title="Add" />

// Outlined variant
<PrimaryIconButton icon={<AddIcon />} title="Add" variant="outlined" />
`}
                  />
                </Card>
              </Box>
            </Box>

            {/* === Labels === */}
            <Box id="labels" sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Labels
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Small, color-coded indicators for statuses, categories, or metadata.
              </Typography>
              <Card>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6">Soft</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Soft variant with subtle background colors.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} gap={3} flexWrap="wrap" sx={{ m: 2 }}>
                    <Label label="Primary" color="primary" />
                    <Label label="Secondary" color="secondary" />
                    <Label label="Success" color="success" />
                    <Label label="Info" color="info" />
                    <Label label="Error" color="error" />
                    <Label label="Warning" color="warning" />
                  </Stack>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6">With Icons</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Labels with icons for clearer meaning.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} gap={3} flexWrap="wrap" sx={{ m: 2 }}>
                    <Label size="medium" label="Success" color="success" icon={<CheckIcon fontSize="small" />} />
                    <Label size="medium" label="Info" color="info" icon={<InfoIcon fontSize="small" />} />
                    <Label size="medium" label="Error" color="error" icon={<ErrorIcon fontSize="small" />} />
                    <Label size="medium" label="Warning" color="warning" icon={<WarningIcon fontSize="small" />} />
                  </Stack>
                </Box>
                <ShowCodeAccordion
                  code={`
import { Label } from "../components/atom/label";
import CheckIcon from "@mui/icons-material/Check";

// Soft labels
<Label label="Primary" color="primary" />
<Label label="Success" color="success" />

// With icon
<Label label="Success" color="success" icon={<CheckIcon fontSize="small" />} />
`}
                />
              </Card>
            </Box>

            {/* === Chips === */}
            <Box id="chips" sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Chips
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Small elements for tags, filters, or user actions.
              </Typography>
              <Card>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6">Soft</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Soft variant with subtle background colors.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} gap={3} flexWrap="wrap" sx={{ m: 2 }}>
                    <Chip label="Primary" color="primary" />
                    <Chip label="Secondary" color="secondary" />
                    <Chip label="Success" color="success" />
                    <Chip label="Error" color="error" />
                  </Stack>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6">Interactive</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Clickable, deletable, or with icons.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} gap={3} flexWrap="wrap" sx={{ m: 2 }}>
                    <Chip label="Filter" onClick={handleClick} color="primary" />
                    <Chip label="Remove" onDelete={handleDelete} color="error" />
                    <Chip label="Star" size="medium" icon={<StarIcon fontSize="small" />} color="warning" />
                    <ChipDualIcon
                      label="John Doe"
                      size="medium"
                      color="primary"
                      startIcon={
                        <Avatar sx={{ width: 20, height: 20, fontSize: 12, bgcolor: theme.palette.primary.main, color: "white" }}>JD</Avatar>
                      }
                      endIcon={<CloseIcon fontSize="small" onClick={handleDelete} sx={{ cursor: "pointer", "&:hover": { color: "error.main" } }} />}
                    />
                  </Stack>
                </Box>
                <ShowCodeAccordion
                  code={`
import { Chip, ChipDualIcon } from "../components/atom/chips";
import StarIcon from "@mui/icons-material/Star";

// Soft
<Chip label="Primary" color="primary" />

// Clickable
<Chip label="Filter" onClick={handleClick} color="primary" />

// Deletable
<Chip label="Remove" onDelete={handleDelete} color="error" />

// With icon
<Chip label="Star" icon={<StarIcon fontSize="small" />} color="warning" />

// Dual icon (e.g. avatar + close)
<ChipDualIcon
  label="John Doe"
  size="medium"
  color="primary"
  startIcon={<Avatar>JD</Avatar>}
  endIcon={<CloseIcon onClick={handleDelete} />}
/>
`}
                />
              </Card>
            </Box>

            {/* === Snackbars === */}
            <Box id="snackbars" sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Snackbars (Toasts)
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Brief notifications to indicate system messages, actions, or alerts.
              </Typography>
              <Card>
                <Box sx={{ p: 2 }}>
                  <Stack direction="column" gap={3}>
                    <Snackbar message="Success notification" color="success" onClose={handleToastClose} positionFixed={false} />
                    <Snackbar message="Info notification" color="info" onClose={handleToastClose} positionFixed={false} />
                    <Snackbar message="Error notification" color="error" onClose={handleToastClose} positionFixed={false} />
                    <Snackbar message="Warning notification" color="warning" onClose={handleToastClose} positionFixed={false} />
                  </Stack>
                  <Box sx={{ mt: 2 }}>
                    <PrimaryButton onClick={() => setSnackbar({ open: true, message: "Action completed!", color: "success" })}>Show success toast</PrimaryButton>
                    <SecondaryButton sx={{ ml: 2 }} onClick={() => setSnackbar({ open: true, message: "Something went wrong.", color: "error" })}>Show error toast</SecondaryButton>
                  </Box>
                </Box>
                <ShowCodeAccordion
                  code={`
import { Snackbar } from "../components/atom/snackbar";

// Inline (positionFixed={false})
<Snackbar message="Success notification" color="success" onClose={handleClose} positionFixed={false} />

// Controlled (e.g. from button click)
const [snackbar, setSnackbar] = useState({ open: false, message: "", color: "success" });
{snackbar.open && (
  <Snackbar
    message={snackbar.message}
    color={snackbar.color}
    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
  />
)}
<PrimaryButton onClick={() => setSnackbar({ open: true, message: "Done!", color: "success" })}>Show</PrimaryButton>
`}
                />
              </Card>
            </Box>
          </Card>

          {/* === Form Elements === */}
          <Card sx={{ mt: 3, p: { xs: 2, md: 5 } }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Form Elements
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
              Input components for capturing user data in a consistent way.
            </Typography>

            {/* Text Inputs */}
            <Card id="text-inputs" sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }}>
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Text Inputs</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Single-line text input with label and optional validation.
                </Typography>
                <Stack spacing={3}>
                  <TextFieldElement label="Standard Field" placeholder="Your Name" value={textValue} onChange={(e) => setTextValue(e.target.value)} />
                  <TextFieldElement label="Required Field" value={textValue} onChange={(e) => setTextValue(e.target.value)} required />
                  <TextFieldElement label="Error Field" value={textValue} onChange={(e) => setTextValue(e.target.value)} error helperText="This field is required." />
                </Stack>
              </Box>
              <ShowCodeAccordion
                code={`
import { TextFieldElement } from "../components/atom/text-field";

// Standard
<TextFieldElement label="Standard Field" placeholder="Your Name" value={value} onChange={(e) => setValue(e.target.value)} />

// Required
<TextFieldElement label="Required Field" value={value} onChange={(e) => setValue(e.target.value)} required />

// Error state
<TextFieldElement label="Error Field" value={value} onChange={(e) => setValue(e.target.value)} error helperText="This field is required." />
`}
              />
            </Card>

            {/* Text Area */}
            <Card sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }} id="text-area">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Text Area</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Multiline input for longer text like notes or descriptions.
                </Typography>
                <TextAreaField
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  required
                  helperText="Enter a short note about the item"
                  rows={4}
                />
              </Box>
              <ShowCodeAccordion
                code={`
import { TextAreaField } from "../components/atom/text-area-field";

const [description, setDescription] = useState("");

<TextAreaField
  label="Description"
  value={description}
  onChange={setDescription}
  required
  helperText="Enter a short note about the item"
  rows={4}
/>
`}
              />
            </Card>

            {/* Selection Controls */}
            <Card sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }} id="selection-controls">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Selection Controls</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Checkboxes, radio buttons, and toggle switches for choices and preferences.
                </Typography>
                <Typography variant="body1">Checkboxes</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mb: 2 }}>
                  <Checkbox label="Accept Terms" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                  <Checkbox label="Disabled" disabled />
                </Stack>
                <Typography variant="body1">Radio Buttons</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mb: 2 }}>
                  <RadioButton label="Option A" value="a" checked={radioValue === "a"} onChange={(e) => setRadioValue(e.target.value)} name="demo" />
                  <RadioButton label="Option B" value="b" checked={radioValue === "b"} onChange={(e) => setRadioValue(e.target.value)} name="demo" />
                </Stack>
                <Typography variant="body1">Toggle Switch</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                  <ToggleSwitch label={toggleOn ? "Enabled" : "Disabled"} checked={toggleOn} onChange={(e) => setToggleOn(e.target.checked)} />
                </Stack>
              </Box>
              <ShowCodeAccordion
                code={`
import { Checkbox } from "../components/atom/check-box";
import { RadioButton } from "../components/atom/radio-button";
import { ToggleSwitch } from "../components/atom/toggle-switch";

const [checked, setChecked] = useState(false);
const [selected, setSelected] = useState("option1");
const [enabled, setEnabled] = useState(true);

<Checkbox label="Accept Terms" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
<Checkbox label="Disabled" disabled />

<RadioButton label="Option 1" value="option1" checked={selected === "option1"} onChange={(e) => setSelected(e.target.value)} name="options" />
<RadioButton label="Option 2" value="option2" checked={selected === "option2"} onChange={(e) => setSelected(e.target.value)} name="options" />

<ToggleSwitch label={enabled ? "Enabled" : "Disabled"} checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
`}
              />
            </Card>

            {/* Select Inputs */}
            <Card sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }} id="select-inputs">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Select Inputs</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Dropdown single and multi-select.
                </Typography>
                <Card sx={{ mt: 2 }}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6">Single Select</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                      Select a single option from a list.
                    </Typography>
                    <Box sx={{ maxWidth: 360 }}>
                      <Stack spacing={3}>
                        <SingleSelectElement label="Role" options={selectOptions} value={selectValue} onChange={setSelectValue} />
                        <SingleSelectElement label="Required Select" options={selectOptions} value={selectValue} onChange={setSelectValue} required />
                        <SingleSelectElement label="Error Select" options={selectOptions} value={selectValue} onChange={setSelectValue} error helperText="Please choose a valid option." />
                      </Stack>
                    </Box>
                  </Box>
                  <ShowCodeAccordion
                    code={`
import { SingleSelectElement } from "../components/atom/select-field/SingleSelect";

const options = [{ label: "Option A", value: "a" }, ...];
const [role, setRole] = useState("");

<SingleSelectElement label="Role" options={options} value={role} onChange={setRole} />

// Required
<SingleSelectElement label="Required Select" options={options} value={role} onChange={setRole} required />

// Error state
<SingleSelectElement label="Error Select" options={options} value={role} onChange={setRole} error helperText="Please choose a valid option." />
`}
                  />
                </Card>
                <Card sx={{ mt: 3 }}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6">Multi Select</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                      Select multiple options at once.
                    </Typography>
                    <Stack spacing={3}>
                      <MultiSelectElement label="Skills" options={skillOptions} value={multiValue} onChange={setMultiValue} />
                      <MultiSelectElement label="Skills (Required)" options={skillOptions} value={multiValue} onChange={setMultiValue} required />
                      <MultiSelectElement label="Skills (Error)" options={skillOptions} value={multiValue} onChange={setMultiValue} error helperText="Select at least one." />
                    </Stack>
                  </Box>
                  <ShowCodeAccordion
                    code={`
import { MultiSelectElement } from "../components/atom/select-field/MultiSelect";

const skillOptions = [{ label: "React", value: "react" }, ...];
const [skills, setSkills] = useState<string[]>([]);

<MultiSelectElement label="Skills" options={skillOptions} value={skills} onChange={setSkills} />

// Required
<MultiSelectElement label="Skills (Required)" options={skillOptions} value={skills} onChange={setSkills} required />

// Error state
<MultiSelectElement label="Skills (Error)" options={skillOptions} value={skills} onChange={setSkills} error helperText="Select at least one." />
`}
                  />
                </Card>
              </Box>
            </Card>

            {/* Date Input */}
            <Card sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }} id="date-input">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Date Input</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Input for selecting a specific date.
                </Typography>
                <Stack direction="column" gap={3}>
                  <DatePickerElement label="Date of Birth" value={date} onChange={setDate} required error={!date} helperText={!date ? "This field is required" : ""} />
                </Stack>
              </Box>
              <ShowCodeAccordion
                code={`
import { DatePickerElement } from "../components/atom/date-picker";
import dayjs, { Dayjs } from "dayjs";

const [date, setDate] = useState<Dayjs | null>(dayjs());

<DatePickerElement
  label="Date of Birth"
  value={date}
  onChange={setDate}
  required
  error={!date}
  helperText={!date ? "This field is required" : ""}
/>
`}
              />
            </Card>

            {/* Month Picker */}
            <Card sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }} id="month-picker">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Month Picker</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Input for selecting a specific month within a year.
                </Typography>
                <Stack direction="column" gap={3}>
                  <MonthPickerElement label="Select Month" value={date} format="MMMM" onChange={setDate} />
                </Stack>
              </Box>
              <ShowCodeAccordion
                code={`
import { MonthPickerElement } from "../components/atom/date-picker";

<MonthPickerElement label="Select Month" value={date} format="MMMM" onChange={setDate} />
`}
              />
            </Card>

            {/* Year Picker */}
            <Card sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }} id="year-picker">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Year Picker</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Input for selecting a specific year.
                </Typography>
                <Stack direction="column" gap={3}>
                  <YearPickerElement label="Select Year" value={date} onChange={setDate} />
                </Stack>
              </Box>
              <ShowCodeAccordion
                code={`
import { YearPickerElement } from "../components/atom/date-picker";

<YearPickerElement label="Select Year" value={date} onChange={setDate} />
`}
              />
            </Card>

            {/* Month-Year Picker */}
            <Card sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }} id="month-year-picker">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Month-Year Picker</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Input for selecting both month and year.
                </Typography>
                <Stack direction="column" gap={3}>
                  <MonthYearPickerElement label="Select Month & Year" value={date} onChange={setDate} />
                </Stack>
              </Box>
              <ShowCodeAccordion
                code={`
import { MonthYearPickerElement } from "../components/atom/date-picker";

<MonthYearPickerElement label="Select Month & Year" value={date} onChange={setDate} />
`}
              />
            </Card>

            {/* Date Range Picker */}
            <Card sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }} id="date-range-picker">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Date Range Picker</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Select a date range with start and end.
                </Typography>
                <Box sx={{ maxWidth: 360 }}>
                  <Stack direction="column" gap={3}>
                    <DateRangePicker
                      label="Select Duration"
                      startValue={startDate}
                      endValue={endDate}
                      onChange={setDateRange}
                      min={dayjs()}
                      max={dayjs().add(1, "year")}
                      months={2}
                      required
                      width="100%"
                    />
                  </Stack>
                </Box>
              </Box>
              <ShowCodeAccordion
                code={`
import { DateRangePicker } from "../components/atom/custom-date-range-picker";
import dayjs from "dayjs";

const [startDate, setStartDate] = useState<Dayjs | null>(null);
const [endDate, setEndDate] = useState<Dayjs | null>(null);
const setDateRange = (dates: [Dayjs | null, Dayjs | null]) => {
  setStartDate(dates[0]);
  setEndDate(dates[1]);
};

<DateRangePicker
  label="Select Duration"
  startValue={startDate}
  endValue={endDate}
  onChange={setDateRange}
  min={dayjs()}
  max={dayjs().add(1, "year")}
  months={2}
  required
/>
`}
              />
            </Card>

            {/* Time Input */}
            <Card sx={{ mt: 3 }} id="time-input">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Time Input</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Input for choosing a specific time.
                </Typography>
                <Box sx={{ width: 300 }}>
                  <TimePickerElement label="Start Time" value={time} onChange={setTime} required />
                </Box>
              </Box>
              <ShowCodeAccordion
                code={`
import { TimePickerElement } from "../components/atom/time-picker";

const [time, setTime] = useState<Dayjs | null>(dayjs());

<TimePickerElement label="Start Time" value={time} onChange={setTime} required />
`}
              />
            </Card>

            {/* File Upload */}
            <Card sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }} id="file-upload">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">File Upload</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Component for selecting and uploading files.
                </Typography>
                <FileUploadField
                  accept="*"
                  label="Upload File"
                  value={image as File | null}
                  onChange={(file) => setImage(file)}
                  required
                />
              </Box>
              <ShowCodeAccordion
                code={`
import { FileUploadField } from "../components/atom/file-upload-field";

const [image, setImage] = useState<File | File[] | null>(null);

<FileUploadField
  label="Upload File"
  value={image}
  onChange={setImage}
  required
/>

// With options
<FileUploadField accept="image/*" label="Upload Image" value={image} onChange={setImage} multiple />
`}
              />
            </Card>

            {/* Color Picker */}
            <Card sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }} id="color-picker">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Color Picker</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Select a color value through an interactive picker.
                </Typography>
                <ColorPickerField label="Pick a Color" value={color} onChange={setColor} />
              </Box>
              <ShowCodeAccordion
                code={`
import { ColorPickerField } from "../components/atom/color-picker-field";

const [color, setColor] = useState("#1976d2");

<ColorPickerField label="Pick a Color" value={color} onChange={setColor} />
`}
              />
            </Card>

            {/* Repeater Input */}
            <Card sx={{ mt: 3, scrollMarginTop: { xs: 56, md: 24 } }} id="repeater-input">
              <Box sx={{ p: 4 }}>
                <Typography variant="h6">Repeater Input</Typography>
                <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                  Dynamically add or remove repeated sets of form fields. Shown: simple list, horizontal (multiple fields per row), and image upload repeater.
                </Typography>
                <Card sx={{ mb: 3 }}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Repeater with multiple fields per row</Typography>
                    <RepeaterElement
                      label="Team members"
                      items={repeaterUsers}
                      setItems={setRepeaterUsers}
                      gap={2}
                      initialItem={{ firstName: "", lastName: "", email: "" }}
                      renderItem={(item, _index, onChange) => (
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} flexWrap="wrap" sx={{ width: "100%" }}>
                          <TextFieldElement label="First Name" value={item.firstName} onChange={(e) => onChange("firstName", e.target.value)} />
                          <TextFieldElement label="Last Name" value={item.lastName} onChange={(e) => onChange("lastName", e.target.value)} />
                          <TextFieldElement label="Email" value={item.email} onChange={(e) => onChange("email", e.target.value)} />
                        </Stack>
                      )}
                    />
                  </Box>
                </Card>
                <Card>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Image / file upload repeater</Typography>
                    <RepeaterElement<{ file: File | null }>
                      label="Upload files"
                      items={repeaterFiles}
                      setItems={setRepeaterFiles}
                      initialItem={{ file: null }}
                      renderItem={(item, index, onChange) => (
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} flexWrap="wrap" sx={{ width: "100%" }}>
                          <FileUploadField
                            accept="image/*"
                            label={`File ${index + 1}`}
                            value={item.file}
                            onChange={(file) => onChange("file", file)}
                            required
                          />
                        </Stack>
                      )}
                    />
                  </Box>
                </Card>
              </Box>
              <ShowCodeAccordion
                code={`
import { RepeaterElement } from "../components/atom/form-repeater";
import { TextFieldElement } from "../components/atom/text-field";
import { FileUploadField } from "../components/atom/file-upload-field";

// Simple list
const [items, setItems] = useState([{ name: "" }]);
<RepeaterElement
  label="Items"
  items={items}
  setItems={setItems}
  initialItem={{ name: "" }}
  renderItem={(item, index, onChange) => (
    <TextFieldElement label="Item name" value={item.name} onChange={(e) => onChange("name", e.target.value)} />
  )}
/>

// Horizontal repeater (multiple fields per row)
const [users, setUsers] = useState([{ firstName: "", lastName: "", email: "" }]);
<RepeaterElement
  label="Team members"
  items={users}
  setItems={setUsers}
  gap={2}
  initialItem={{ firstName: "", lastName: "", email: "" }}
  renderItem={(item, index, onChange) => (
    <Stack direction="row" spacing={2} flexWrap="wrap">
      <TextFieldElement label="First Name" value={item.firstName} onChange={(e) => onChange("firstName", e.target.value)} />
      <TextFieldElement label="Last Name" value={item.lastName} onChange={(e) => onChange("lastName", e.target.value)} />
      <TextFieldElement label="Email" value={item.email} onChange={(e) => onChange("email", e.target.value)} />
    </Stack>
  )}
/>

// Image / file upload repeater
const [files, setFiles] = useState([{ file: null }]);
<RepeaterElement<{ file: File | null }>
  label="Upload files"
  items={files}
  setItems={setFiles}
  initialItem={{ file: null }}
  renderItem={(item, index, onChange) => (
    <FileUploadField
      accept="image/*"
      label={\`File \${index + 1}\`}
      value={item.file}
      onChange={(file) => onChange("file", file)}
      required
    />
  )}
/>
`}
              />
            </Card>
          </Card>

          {/* === Cards === */}
          <Box id="cards" sx={{ scrollMarginTop: { xs: 56, md: 24 } }}>
            <Card sx={{ mt: 3, p: { xs: 2, md: 5 } }}>
              <Typography variant="h5">Cards</Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Default, primary, secondary, and collapsible card containers.
              </Typography>
              <Card sx={{ mt: 2 }}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6">Default (CardAtom)</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Base card with optional variant.
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap">
                    <CardAtom variant="none" sx={{ minWidth: 160, p: 2 }}><Typography variant="body2">Default card</Typography></CardAtom>
                  </Stack>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6">Primary & Secondary</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Themed cards for emphasis.
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap">
                    <PrimaryCard sx={{ minWidth: 160 }}><Typography variant="body2" color="inherit">Primary card</Typography></PrimaryCard>
                    <SecondaryCard sx={{ minWidth: 160 }}><Typography variant="body2">Secondary card</Typography></SecondaryCard>
                  </Stack>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6">Collapsible Card</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Expandable/collapsible section with custom header.
                  </Typography>
                  <CollapsibleCard header={<Typography fontWeight={600}>Collapsible section</Typography>} defaultOpen>
                    <Typography variant="body2">Content inside collapsible card.</Typography>
                  </CollapsibleCard>
                </Box>
                <ShowCodeAccordion
                  code={`
import CardAtom from "../components/atom/card/Card";
import { PrimaryCard } from "../components/atom/card/PrimaryCard";
import { SecondaryCard } from "../components/atom/card/SecondaryCard";
import { CollapsibleCard } from "../components/atom/card/CollapsibleCard";

// Default
<CardAtom variant="none" sx={{ p: 2 }}>Content</CardAtom>

// Themed
<PrimaryCard sx={{ minWidth: 160 }}>Content</PrimaryCard>
<SecondaryCard sx={{ minWidth: 160 }}>Content</SecondaryCard>

// Collapsible
<CollapsibleCard header={<Typography fontWeight={600}>Section title</Typography>} defaultOpen>
  <Typography variant="body2">Content here.</Typography>
</CollapsibleCard>
`}
                />
              </Card>
            </Card>
          </Box>

          {/* === Toggle Button === */}
          <Box id="toggle-button" sx={{ scrollMarginTop: { xs: 56, md: 24 } }}>
            <Card sx={{ mt: 3, p: { xs: 2, md: 5 } }}>
              <Typography variant="h6">Toggle Button Group</Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Single selection from a group of toggle buttons.
              </Typography>
              <Card sx={{ mt: 2 }}>
                <Box sx={{ p: 2 }}>
                  <ToggleButtonAtom value={toggleOption} options={toggleOptions} onChange={setToggleOption} />
                </Box>
                <ShowCodeAccordion
                  code={`
import { ToggleButtonAtom } from "../components/atom/toggle-button-atom/ToggleButtonAtom";

const options = [{ value: "one", label: "One" }, { value: "two", label: "Two" }, { value: "three", label: "Three" }];
const [value, setValue] = useState("one");

<ToggleButtonAtom value={value} options={options} onChange={setValue} />
`}
                />
              </Card>
            </Card>
          </Box>

          {/* === Tooltip === */}
          <Box id="tooltip" sx={{ scrollMarginTop: { xs: 56, md: 24 } }}>
            <Card sx={{ mt: 3, p: { xs: 2, md: 5 } }}>
              <Typography variant="h6">Tooltip</Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Hover to show additional information. Wrap a focusable or hoverable element (e.g. in a span if needed).
              </Typography>
              <Card sx={{ mt: 2 }}>
                <Box sx={{ p: 2 }}>
                  <Tooltip title="Help text here">
                    <span><PrimaryButton>Hover me</PrimaryButton></span>
                  </Tooltip>
                </Box>
                <ShowCodeAccordion
                  code={`
import { Tooltip } from "../components/atom/tooltip";
import { PrimaryButton } from "../components/atom/button";

<Tooltip title="Help text here">
  <span><PrimaryButton>Hover me</PrimaryButton></span>
</Tooltip>
`}
                />
              </Card>
            </Card>
          </Box>

          {/* === Loading & Skeleton === */}
          <Box id="skeleton" sx={{ scrollMarginTop: { xs: 56, md: 24 } }}>
            <Card sx={{ mt: 3, p: { xs: 2, md: 5 } }}>
              <Typography variant="h6">Circular Progress & Skeleton</Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Loading spinner and skeleton placeholders for async content.
              </Typography>
              <Card sx={{ mt: 2 }}>
                <Box sx={{ p: 2 }}>
                  <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                    <CustomCircularProgress size={40} />
                    <SkeletonText width={200} variant="text" />
                    <SkeletonText width={100} height={32} variant="rectangular" />
                  </Stack>
                </Box>
                <ShowCodeAccordion
                  code={`
import CustomCircularProgress from "../components/atom/circular-progress/CircularProgress";
import { SkeletonText } from "../components/atom/skeleton";

// Spinner
<CustomCircularProgress size={40} />

// Text skeleton
<SkeletonText width={200} variant="text" />

// Rectangular (e.g. avatar or block)
<SkeletonText width={100} height={32} variant="rectangular" />
`}
                />
              </Card>
            </Card>
          </Box>

          {/* === Accordion (Show Code) === */}
          <Box id="accordion" sx={{ scrollMarginTop: { xs: 56, md: 24 } }}>
            <Card sx={{ mt: 3, p: { xs: 2, md: 5 } }}>
              <Typography variant="h6">Show Code Accordion</Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Use this in style guides to reveal usage code for each section.
              </Typography>
              <Card sx={{ mt: 2 }}>
                <ShowCodeAccordion
                  code={`
import { ShowCodeAccordion } from "../components/atom/accordion";

<ShowCodeAccordion
  code={\`<YourComponent />\`}
  label="Show Code"
  labelOpen="Hide Code"
/>
`}
                />
              </Card>
            </Card>
          </Box>

          {/* === Dialogs === */}
          <Box id="dialogs" sx={{ scrollMarginTop: { xs: 56, md: 24 } }}>
            <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2 }}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Dialogs</Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Modal components used to display information or request user actions without navigating away from the page.
              </Typography>
              <Card>
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Confirm Dialog</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Use for confirming critical or irreversible actions, ensuring user awareness before proceeding.
                  </Typography>
                </Box>
                <ShowCodeAccordion
                  code={`
import { ConfirmDialog } from "../components/dialogs/confirm-dialog";
import { useModal } from "../hooks/useDialog";

const confirmModal = useModal();
<ConfirmDialog
  open={confirmModal.open}
  onClose={confirmModal.handleClose}
  onConfirm={handleConfirm}
  title="Confirm Submission"
  message="Are you sure you want to delete the user"
  confirmColor="error"
  cancelColor="secondary"
/>
`}
                />
              </Card>
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Content Dialog</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Use for displaying forms, details, or other structured content inside a modal container.
                  </Typography>
                </Box>
                <ShowCodeAccordion
                  code={`
import { ModalElement } from "../components/dialogs/modal-element";
import { useModal } from "../hooks/useDialog";

const formModal = useModal();
<ModalElement open={formModal.open} title="Create User" onClose={formModal.handleClose}>
  <Stack spacing={2}>
    <TextField label="Name" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} fullWidth />
    <Button variant="contained" onClick={handleFormSubmit}>Save</Button>
  </Stack>
</ModalElement>
`}
                />
              </Card>
            </Card>
          </Box>

          {/* === Tables === */}
          <Box id="tables" sx={{ scrollMarginTop: { xs: 56, md: 24 } }}>
            <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2 }}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>DataTables</Typography>
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Basic Datatables</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Interactive data tables with built-in support for sorting, filtering, and pagination.
                  </Typography>
                  <DataTable columns={columns} rows={[...rows]} loading={false} pagination tableHeight={400} />
                </Box>
                <ShowCodeAccordion
                  code={`
import { DataTable } from "../components/tables/data-table";

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "email", headerName: "Email", flex: 2 },
  { field: "status", headerName: "Status", flex: 1 },
];
<DataTable columns={columns} rows={rows} loading={false} pagination tableHeight={500} />
`}
                />
              </Card>
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Editable Datatables</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Interactive data tables with built-in support for inline edit of data.
                  </Typography>
                  <Box sx={{ height: 400, width: "100%" }}>
                    <EditableDataGridWithConfirm rows={rows} columns={columns} />
                  </Box>
                </Box>
                <ShowCodeAccordion
                  code={`
import { EditableDataGridWithConfirm } from "../components/tables/data-table/EditableDataGridWithConfirm";

<EditableDataGridWithConfirm rows={rows} columns={columns} />
`}
                />
              </Card>
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Quick Filter Datatables</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Interactive data tables with built-in support for quick filtering and csv export.
                  </Typography>
                  <Box sx={{ height: 420, width: "100%" }}>
                    <QuickFilterDataGrid
                      rows={quickrows}
                      columns={quickcolumns}
                      pageSize={5}
                      pagination
                      maxHeight={380}
                    />
                  </Box>
                </Box>
                <ShowCodeAccordion
                  code={`
import { QuickFilterDataGrid } from "../components/tables/data-table/QuickFilterDataGrid";

<QuickFilterDataGrid rows={quickrows} columns={quickcolumns} pageSize={5} />
`}
                />
              </Card>
              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Native Tables</Typography>
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Dense Table</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Compact, high-density data tables optimized for space-constrained layouts.
                  </Typography>
                  <DenseTableAtom columns={densecolumns} rows={denserows} />
                </Box>
                <ShowCodeAccordion
                  code={`
import { DenseTableAtom } from "../components/tables/standard-table/DenseTableAtom";

const densecolumns = [{ label: "Dessert", field: "name", align: "left" }, ...];
const denserows = [{ name: "Frozen yoghurt", calories: 159, ... }, ...];
<DenseTableAtom columns={densecolumns} rows={denserows} />
`}
                />
              </Card>
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Collapsible Tables</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Expandable data tables with row-level detail views for hierarchical data.
                  </Typography>
                  <CollapsibleTableAtom
                    columns={collapsecolumns}
                    rows={collpaserows}
                    renderCollapseContent={(row) => (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(row as { history?: { date: string; customer: string; amount: number }[] }).history?.map((h) => (
                            <TableRow key={h.date}>
                              <TableCell>{h.date}</TableCell>
                              <TableCell>{h.customer}</TableCell>
                              <TableCell align="right">{h.amount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  />
                </Box>
                <ShowCodeAccordion
                  code={`
import { CollapsibleTableAtom } from "../components/tables/standard-table/CollapsibleTableAtom";

<CollapsibleTableAtom
  columns={collapsecolumns}
  rows={collpaserows}
  renderCollapseContent={(row) => (
    <Table size="small">
      <TableHead><TableRow>...</TableRow></TableHead>
      <TableBody>{row.history?.map(...)}</TableBody>
    </Table>
  )}
/>
`}
                />
              </Card>
              {/* Collapsible Rows Table (variable child rows) — first column + Nudge all / Nudge
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Collapsible Rows Table (variable child rows)</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Parent rows show only the first column (e.g. department name) and an action button (e.g. &quot;Nudge all&quot;). Child rows show data in all columns (Department, Code, Manager, Action with per-row &quot;Nudge&quot;). Expand a parent to see its child rows.
                  </Typography>
                  <CollapsibleRowsTableAtom
                    columns={collapsibleRowsTableColumns}
                    rows={collapsibleRowsTableRows}
                    renderParentActions={(row) => (
                      <SecondaryButton size="small" onClick={() => console.log("Nudge all", row)}>
                        Nudge all
                      </SecondaryButton>
                    )}
                    parentRowNoColumnSeparation
                    ariaLabel="Departments and sub-departments"
                  />
                </Box>
                <ShowCodeAccordion
                  code={`
import { CollapsibleRowsTableAtom } from "../components/tables/standard-table/CollapsibleRowsTableAtom";
import { SecondaryButton } from "../components/atom/button";

// Parent rows: first column + "Nudge all" in Actions. Child rows: all columns + per-row "Nudge"
const columns = [
  { label: "Department", field: "name" },
  { label: "Code", field: "code" },
  { label: "Manager", field: "manager" },
  {
    label: "Action",
    field: "action",
    align: "right",
    render: (_v, row, ctx) =>
      ctx?.isChild ? <SecondaryButton size="small" onClick={() => handleNudge(row)}>Nudge</SecondaryButton> : null,
  },
];
const rows = []; // parent rows with children arrays

<CollapsibleRowsTableAtom
  columns={columns}
  rows={rows}
  renderParentActions={(row) => (
    <SecondaryButton size="small" onClick={() => handleNudgeAll(row)}>Nudge all</SecondaryButton>
  )}
  ariaLabel="Departments"
/>
`}
                />
              </Card>
              */}
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Collapsible Rows Table (simple — data in all columns)</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Same atom without parent actions: parent and child rows both show data in every column. Standard table look with expand/collapse per parent row.
                  </Typography>
                  <CollapsibleRowsTableAtom
                    columns={collapsibleRowsTableSimpleColumns}
                    rows={collapsibleRowsTableSimpleRows}
                    ariaLabel="Desserts and variants"
                  />
                </Box>
                <ShowCodeAccordion
                  code={`
import { CollapsibleRowsTableAtom } from "../components/tables/standard-table/CollapsibleRowsTableAtom";

// Simple: no renderParentActions — parent and child rows show all columns
const columns = [
  { label: "Dessert (100g serving)", field: "name" },
  { label: "Calories", field: "calories", align: "right" },
  { label: "Fat (g)", field: "fat", align: "right" },
  { label: "Carbs (g)", field: "carbs", align: "right" },
];
const rows = [
  {
    id: "cat-1",
    name: "Frozen yoghurt",
    calories: 159,
    fat: 6.0,
    carbs: 24,
    children: [
      { id: "c1-1", name: "Vanilla", calories: 140, fat: 5, carbs: 22 },
      { id: "c1-2", name: "Strawberry", calories: 165, fat: 6.5, carbs: 26 },
    ],
  },
  { id: "cat-2", name: "Ice cream sandwich", calories: 237, fat: 9, carbs: 37, children: [...] },
];

<CollapsibleRowsTableAtom columns={columns} rows={rows} ariaLabel="Desserts" />
`}
                />
              </Card>
            </Card>
          </Box>

          {/* === Accordion Element === */}
          <Box id="accordion-element">
            <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2 }}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Accordion Element</Typography>
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 4 }}>
                  <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                    Expandable panels that reveal or hide content to organize complex information in a compact way.
                  </Typography>
                </Box>
                <ShowCodeAccordion
                  code={`
import { AccordionElement } from "../components/atom/accordion";

<AccordionElement title="Add New User" defaultOpen>
  <Stack spacing={2}>
    <TextField label="Name" fullWidth />
    <TextField label="Email" fullWidth />
    <Button type="submit" variant="contained" color="primary">Save</Button>
  </Stack>
</AccordionElement>
`}
                />
              </Card>
            </Card>
          </Box>

          {/* === Slider === */}
          <Box id="slider">
            <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2 }}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Slider Element</Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Slider for selecting a value from a range.
              </Typography>
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 4 }}>
                  <Box sx={{ width: { xs: "100%", sm: 300, md: 400 } }}>
                    <Typography gutterBottom>Volume: {sliderValue}</Typography>
                    <SliderAtom value={sliderValue} onChange={setSliderValue} min={0} max={100} step={5} marks={[{ value: 0, label: "0" }, { value: 50, label: "50" }, { value: 100, label: "100" }]} />
                  </Box>
                </Box>
                <ShowCodeAccordion
                  code={`
import { SliderAtom } from "../components/slider";

const [value, setValue] = useState(30);
<SliderAtom value={value} onChange={setValue} min={0} max={100} step={5} marks={[{ value: 0, label: "0" }, { value: 50, label: "50" }, { value: 100, label: "100" }]} />
`}
                />
              </Card>
            </Card>
          </Box>

          {/* === Tabs === */}
          <Box id="tabs" sx={{ scrollMarginTop: { xs: 56, md: 24 } }}>
            <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2 }}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Tabs Element</Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                Tabs used to have separate sections of content in pages. Use horizontal tabs for top tab bars; use vertical tabs for side navigation with labels and icons.
              </Typography>
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 2, pb: 0 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                    Horizontal tabs
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Tab labels in a row at the top; content below.
                  </Typography>
                </Box>
                <TabsAtom tabs={atomtabs} />
                <ShowCodeAccordion
                  code={`
import { TabsAtom } from "../components/tabs/Tabs";

const atomtabs = [
  { label: "Profile", icon: <PersonOutlineTwoTone />, content: "Profile content goes here." },
  { label: "Followers", icon: <RecentActorsTwoTone />, content: "Followers list..." },
];
<TabsAtom tabs={atomtabs} />
`}
                />
              </Card>
              <Card sx={{ mt: 3 }}>
                <Box sx={{ p: 2, pb: 0 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                    Vertical tabs
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Tabs in a column on the left with optional icon and sublabel; content on the right.
                  </Typography>
                </Box>
                <VerticalTabsAtom tabs={verticaltabs} />
                <ShowCodeAccordion
                  code={`
import { VerticalTabsAtom } from "../components/tabs";

const tabs = [
  { label: "User Profile", subLabel: "Profile Settings", icon: <PersonOutlineTwoTone />, content: <Typography>...</Typography> },
  ...
];
<VerticalTabsAtom tabs={tabs} />
`}
                />
              </Card>
            </Card>
          </Box>
        </CardContent>
      </Card>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        />
      )}
    </Box>
  );
}

export default StyleGuide;
