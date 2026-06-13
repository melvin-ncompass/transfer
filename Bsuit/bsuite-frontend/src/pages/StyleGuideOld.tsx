// import {
//   Box,
//   Card,
//   CardContent,
//   Stack,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   Typography,
// } from "@mui/material";
// // import { PrimaryButton, SecondaryButton } from "../components/atom/button";
// import { useTheme } from "@mui/material/styles";
// import { ShowCodeAccordion } from "../components/atom/accordion";
// import { Label } from "../components/atom/label";
// import CheckIcon from "@mui/icons-material/Check";
// import InfoIcon from "@mui/icons-material/Info";
// import WarningIcon from "@mui/icons-material/Warning";
// import ErrorIcon from "@mui/icons-material/Error";
// import { Chip, ChipDualIcon } from "../components/atom/chips";
// import StarIcon from "@mui/icons-material/Star";
// import { Snackbar } from "../components/atom/snackbar";
// import { TextFieldElement } from "../components/atom/text-field";
// import { useState } from "react";
// import { SingleSelectElement } from "../components/atom/select-field/SingleSelect";
// import { MultiSelectElement } from "../components/atom/select-field/MultiSelect";
// import {
//   DatePickerElement,
//   MonthPickerElement,
//   MonthYearPickerElement,
//   YearPickerElement,
// } from "../components/atom/date-picker";
// import dayjs, { Dayjs } from "dayjs";
// import { RepeaterElement } from "../components/atom/form-repeater";
// import { TimePickerElement } from "../components/atom/time-picker";
// import { TextAreaField } from "../components/atom/text-area-field";
// import { ColorPickerField } from "../components/atom/color-picker-field";
// import { FileUploadField } from "../components/atom/file-upload-field";
// import { Checkbox } from "../components/atom/check-box";
// import { RadioButton } from "../components/atom/radio-button";
// import { ToggleSwitch } from "../components/atom/toggle-switch";
// import StyleGuideSidebar from "../components/sidebar/StyleGuideSidebar";
// import Avatar from "@mui/material/Avatar";
// import CloseIcon from "@mui/icons-material/Close";
// import { PrimaryButton, SecondaryButton } from "../components/atom/button";
// import { EditableDataGridWithConfirm } from "../components/tables/data-table/EditableDataGridWithConfirm";
// import type { GridColDef, GridRowsProp } from "@mui/x-data-grid";
// import { QuickFilterDataGrid } from "../components/tables/data-table/QuickFilterDataGrid";
// import { DenseTableAtom } from "../components/tables/standard-table/DenseTableAtom";
// import { CollapsibleTableAtom } from "../components/tables/standard-table/CollapsibleTableAtom";
// import { SliderAtom } from "../components/slider";
// import { TabsAtom } from "../components/tabs/Tabs";
// import {
//   CreditCardTwoTone,
//   DescriptionTwoTone,
//   PanoramaTwoTone,
//   PeopleAltTwoTone,
//   PersonOutlineTwoTone,
//   RecentActorsTwoTone,
//   VpnKeyTwoTone,
// } from "@mui/icons-material";
// import { VerticalTabsAtom } from "../components/tabs";
// import MenuAtom from "../components/menuatom/MenuAtom";
// import { DataTable } from "../components/tables/data-table";
// import { DateRangePicker } from "../components/atom/custom-date-range-picker";

// function StyleGuideOld() {
//   const theme = useTheme();
//   const [role, setRole] = useState("");
//   const [description, setDescription] = useState("");
//   const [image, setImage] = useState<File | File[] | null>(null);
//   const [color, setColor] = useState("#ff0000");
//   const [skills, setSkills] = useState<string[]>([""]);
//   const [date, setDate] = useState<Dayjs | null>(dayjs());
//   const [startDate, setStartDate] = useState<Dayjs | null>(null);
//   const [endDate, setEndDate] = useState<Dayjs | null>(null);
//   const setDateRange = (dates: [Dayjs | null, Dayjs | null]) => {
//     setStartDate(dates[0]);
//     setEndDate(dates[1]);
//   };
//   const [time, setTime] = useState<Dayjs | null>(dayjs());
//   const [checked, setChecked] = useState(false);
//   const [selected, setSelected] = useState("option1");
//   const [enabled, setEnabled] = useState(true);
//   const [_files, setFiles] = useState<{ file: File | null }[]>([
//     { file: null },
//   ]);
//   const [users, setUsers] = useState<
//     {
//       firstName: string;
//       lastName: string;
//       email: string;
//       role: string;
//     }[]
//   >([{ firstName: "", lastName: "", email: "", role: "" }]);

//   const options = [
//     { label: "Developer", value: "developer" },
//     { label: "Designer", value: "designer" },
//     { label: "Manager", value: "manager" },
//   ];

//   const skillOptions = [
//     { label: "React", value: "react" },
//     { label: "Node", value: "node" },
//     { label: "Python", value: "python" },
//   ];

//   const grey = theme.palette.grey;

//   // Brand colors (excluding greys)
//   const colorGroups = [
//     { name: "Primary", value: theme.palette.primary.main },
//     { name: "Secondary", value: theme.palette.secondary.main },
//     { name: "Success", value: theme.palette.success.main },
//     { name: "Error", value: theme.palette.error.main },
//     { name: "Warning", value: theme.palette.warning.main },
//     { name: "Info", value: theme.palette.info.main },
//   ];

//   const variants: (keyof typeof theme.typography)[] = [
//     "h1",
//     "h2",
//     "h3",
//     "h4",
//     "h5",
//     "h6",
//     "body1",
//     "body2",
//     "subtitle1",
//     "subtitle2",
//     "caption",
//     "overline",
//   ];

//   const getResponsiveSizes = (style: any) => {
//     const breakpoints: Record<string, string> = {};
//     if (style["@media (min-width:600px)"])
//       breakpoints.sm = style["@media (min-width:600px)"].fontSize;
//     if (style["@media (min-width:900px)"])
//       breakpoints.md = style["@media (min-width:900px)"].fontSize;
//     if (style["@media (min-width:1200px)"])
//       breakpoints.lg = style["@media (min-width:1200px)"].fontSize;
//     return breakpoints;
//   };

//   const textColors = [
//     { name: "Default Text", color: "text.primary" },
//     { name: "Default Secondary Text", color: "text.secondary" },
//     { name: "Colored Primary Text", color: "primary.main" },
//     { name: "Colored Secondary Text", color: "secondary.main" },
//     { name: "Success Text", color: "success.main" },
//     { name: "Error Text", color: "error.main" },
//     { name: "Info Text", color: "info.main" },
//     { name: "Warning Text", color: "warning.main" },
//   ];

//   function handleDelete() {
//     console.log("Delete Clicked");
//   }

//   function handleClick() {
//     console.log("Clicked");
//   }

//   function handleToastClose() {
//     console.log("Snackbar is closed");
//   }

//   // const columns: GridColDef[] = [
//   //   { field: "id", headerName: "ID", flex: 0.4 },
//   //   { field: "name", headerName: "Name", flex: 1, editable: true },
//   //   { field: "email", headerName: "Email", flex: 2, editable: true },
//   //   { field: "role", headerName: "Role", flex: 1.2, editable: true },
//   //   { field: "department", headerName: "Department", flex: 1.2, editable: true },
//   //   { field: "age", headerName: "Age", type: "number", flex: 0.8, editable: true },
//   //   { field: "phone", headerName: "Phone Number", flex: 1.7, editable: true },
//   //   { field: "address", headerName: "Address", flex: 1.5, editable: true },
//   //   { field: "status", headerName: "Status", flex: 1, editable: true },
//   //   { field: "dateCreated", headerName: "Date Created", type: "date", flex: 1.2, editable: true },
//   //   { field: "lastLogin", headerName: "Last Login", type: "dateTime", flex: 1.2, editable: true },
//   //   { field: "ip", headerName: "IP Address", flex: 1, editable: true },
//   // ];

//   const columns: GridColDef[] = [
//     { field: "id", headerName: "ID", flex: 0.4, minWidth: 80, maxWidth: 100 },

//     {
//       field: "name",
//       headerName: "Name",
//       flex: 1,
//       editable: true,
//       minWidth: 160,
//       maxWidth: 220,
//     },

//     {
//       field: "email",
//       headerName: "Email",
//       flex: 2,
//       editable: true,
//       minWidth: 320,
//       maxWidth: 360,
//     },

//     {
//       field: "role",
//       headerName: "Role",
//       flex: 1.2,
//       editable: true,
//       minWidth: 160,
//       maxWidth: 220,
//     },

//     {
//       field: "department",
//       headerName: "Department",
//       flex: 1.2,
//       editable: true,
//       minWidth: 160,
//       maxWidth: 240,
//     },

//     {
//       field: "age",
//       headerName: "Age",
//       type: "number",
//       flex: 0.8,
//       editable: true,
//       minWidth: 100,
//       maxWidth: 120,
//     },

//     {
//       field: "phone",
//       headerName: "Phone Number",
//       flex: 1.7,
//       editable: true,
//       minWidth: 200,
//       maxWidth: 280,
//     },

//     {
//       field: "address",
//       headerName: "Address",
//       flex: 1.5,
//       editable: true,
//       minWidth: 240,
//       maxWidth: 340,
//     },

//     {
//       field: "status",
//       headerName: "Status",
//       flex: 1,
//       editable: true,
//       minWidth: 120,
//       maxWidth: 160,
//     },

//     {
//       field: "dateCreated",
//       headerName: "Date Created",
//       type: "date",
//       flex: 1.2,
//       editable: true,
//       minWidth: 180,
//       maxWidth: 220,
//     },

//     {
//       field: "lastLogin",
//       headerName: "Last Login",
//       type: "dateTime",
//       flex: 1.2,
//       editable: true,
//       minWidth: 240,
//       maxWidth: 260,
//     },

//     {
//       field: "ip",
//       headerName: "IP Address",
//       flex: 1,
//       editable: true,
//       minWidth: 180,
//       maxWidth: 200,
//     },
//   ];

//   const rows: GridRowsProp = [
//     {
//       id: 1,
//       name: "Jane Doe",
//       email: "jane.doe@example.com",
//       role: "Admin",
//       department: "Engineering",
//       age: 25,
//       phone: "+91 9876543210",
//       address: "123 MG Road, Bangalore",
//       status: "Active",
//       dateCreated: new Date("2025-01-15"),
//       lastLogin: new Date("2025-12-01T10:00:00"),
//       ip: "192.168.0.12",
//     },
//     {
//       id: 2,
//       name: "Steve Smith",
//       email: "steve.smith@example.com",
//       role: "Manager",
//       department: "Finance",
//       age: 30,
//       phone: "+91 9988776655",
//       address: "456 Anna Nagar, Chennai",
//       status: "Inactive",
//       dateCreated: new Date("2025-03-22"),
//       lastLogin: new Date("2025-12-05T08:30:00"),
//       ip: "192.168.0.23",
//     },
//     {
//       id: 3,
//       name: "Priya Nair",
//       email: "priya.nair@example.com",
//       role: "Designer",
//       department: "Marketing",
//       age: 28,
//       phone: "+91 9123456789",
//       address: "22 Park Street, Mumbai",
//       status: "Active",
//       dateCreated: new Date("2025-05-10"),
//       lastLogin: new Date("2025-12-06T14:15:00"),
//       ip: "10.0.0.34",
//     },
//     {
//       id: 4,
//       name: "Rahul Mehta",
//       email: "rahul.mehta@example.com",
//       role: "Developer",
//       department: "Engineering",
//       age: 26,
//       phone: "+91 9345678123",
//       address: "12 Residency Road, Pune",
//       status: "Active",
//       dateCreated: new Date("2025-02-12"),
//       lastLogin: new Date("2025-12-08T18:45:00"),
//       ip: "172.16.5.89",
//     },
//   ];

//   const quickcolumns: GridColDef[] = [
//     { field: "id", headerName: "ID", flex: 0.4, minWidth: 80, maxWidth: 100 },
//     {
//       field: "name",
//       headerName: "Name",
//       flex: 1,
//       minWidth: 120,
//       maxWidth: 180,
//     },
//     {
//       field: "country",
//       headerName: "Country",
//       flex: 1,
//       minWidth: 200,
//       maxWidth: 300,
//     },
//     {
//       field: "city",
//       headerName: "City",
//       flex: 1,
//       minWidth: 170,
//       maxWidth: 200,
//     },
//     {
//       field: "email",
//       headerName: "Email",
//       flex: 1.5,
//       minWidth: 240,
//       maxWidth: 350,
//     },
//     {
//       field: "phone",
//       headerName: "Phone",
//       flex: 1.2,
//       minWidth: 180,
//       maxWidth: 220,
//     },
//     {
//       field: "role",
//       headerName: "Role",
//       flex: 1,
//       minWidth: 180,
//       maxWidth: 250,
//     },
//     {
//       field: "age",
//       headerName: "Age",
//       type: "number",
//       flex: 0.6,
//       minWidth: 80,
//       maxWidth: 100,
//     },
//     {
//       field: "status",
//       headerName: "Status",
//       flex: 0.8,
//       minWidth: 130,
//       maxWidth: 140,
//     },
//     {
//       field: "department",
//       headerName: "Department",
//       flex: 1.2,
//       minWidth: 180,
//       maxWidth: 200,
//     },
//     {
//       field: "joinDate",
//       headerName: "Join Date",
//       type: "date",
//       flex: 1,
//       minWidth: 140,
//       maxWidth: 180,
//     },
//     {
//       field: "lastLogin",
//       headerName: "Last Login",
//       type: "dateTime",
//       flex: 1.2,
//       minWidth: 230,
//       maxWidth: 280,
//     },
//     {
//       field: "ip",
//       headerName: "IP Address",
//       flex: 1,
//       minWidth: 180,
//       maxWidth: 220,
//     },
//   ];

//   const quickrows = [
//     {
//       id: 1,
//       name: "Afzal",
//       country: "India",
//       city: "Bangalore",
//       email: "afzal@example.com",
//       phone: "+91 9876543210",
//       role: "Software Engineer",
//       age: 27,
//       status: "Active",
//       department: "Engineering",
//       joinDate: new Date("2022-05-15"),
//       lastLogin: new Date("2025-12-01T09:30:00"),
//       ip: "192.168.1.10",
//     },
//     {
//       id: 2,
//       name: "John",
//       country: "United Kingdom",
//       city: "London",
//       email: "john@example.com",
//       phone: "+44 7700 900123",
//       role: "Product Manager",
//       age: 32,
//       status: "Inactive",
//       department: "Product",
//       joinDate: new Date("2021-08-20"),
//       lastLogin: new Date("2025-11-28T17:45:00"),
//       ip: "10.0.0.5",
//     },
//     {
//       id: 3,
//       name: "Sara",
//       country: "United States",
//       city: "New York",
//       email: "sara@example.com",
//       phone: "+1 212 555 7890",
//       role: "Designer",
//       age: 29,
//       status: "Active",
//       department: "Design",
//       joinDate: new Date("2023-02-10"),
//       lastLogin: new Date("2025-12-03T11:10:00"),
//       ip: "172.16.5.22",
//     },
//     {
//       id: 4,
//       name: "Mei Lin",
//       country: "Singapore",
//       city: "Singapore",
//       email: "mei.lin@example.com",
//       phone: "+65 8123 4567",
//       role: "HR Specialist",
//       age: 26,
//       status: "Active",
//       department: "Human Resources",
//       joinDate: new Date("2024-01-12"),
//       lastLogin: new Date("2025-12-05T14:20:00"),
//       ip: "192.168.10.15",
//     },
//     {
//       id: 5,
//       name: "Carlos",
//       country: "Spain",
//       city: "Madrid",
//       email: "carlos@example.com",
//       phone: "+34 612 345 678",
//       role: "QA Engineer",
//       age: 31,
//       status: "Active",
//       department: "Quality Assurance",
//       joinDate: new Date("2020-10-05"),
//       lastLogin: new Date("2025-11-29T08:50:00"),
//       ip: "192.168.0.44",
//     },
//     {
//       id: 6,
//       name: "Aisha",
//       country: "UAE",
//       city: "Dubai",
//       email: "aisha@example.com",
//       phone: "+971 50 234 5678",
//       role: "Marketing Lead",
//       age: 34,
//       status: "Active",
//       department: "Marketing",
//       joinDate: new Date("2023-03-25"),
//       lastLogin: new Date("2025-12-04T19:10:00"),
//       ip: "10.1.1.22",
//     },
//   ];

//   const densecolumns = [
//     { label: "Dessert (100g serving)", field: "name", align: "left" },
//     { label: "Calories", field: "calories", align: "right" },
//     { label: "Fat (g)", field: "fat", align: "right" },
//     { label: "Carbs (g)", field: "carbs", align: "right" },
//     { label: "Protein (g)", field: "protein", align: "right" },
//   ];

//   const denserows = [
//     { name: "Frozen yoghurt", calories: 159, fat: 6, carbs: 24, protein: 4.0 },
//     {
//       name: "Ice cream sandwich",
//       calories: 237,
//       fat: 9,
//       carbs: 37,
//       protein: 4.3,
//     },
//     { name: "Eclair", calories: 262, fat: 16, carbs: 24, protein: 6.0 },
//     { name: "Cupcake", calories: 305, fat: 3.7, carbs: 67, protein: 4.3 },
//     { name: "Gingerbread", calories: 356, fat: 16, carbs: 49, protein: 3.9 },
//   ];

//   const collapsecolumns = [
//     { label: "Dessert (100g serving)", field: "name" },
//     { label: "Calories", field: "calories", align: "right" },
//     { label: "Fat (g)", field: "fat", align: "right" },
//     { label: "Carbs (g)", field: "carbs", align: "right" },
//     { label: "Protein (g)", field: "protein", align: "right" },
//   ];

//   const collpaserows = [
//     {
//       id: 1,
//       name: "Frozen yoghurt",
//       calories: 159,
//       fat: 6.0,
//       carbs: 24,
//       protein: 4.0,
//       history: [
//         { date: "2020-01-05", customer: "11091700", amount: 3 },
//         { date: "2020-01-02", customer: "Anonymous", amount: 1 },
//       ],
//     },
//     {
//       id: 2,
//       name: "Ice cream sandwich",
//       calories: 237,
//       fat: 9.0,
//       carbs: 37,
//       protein: 4.3,
//       history: [
//         { date: "2020-02-01", customer: "X1257", amount: 2 },
//         { date: "2020-03-11", customer: "John Doe", amount: 1 },
//       ],
//     },
//   ];

//   const atomtabs = [
//     {
//       label: "Profile",
//       icon: <PersonOutlineTwoTone sx={{ fontSize: "1.3rem" }} />,
//       content: "Profile content goes here.",
//     },
//     {
//       label: "Followers",
//       icon: <RecentActorsTwoTone sx={{ fontSize: "1.3rem" }} />,
//       content: "Followers list...",
//     },
//     {
//       label: "Friends",
//       icon: <PeopleAltTwoTone sx={{ fontSize: "1.3rem" }} />,
//       chipLabel: "01",
//       content: "Friends content...",
//     },
//     {
//       label: "Gallery",
//       icon: <PanoramaTwoTone sx={{ fontSize: "1.3rem" }} />,
//       content: "Gallery content here.",
//     },
//   ];

//   const verticaltabs = [
//     {
//       label: "User Profile",
//       subLabel: "Profile Settings",
//       icon: <PersonOutlineTwoTone />,
//       content: (
//         <Stack spacing={2}>
//           <Typography>Profile settings content</Typography>
//         </Stack>
//       ),
//     },
//     {
//       label: "Billing",
//       subLabel: "Billing Information",
//       icon: <DescriptionTwoTone />,
//       content: <Typography>Billing info content</Typography>,
//     },
//     {
//       label: "Payment",
//       subLabel: "Add & Update Card",
//       icon: <CreditCardTwoTone />,
//       content: <Typography>Payment content</Typography>,
//     },
//     {
//       label: "Change Password",
//       subLabel: "Update Profile Security",
//       icon: <VpnKeyTwoTone />,
//       content: <Typography>Password change content</Typography>,
//     },
//   ];

//   const [value, setValue] = useState(30);

//   return (
//     <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
//       <StyleGuideSidebar />
//       <Card
//         sx={{
//           flexGrow: 1,
//           m: { xs: 1, md: 2 },
//           pb: { xs: 2, md: 4 },
//           border: "none",
//           boxShadow: "none",
//           mt: { xs: 7, md: 0 },
//         }}
//       >
//         <Box
//           sx={{
//             m: { xs: 1, md: 2 },
//             width: "100%",
//             maxWidth: "80vw",
//             mx: "auto",
//           }}
//         >
//           <Typography variant="h4" color="primary">
//             Style Guide
//             <Typography variant="body1" color="text.secondary">
//               Design system and component library for BSuite
//             </Typography>
//           </Typography>
//         </Box>

//         <CardContent>
//           {/* === Foundation === */}
//           <Card
//             sx={{
//               display: "flex",
//               flexDirection: "column",
//               gap: 2,
//               p: { xs: 2, md: 5 },
//             }}
//           >
//             <Typography variant="h5">Foundation</Typography>
//             <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//               The foundational design layer that defines the visual language —
//               including color palette and typography.
//             </Typography>
//             {/* === Colors === */}
//             <Typography variant="h6" sx={{ mt: 2 }} id="colors">
//               Colors
//             </Typography>
//             <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//               The primary brand and accent colors used throughout the
//               application to create visual hierarchy and emphasis.
//             </Typography>
//             <Box
//               sx={{
//                 display: "flex",
//                 gap: 2,
//                 flexWrap: "wrap",
//                 alignItems: "flex-start",
//               }}
//             >
//               {colorGroups.map((group) => (
//                 <Card sx={{ p: 3 }} key={group.name}>
//                   <Card
//                     sx={{
//                       width: 120,
//                       height: 70,
//                       bgcolor: group.value,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       borderRadius: 2,
//                       boxShadow: 1,
//                     }}
//                   ></Card>
//                   <Typography
//                     variant="body1"
//                     textAlign={"center"}
//                     sx={{ mt: 1 }}
//                   >
//                     {group.name}
//                   </Typography>
//                 </Card>
//               ))}
//             </Box>

//             {/* === Gray Scale === */}
//             <Typography variant="h6" sx={{ mt: 3 }}>
//               Gray Scale
//             </Typography>
//             <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//               Neutral shades ranging from light to dark — used for surfaces,
//               borders, backgrounds, and text contrast.
//             </Typography>
//             <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
//               {Object.entries(grey)
//                 .filter(([key]) => Number(key) >= 100 && Number(key) <= 900)
//                 .map(([shade, hex]) => (
//                   <Card
//                     key={shade}
//                     sx={{
//                       width: 70,
//                       height: 70,
//                       bgcolor: hex,
//                       display: "flex",
//                       flexDirection: "column",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       color: Number(shade) < 600 ? "#000" : "#fff",
//                       borderRadius: 2,
//                       boxShadow: 1,
//                     }}
//                   >
//                     <Typography variant="body2" fontWeight={600}>
//                       {shade}
//                     </Typography>
//                     <Typography
//                       variant="caption"
//                       sx={{
//                         color: Number(shade) < 600 ? "#000" : "#fff",
//                       }}
//                     >
//                       {hex}
//                     </Typography>
//                   </Card>
//                 ))}
//             </Box>
//           </Card>

//           {/* === Typography === */}
//           <Card sx={{ mt: 3, p: { xs: 2, md: 5 } }} id="typography">
//             <Typography variant="h5" sx={{ mb: 2 }}>
//               Typography
//             </Typography>
//             <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//               Defines the hierarchy, readability, and personality of text
//               through consistent font styles and sizes.
//             </Typography>
//             <Stack spacing={4} sx={{ mt: 3 }}>
//               {variants.map((variant) => {
//                 const style = theme.typography[variant] as any;
//                 const responsiveSizes = getResponsiveSizes(style);

//                 return (
//                   <Card key={variant} sx={{ p: 3 }}>
//                     <Typography variant="h6" color="text.secondary">
//                       {variant}
//                     </Typography>
//                     <Stack
//                       direction={{ xs: "column", sm: "row" }}
//                       justifyContent={"space-between"}
//                       alignItems={{ xs: "flex-start", sm: "center" }}
//                       spacing={2}
//                     >
//                       <Typography variant={variant as any} sx={{ px: 2 }}>
//                         This is sample text
//                       </Typography>

//                       <Box
//                         sx={{
//                           px: 2,
//                           mt: 1,
//                           bgcolor: "grey.200",
//                           p: 2,
//                           borderRadius: 2,
//                         }}
//                       >
//                         <Typography variant="body2" color="text.secondary">
//                           fontSize: {style.fontSize}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                           fontWeight: {style.fontWeight}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                           lineHeight: {style.lineHeight}
//                         </Typography>

//                         {Object.keys(responsiveSizes).length > 0 && (
//                           <Box sx={{ mt: 1 }}>
//                             <Typography variant="body2" color="text.secondary">
//                               Responsive Sizes:
//                             </Typography>
//                             {Object.entries(responsiveSizes).map(
//                               ([bp, val]) => (
//                                 <Typography
//                                   key={bp}
//                                   variant="body2"
//                                   color="text.secondary"
//                                   sx={{ pl: 2 }}
//                                 >
//                                   {bp}: {val}
//                                 </Typography>
//                               ),
//                             )}
//                           </Box>
//                         )}
//                       </Box>
//                     </Stack>
//                   </Card>
//                 );
//               })}
//             </Stack>
//           </Card>

//           {/* === Text Colors === */}
//           <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2 }} id="text-colors">
//             <Box>
//               <Typography variant="h5">Text Colors</Typography>
//               <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//                 Demonstrates the use of color in typography for various states,
//                 themes, and semantic meanings.
//               </Typography>
//             </Box>
//             <Card>
//               <Stack sx={{ mt: 2, p: 2 }} direction="column" spacing={1}>
//                 {textColors.map(({ name, color }) => (
//                   <Typography key={name} variant="body1" color={color}>
//                     {name}
//                   </Typography>
//                 ))}
//               </Stack>
//               <ShowCodeAccordion
//                 code={`
//                     // Default text
//                     <Typography variant="body1" color="text.primary">
//                         Default Text
//                     </Typography>

//                     // Default Secondary text
//                     <Typography variant="body1" color="text.secondary">
//                         Default Secondary Text
//                     </Typography>

//                     // Primary color
//                     <Typography variant="body1" color="primary.main">
//                         Colored Primary Text
//                     </Typography>

//                     // Secondary color
//                     <Typography variant="body1" color="secondary.main">
//                         Colored Secondary Text
//                     </Typography>

//                     // Success color
//                     <Typography variant="body1" color="success.main">
//                         Success Text
//                     </Typography>

//                     // Error color
//                     <Typography variant="body1" color="error">
//                         Error Text
//                     </Typography>

//                     // Info color
//                     <Typography variant="body1" color="info.main">
//                         Info Text
//                     </Typography>

//                     // Warning color
//                     <Typography variant="body1" color="warning.main">
//                         Warning Text
//                     </Typography>

//                   `}
//               />
//             </Card>
//           </Card>

//           {/* === Components === */}
//           <Card sx={{ mt: 3, p: { xs: 2, md: 5 } }}>
//             <Typography variant="h5">Components</Typography>
//             {/* === Buttons === */}
//             <Box id="buttons">
//               <Box>
//                 <Typography variant="h6" sx={{ mt: 2 }}>
//                   Buttons
//                 </Typography>
//                 <Typography
//                   variant="body2"
//                   sx={{ mb: 2 }}
//                   color="text.secondary"
//                 >
//                   Buttons trigger actions and represent key user interactions
//                   across the application.
//                 </Typography>
//                 {/* === Primary Buttons === */}
//                 <Card>
//                   <Typography variant="h6" sx={{ px: 2, pt: 2 }}>
//                     Primary Buttons
//                   </Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ px: 2 }}
//                     color="text.secondary"
//                   >
//                     Used for main actions like saving or submitting forms —
//                     typically represent the primary call to action.
//                   </Typography>
//                   {/* Primary Buttons */}
//                   <Stack
//                     sx={{
//                       p: 2,
//                       pe: 0,
//                       width: { xs: "fit-content", md: "auto" },
//                     }}
//                     direction={{ xs: "column", sm: "row" }}
//                     spacing={2}
//                   >
//                     <PrimaryButton>Save</PrimaryButton>
//                     <PrimaryButton>Loading...</PrimaryButton>
//                     <PrimaryButton disabled>Save</PrimaryButton>
//                   </Stack>
//                   <ShowCodeAccordion
//                     code={`
//                           import { PrimaryButton } from "../components/atom/button/Button";

//                           <PrimaryButton>Save</PrimaryButton>

//                           // Loading state
//                           <PrimaryButton>Loading...</PrimaryButton>

//                           // Disabled State
//                           <PrimaryButton disabled>Save</PrimaryButton>

//                         `}
//                   />
//                 </Card>
//               </Box>
//               {/* === Secondary Buttons === */}
//               <Box sx={{ mt: 3 }}>
//                 <Card>
//                   <Typography variant="h6" sx={{ px: 2, pt: 2 }}>
//                     Secondary Buttons
//                   </Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ px: 2 }}
//                     color="text.secondary"
//                   >
//                     Used for supporting actions that complement the primary
//                     action without drawing excessive attention.
//                   </Typography>
//                   {/* Secondary Buttons */}
//                   <Stack
//                     sx={{
//                       p: 2,
//                       pe: 0,
//                       width: { xs: "fit-content", md: "auto" },
//                     }}
//                     direction={{ xs: "column", sm: "row" }}
//                     spacing={2}
//                   >
//                     <SecondaryButton>Save</SecondaryButton>
//                     <SecondaryButton>Loading...</SecondaryButton>
//                     <SecondaryButton disabled>Save</SecondaryButton>
//                   </Stack>
//                   <ShowCodeAccordion
//                     code={`
//                           import { SecondaryButton } from "../components/atom/button/Button";

//                           <SecondaryButton >Save</SecondaryButton>

//                           // Loading state
//                           <SecondaryButton>Loading...</SecondaryButton>

//                           // Disabled State
//                           <SecondaryButton disabled>Save</SecondaryButton>

//                         `}
//                   />
//                 </Card>
//               </Box>
//             </Box>

//             {/* === Labels === */}
//             <Box id="labels" sx={{ mt: 3 }}>
//               <Typography variant="h6" sx={{ mb: 2 }}>
//                 Labels
//               </Typography>
//               <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//                 Labels are small, color-coded indicators used to represent
//                 statuses, categories, or metadata.
//               </Typography>
//               <Card>
//                 <Box sx={{ p: 2 }}>
//                   <Typography variant="h6">Soft</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Soft variant with subtle background colors — ideal for
//                     neutral contexts or low-contrast designs.
//                   </Typography>
//                   <Stack
//                     direction={{ xs: "column", sm: "column", md: "row" }}
//                     sx={{ m: 2, width: { xs: "fit-content", md: "auto" } }}
//                     gap={3}
//                     flexWrap="wrap"
//                   >
//                     <Label label="Primary" color="primary" />
//                     <Label label="Secondary" color="secondary" />
//                     <Label label="Success" color="success" />
//                     <Label label="Info" color="info" />
//                     <Label label="Error" color="error" />
//                     <Label label="Warning" color="warning" />
//                   </Stack>
//                 </Box>
//                 <Box sx={{ p: 2 }}>
//                   <Typography variant="h6">With Icons</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Combines visual icons with text to convey meaning more
//                     clearly — commonly used for status badges.
//                   </Typography>
//                   <Stack
//                     direction={{ xs: "column", sm: "row" }}
//                     sx={{ m: 2, width: { xs: "fit-content", md: "auto" } }}
//                     gap={3}
//                     flexWrap="wrap"
//                   >
//                     <Label
//                       size="medium"
//                       label="Success"
//                       color="success"
//                       icon={<CheckIcon fontSize="small" />}
//                     />
//                     <Label
//                       size="medium"
//                       label="Info"
//                       color="info"
//                       icon={<InfoIcon fontSize="small" />}
//                     />
//                     <Label
//                       size="medium"
//                       label="Error"
//                       color="error"
//                       icon={<ErrorIcon fontSize="small" />}
//                     />
//                     <Label
//                       size="medium"
//                       label="Warning"
//                       color="warning"
//                       icon={<WarningIcon fontSize="small" />}
//                     />
//                   </Stack>
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`
//                       import { Label } from "../components/atom/Label";

//                       // Soft label
//                       <Label label="Primary" color="primary" />

//                       // Soft Secondary label
//                       <Label label="Secondary" color="secondary" />

//                       // Label with Icon
//                       <Label label="Error" size="medium" color="error" icon={<ErrorIcon fontSize="small" />}/>

//                       // Label with Icon
//                       <Label label="Warning" size="medium" color="warning" icon={<WarningIcon fontSize="small" />}/>

//                     `}
//                 />
//               </Card>
//             </Box>

//             {/* === Chips === */}
//             <Box id="chips" sx={{ mt: 3 }}>
//               <Typography variant="h6" sx={{ mb: 2 }}>
//                 Chips
//               </Typography>
//               <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//                 Small visual elements used to represent tags, filters, or user
//                 actions.
//               </Typography>
//               <Card>
//                 <Box sx={{ p: 2 }}>
//                   <Typography variant="h6">Soft</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Soft variant with subtle background colors — ideal for
//                     neutral contexts or low-contrast designs.
//                   </Typography>
//                   <Stack
//                     direction={{ xs: "column", sm: "row" }}
//                     sx={{ m: 2, width: { xs: "fit-content", md: "auto" } }}
//                     gap={3}
//                     flexWrap="wrap"
//                   >
//                     <Chip label="Primary" color="primary" />
//                     <Chip label="Secondary" color="secondary" />
//                     <Chip label="Success" color="success" />
//                     <Chip label="Info" color="info" />
//                     <Chip label="Error" color="error" />
//                     <Chip label="Warning" color="warning" />
//                   </Stack>
//                 </Box>
//                 <Box sx={{ p: 2 }}>
//                   <Typography variant="h6">Interactive</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Combines icons with text to communicate meaning more clearly
//                     — often used for status or interactive badges.
//                   </Typography>
//                   <Stack
//                     direction={{ xs: "column", sm: "row" }}
//                     sx={{ m: 2, width: { xs: "fit-content", md: "auto" } }}
//                     gap={3}
//                     flexWrap="wrap"
//                   >
//                     <Chip
//                       label="Filter"
//                       onClick={handleClick}
//                       color="primary"
//                     />
//                     <Chip
//                       label="Remove"
//                       onDelete={handleDelete}
//                       color="error"
//                     />
//                     <Chip
//                       label="Star"
//                       size="medium"
//                       icon={<StarIcon fontSize="small" />}
//                       color="warning"
//                     />
//                     <ChipDualIcon
//                       label="John Doe"
//                       size="medium"
//                       color="primary"
//                       startIcon={
//                         <Avatar
//                           sx={{
//                             width: 20,
//                             height: 20,
//                             fontSize: 12,
//                             bgcolor: theme.palette.primary.main,
//                             color: "white",
//                           }}
//                           alt="John Doe"
//                         >
//                           JD
//                         </Avatar>
//                       }
//                       endIcon={
//                         <CloseIcon
//                           fontSize="small"
//                           onClick={handleDelete}
//                           sx={{
//                             cursor: "pointer",
//                             "&:hover": { color: "error.main" },
//                           }}
//                         />
//                       }
//                     />
//                   </Stack>
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`
//                       import { Chip, ChipDualIcon } from "../components/atom/chips";

//                       // Soft label
//                       <Chip label="Primary" color="primary" />

//                       // Soft Secondary label
//                       <Chip label="Secondary" color="secondary" />

//                       // Clickable
//                       <Chip label="Filter" onClick={handleClick} color="primary" />
//                       // Delete
//                       <Chip label="Remove" onDelete={handleDelete} color="error" />

//                       // With Icon
//                       <Chip
//                           label="Star" 
//                           icon={<StarIcon fontSize="small" />} 
//                           color="warning" 
//                       />

//                       // Dual Icon Chip
//                       <ChipDualIcon
//                         label="John Doe"
//                         size="medium"
//                         color="primary"
//                         startIcon={
//                           <Avatar
//                             sx={{ width: 20, height: 20, fontSize: 12, bgcolor:'white', color:theme.palette.primary.main }}
//                             alt="John Doe"
//                           >
//                             JD
//                           </Avatar>
//                         }
//                         endIcon={
//                           <CloseIcon
//                             fontSize="small"
//                             onClick={handleDelete}
//                             sx={{
//                               cursor: "pointer",
//                               "&:hover": { color: "error.main" },
//                             }}
//                           />
//                         }
//                       />

//                     `}
//                 />
//               </Card>
//             </Box>

//             {/* Toasts */}
//             <Box id="snackbars" sx={{ mt: 3 }}>
//               <Typography variant="h6" sx={{ mb: 2 }}>
//                 Snackbars(Toasts)
//               </Typography>
//               <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//                 Brief notifications displayed at the top right of the screen to
//                 indicate system messages, actions, or alerts.
//               </Typography>
//               <Card>
//                 <Box sx={{ p: 2 }}>
//                   <Stack direction={"column"} gap={3}>
//                     <Snackbar
//                       message="Success notification"
//                       color="success"
//                       onClose={handleToastClose}
//                       positionFixed={false}
//                     />
//                     <Snackbar
//                       message="Info notification"
//                       color="info"
//                       onClose={handleToastClose}
//                       positionFixed={false}
//                     />
//                     <Snackbar
//                       message="Error notification"
//                       color="error"
//                       positionFixed={false}
//                       onClose={handleToastClose}
//                     />
//                     <Snackbar
//                       message="Warning notification"
//                       color="warning"
//                       positionFixed={false}
//                       onClose={handleToastClose}
//                     />
//                   </Stack>
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`
//                       import { Snackbar } from "../components/atom/Snackbar";

//                       // Success Snackbar 
//                       <Snackbar message="Success notification" color="success" onClose={handleToastClose} />
                      
//                       // Info Snackbar 
//                       <Snackbar message="Info notification" color="info" onClose={handleToastClose} />

//                       // Error Snackbar
//                       <Snackbar message="Error notification" color="error" onClose={handleToastClose}  />

//                       // Warning Snackbar
//                       <Snackbar message="Warning notification" color="warning" onClose={handleToastClose}  />
//                     `}
//                 />
//               </Card>
//             </Box>
//           </Card>

//           {/* Form Elements */}
//           <Card sx={{ mt: 3, p: { xs: 2, md: 5 } }}>
//             <Box sx={{ mt: 3 }}>
//               <Typography variant="h6" sx={{ mb: 2 }}>
//                 Form Elements
//               </Typography>
//               <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//                 Input components that help capture user data in a consistent and
//                 accessible way.
//               </Typography>
//               {/* Text Inputs */}
//               <Card id="text-inputs">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6">Text Inputs</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Basic input fields used to collect short pieces of text such
//                     as names or titles.
//                   </Typography>
//                   <Stack spacing={3}>
//                     <TextFieldElement
//                       label="Standard Field"
//                       placeholder="Your Name"
//                     />
//                     <TextFieldElement label="Required Field" required />
//                     <TextFieldElement
//                       label="Error Field"
//                       error
//                       helperText="This field is required."
//                     />
//                   </Stack>
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`
//                       import { TextFieldElement } from "../components/atom/TextField";

//                       // Standard Text Input
//                       <TextFieldElement label="Standard Field" placeholder="Your Name"/>

//                       // Required Text Input
//                       <TextFieldElement label="Required Field" required />

//                       // Error Input
//                       <TextFieldElement label="Error Field" error helperText="This field is required." />
//                     `}
//                 />
//               </Card>

//               {/* TextArea */}
//               <Card sx={{ mt: 3 }} id="text-area">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6">Text Area</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Multiline input field for longer text entries like notes,
//                     comments, or descriptions.
//                   </Typography>
//                   <TextAreaField
//                     label="Description"
//                     value={description}
//                     onChange={setDescription}
//                     required
//                     helperText="Enter a short note about the item"
//                   />
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`
//                         import { TextAreaField } from "../components/atom/TextAreaField";

//                       <TextAreaField
//                         label="Description"
//                         value={description}
//                         onChange={setDescription}
//                         required
//                         helperText="Enter a short note about the item"
//                       />
//                     `}
//                 />
//               </Card>

//               {/* Selection Controls */}
//               <Card sx={{ mt: 3 }} id="selection-controls">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6">Selection Controls</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Selection controls allow users to make choices, toggle
//                     settings, or indicate preferences. They include checkboxes
//                     for multiple selections, radio buttons for single
//                     selections, and switches for quick on/off actions.
//                   </Typography>
//                   <Typography variant="body1">Checkboxes</Typography>
//                   <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
//                     <Checkbox
//                       label="Accept Terms"
//                       checked={checked}
//                       onChange={(e) => setChecked(e.target.checked)}
//                     />
//                     <Checkbox label="Disabled" disabled />
//                   </Stack>
//                   <Typography variant="body1">Radio Buttons</Typography>
//                   <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
//                     <RadioButton
//                       label="Option 1"
//                       checked={selected === "option1"}
//                       onChange={(e) => setSelected(e.target.value)}
//                       value="option1"
//                       name="options"
//                     />
//                     <RadioButton
//                       label="Option 2"
//                       checked={selected === "option2"}
//                       onChange={(e) => setSelected(e.target.value)}
//                       value="option2"
//                       name="options"
//                     />
//                   </Stack>
//                   <Typography variant="body1">Toggle Switch</Typography>
//                   <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
//                     <ToggleSwitch
//                       label={enabled ? "Enabled" : "Disabled"}
//                       checked={enabled}
//                       onChange={(e) => setEnabled(e.target.checked)}
//                     />
//                   </Stack>
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`
//                         import { Checkbox } from "../components/atom/Checkbox";
//                         import { RadioButton } from "../components/atom/RadioButton";
//                         import { ToggleSwitch } from "../components/atom/ToggleSwitch";

//                         const [checked, setChecked] = useState(false);
//                         const [selected, setSelected] = useState("option1");
//                         const [enabled, setEnabled] = useState(true);

//                         <Checkbox label="Accept Terms" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
//                         <Checkbox label="Disabled" disabled />
//                         <ToggleSwitch
//                           label={enabled ? "Enabled" : "Disabled"}
//                           checked={enabled}
//                           onChange={(e) => setEnabled(e.target.checked)}
//                         />
//                         <RadioButton
//                           label="Option 1"
//                           checked={selected === "option1"}
//                           onChange={(e) => setSelected(e.target.value)}
//                           value="option1"
//                           name="options"
//                         />
//                         <RadioButton
//                           label="Option 2"
//                           checked={selected === "option2"}
//                           onChange={(e) => setSelected(e.target.value)}
//                           value="option2"
//                           name="options"
//                         />

//                         // Indeterminate checkboxes
//                         <Box>
//                           <Checkbox
//                             label="Select all"
//                             checked={isChecked}
//                             indeterminate={isIndeterminate}
//                             onChange={handleParentChange}
//                             onClick={handleParentClick}
//                           />
//                           <Box style={{ marginLeft: 24 }}>
//                             {DATA.map((label, idx) => (
//                               <Checkbox
//                                 key={label}
//                                 label={label}
//                                 checked={checked[idx]}
//                                 onChange={handleChildChange(idx)}
//                               />
//                             ))}
//                           </Box>
//                         </Box>
//                     `}
//                 />
//               </Card>

//               {/* Select Inputs */}
//               <Card sx={{ mt: 3 }} id="select-inputs">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6" sx={{ mb: 2 }}>
//                     Select Inputs
//                   </Typography>
//                   {/* Single Select Inputs */}
//                   <Card>
//                     <Box sx={{ p: 3 }}>
//                       <Typography variant="h6">Single Select</Typography>
//                       <Typography
//                         variant="body2"
//                         sx={{ mb: 2 }}
//                         color="text.secondary"
//                       >
//                         Dropdown input that allows users to select a single
//                         option from a predefined list.
//                       </Typography>
//                       <Stack spacing={3} sx={{ mt: 3 }}>
//                         <SingleSelectElement
//                           label="Role"
//                           options={options}
//                           value={role}
//                           onChange={setRole}
//                         />

//                         <SingleSelectElement
//                           label="Required Select"
//                           options={options}
//                           value={role}
//                           onChange={setRole}
//                           required
//                         />

//                         <SingleSelectElement
//                           label="Error Select"
//                           options={options}
//                           value={role}
//                           onChange={setRole}
//                           error
//                           helperText="Please choose a valid option."
//                         />
//                       </Stack>
//                     </Box>
//                     <ShowCodeAccordion
//                       code={`
//                           import { SingleSelectElement } from "../components/atom/SelectField/SingleSelect";

//                           // Normal Single Select
//                           <SingleSelectElement
//                               label="Role"
//                               options={options}
//                               value={role}
//                               onChange={setRole}
//                           />

//                           // Required Single Select
//                           <SingleSelectElement
//                               label="Required Select"
//                               options={options}
//                               value={role}
//                               onChange={setRole}
//                               required
//                           />

//                           // Error Single Select
//                           <SingleSelectElement
//                               label="Error Select"
//                               options={options}
//                               value={role}
//                               onChange={setRole}
//                               error
//                               helperText="Please choose a valid option."
//                           />
//                         `}
//                     />
//                   </Card>
//                   {/* Multi Select Inputs */}
//                   <Card sx={{ mt: 3 }}>
//                     <Box sx={{ p: 3 }}>
//                       <Typography variant="h6">Multi Select</Typography>
//                       <Typography
//                         variant="body2"
//                         sx={{ mb: 2 }}
//                         color="text.secondary"
//                       >
//                         Dropdown input that allows users to select multiple
//                         options at once from a predefined list.
//                       </Typography>
//                       <Stack spacing={3} sx={{ mt: 3 }}>
//                         <Stack spacing={3}>
//                           {/* Normal Multi Select */}
//                           <MultiSelectElement
//                             label="Skills"
//                             options={skillOptions}
//                             value={skills}
//                             onChange={setSkills}
//                           />

//                           <MultiSelectElement
//                             label="Skills (Required)"
//                             options={skillOptions}
//                             value={skills}
//                             onChange={setSkills}
//                             required
//                           />

//                           <MultiSelectElement
//                             label="Skills (Error)"
//                             options={skillOptions}
//                             value={skills}
//                             onChange={setSkills}
//                             error
//                             helperText="Please select at least one skill."
//                           />
//                         </Stack>
//                       </Stack>
//                     </Box>
//                     <ShowCodeAccordion
//                       code={`
//                           import { MultiSelectElement } from "../components/atom/SelectField/MultiSelect";

//                           // Normal Multi Select
//                           <MultiSelectElement
//                               label="Skills"
//                               options={skillOptions}
//                               value={skills}
//                               onChange={setSkills}
//                           />

//                           // Required Multi Select 
//                           <MultiSelectElement
//                               label="Skills (Required)"
//                               options={skillOptions}
//                               value={skills}
//                               onChange={setSkills}
//                               required
//                           />

//                           // Error Multi Select 
//                           <MultiSelectElement
//                               label="Skills (Error)"
//                               options={skillOptions}
//                               value={skills}
//                               onChange={setSkills}
//                               error
//                               helperText="Please select at least one skill."
//                           />
//                         `}
//                     />
//                   </Card>
//                 </Box>
//               </Card>

//               {/* Date Inputs */}
//               <Card sx={{ mt: 3 }} id="date-input">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6">Date Input</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Input field for selecting specific dates, typically used for
//                     scheduling or form submissions.
//                   </Typography>
//                   <Card>
//                     <Box sx={{ p: 3 }}>
//                       <Stack direction={"column"} gap={3}>
//                         <DatePickerElement
//                           label="Date of Birth"
//                           value={date}
//                           onChange={setDate}
//                           required
//                           error={!date}
//                           helperText={!date ? "This field is required" : ""}
//                         />
//                       </Stack>
//                     </Box>
//                     <ShowCodeAccordion
//                       code={`
//                                 import { DatePickerElement } from "../components/atom/DatePicker";

//                                 <DatePickerElement
//                                   label="Date of Birth"
//                                   value={date}
//                                   onChange={setDate}
//                                   required
//                                   error={!date}
//                                   helperText={!date ? "This field is required" : ""}
//                                 />
//                             `}
//                     />
//                   </Card>
//                 </Box>
//               </Card>

//               {/* Month Picker */}
//               <Card sx={{ mt: 3 }} id="month-picker">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6">Month Picker</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Input for selecting a specific month within a year.
//                   </Typography>
//                   <Card>
//                     <Box sx={{ p: 3 }}>
//                       <Stack direction={"column"} gap={3}>
//                         <MonthPickerElement
//                           label="Select Month"
//                           value={date}
//                           format="MMMM"
//                           onChange={setDate}
//                         />
//                       </Stack>
//                     </Box>
//                     <ShowCodeAccordion
//                       code={`
//                             import { MonthPickerElement } from "../components/atom/date-picker";

//                             <MonthPickerElement
//                               label="Select Month"
//                               value={date}
//                               format="MMMM"
//                               onChange={setDate}
//                             />
//                         `}
//                     />
//                   </Card>
//                 </Box>
//               </Card>

//               {/* Year Picker */}
//               <Card sx={{ mt: 3 }} id="year-picker">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6">Year Picker</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Input for selecting a specific year.
//                   </Typography>
//                   <Card>
//                     <Box sx={{ p: 3 }}>
//                       <Stack direction={"column"} gap={3}>
//                         <YearPickerElement
//                           label="Select Year"
//                           value={date}
//                           onChange={setDate}
//                         />
//                       </Stack>
//                     </Box>
//                     <ShowCodeAccordion
//                       code={`
//                             import { YearPickerElement } from "../components/atom/date-picker";

//                             <YearPickerElement
//                               label="Select Year"
//                               value={date}
//                               onChange={setDate}
//                             />
//                         `}
//                     />
//                   </Card>
//                 </Box>
//               </Card>

//               {/* Month-Year Picker */}
//               <Card sx={{ mt: 3 }} id="month-year-picker">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6">Month-Year Picker</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Input for selecting both a month and a year.
//                   </Typography>
//                   <Card>
//                     <Box sx={{ p: 3 }}>
//                       <Stack direction={"column"} gap={3}>
//                         <MonthYearPickerElement
//                           label="Select Month & Year"
//                           value={date}
//                           onChange={setDate}
//                         />
//                       </Stack>
//                     </Box>
//                     <ShowCodeAccordion
//                       code={`
//                             import { MonthYearPickerElement } from "../components/atom/date-picker";

//                             <MonthYearPickerElement
//                               label="Select Month & Year"
//                               value={date}
//                               onChange={setDate}
//                             />
//                         `}
//                     />
//                   </Card>
//                 </Box>
//               </Card>

//               {/* Date range picker */}
//               <Card sx={{ mt: 3 }} id="date-range-picker">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6">Date Range Picker</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Input field for selecting a date range, supporting
//                     multi-month views and min/max date constraints.
//                   </Typography>
//                   <Card>
//                     <Box sx={{ p: 3 }}>
//                       <Stack direction={"column"} gap={3}>
//                         <DateRangePicker
//                           label="Select Duration"
//                           startValue={startDate}
//                           endValue={endDate}
//                           onChange={setDateRange}
//                           min={dayjs()}
//                           max={dayjs().add(1, "year")}
//                           months={2}
//                           required
//                         />
//                       </Stack>
//                     </Box>
//                     <ShowCodeAccordion
//                       code={`
//                             import { DateRangePicker } from "../components/atom/custom-date-range-picker/DateRangePicker";
//                             import dayjs from "dayjs";

//                             <DateRangePicker
//                               label="Select Duration"
//                               startValue={startDate} 
//                               endValue={endDate} 
//                               onChange={setDateRange}
//                               min={dayjs()}
//                               max={dayjs().add(1, 'year')}
//                               months={2}
//                               required
//                             />
//                         `}
//                     />
//                   </Card>
//                 </Box>
//               </Card>

//               {/* Time Inputs */}
//               <Card sx={{ mt: 3 }} id="time-input">
//                 <Box>
//                   <Box sx={{ px: 4, pt: 3 }}>
//                     <Typography variant="h6">Time Input</Typography>
//                     <Typography
//                       variant="body2"
//                       sx={{ mb: 2 }}
//                       color="text.secondary"
//                     >
//                       Input field used to choose a specific time value, often
//                       paired with date inputs.
//                     </Typography>
//                   </Box>

//                   <Box>
//                     <Box sx={{ width: 300, p: 4 }}>
//                       <TimePickerElement
//                         label="Start Time"
//                         value={time}
//                         onChange={setTime}
//                         required
//                       />
//                     </Box>
//                     <ShowCodeAccordion
//                       code={`
//                                 import { TimePickerElement } from "../components/atom/TimePicker";

//                                 <TimePickerElement
//                                   label="Start Time"
//                                   value={time}
//                                   onChange={setTime}
//                                   required
//                                 />
//                             `}
//                     />
//                   </Box>
//                 </Box>
//               </Card>

//               {/* File Upload */}
//               <Card sx={{ mt: 3 }} id="file-upload">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6">File Upload</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Component for selecting and uploading files from a user’s
//                     device.
//                   </Typography>
//                   <FileUploadField
//                     accept="*"
//                     label="Upload Offer Letter"
//                     value={image as unknown as File | null} // ✅ cast for TS compatibility
//                     onChange={(file) => setImage(file as File[] | null)} // ✅ cast incoming value
//                     required
//                     multiple
//                   />
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`
//                         import { FileUploadField } from "../components/atom/FileUploadField";

//                         <FileUploadField
//                           label="Upload Image"
//                           value={image}
//                           onChange={setImage}
//                           required
//                         />
//                     `}
//                 />
//               </Card>

//               {/* Color Picker */}
//               <Card sx={{ mt: 3 }} id="color-picker">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6">Color Picker</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Allows users to select a color value through an interactive
//                     picker interface.
//                   </Typography>
//                   <ColorPickerField
//                     label="Pick a Color"
//                     value={color}
//                     onChange={setColor}
//                   />
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`
//                         import { ColorPickerField } from "../components/atom/ColorPickerField";

//                         <ColorPickerField
//                           label="Pick a Color"
//                           value={color}
//                           onChange={setColor}
//                         />
//                     `}
//                 />
//               </Card>

//               {/* Repeater Inputs */}
//               <Card sx={{ mt: 3 }} id="repeater-input">
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6">Repeater Input</Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Enables users to dynamically add or remove repeated sets of
//                     form fields, ideal for multiple entries.
//                   </Typography>
//                   <Card>
//                     <Stack gap={3} sx={{ p: 3 }}>
//                       <RepeaterElement<{ file: File | null }>
//                         label="Upload Files"
//                         items={_files}
//                         setItems={setFiles}
//                         initialItem={{ file: null }}
//                         renderItem={(item, index, onChange) => (
//                           <Stack
//                             direction={{ xs: "column", md: "row" }}
//                             spacing={2}
//                             alignItems={{ xs: "stretch", md: "center" }}
//                             flexWrap="wrap"
//                             sx={{ width: "100%" }}
//                           >
//                             <FileUploadField
//                               accept="*"
//                               label={`File ${index + 1}`}
//                               value={item.file}
//                               onChange={(file) => onChange("file", file)}
//                               required
//                             />
//                           </Stack>
//                         )}
//                       />
//                       <RepeaterElement
//                         label="Horizontal Repeater"
//                         items={users}
//                         setItems={setUsers}
//                         gap={2}
//                         initialItem={{
//                           firstName: "",
//                           lastName: "",
//                           email: "",
//                           role: "",
//                         }}
//                         renderItem={(item, index, onChange) => (
//                           <>
//                             <TextFieldElement
//                               label="First Name"
//                               required={index === 0}
//                               value={item.firstName}
//                               onChange={(e) =>
//                                 onChange("firstName", e.target.value)
//                               }
//                             />
//                             <TextFieldElement
//                               label="Last Name"
//                               value={item.lastName}
//                               onChange={(e) =>
//                                 onChange("lastName", e.target.value)
//                               }
//                             />
//                             <TextFieldElement
//                               label="Email"
//                               value={item.email}
//                               onChange={(e) =>
//                                 onChange("email", e.target.value)
//                               }
//                             />
//                           </>
//                         )}
//                       />
//                     </Stack>
//                     <ShowCodeAccordion
//                       code={`
//                               import { RepeaterElement } from "../components/atom/FormRepeater";

//                               // Image Repeater
//                               <RepeaterElement<{ file: File | null }>
//                                 label="Upload Files"
//                                 initialItem={{ file: null }}
//                                 onChange={setFiles}
//                                 renderItem={(item, index, onChange) => (
//                                   <Stack
//                                     direction="row"
//                                     spacing={2}
//                                     alignItems="center"
//                                     flexWrap="wrap"
//                                   >
//                                     <FileUploadField
//                                       label={"File {index + 1}"}
//                                       value={item.file}
//                                       onChange={(file) => onChange("file", file)}
//                                       required
//                                     />
//                                   </Stack>
//                                 )}
//                               />

//                               // Horizontal Repeater
//                               <RepeaterElement
//                                 label="Horizontal Repeater"
//                                 direction="horizontal"
//                                 gap={2}
//                                 initialItem={{ firstName: "", lastName: "", email: "", role: "" }}
//                                 renderItem={(item, index, onChange) => (
//                                   <>
//                                     <TextFieldElement
//                                       label="First Name"
//                                       required={index === 0}
//                                       value={item.firstName}
//                                       onChange={(e) => onChange("firstName", e.target.value)}
//                                     />
//                                     <TextFieldElement
//                                       label="Last Name"
//                                       value={item.lastName}
//                                       onChange={(e) => onChange("lastName", e.target.value)}
//                                     />
//                                     <TextFieldElement
//                                       label="Email"
//                                       value={item.email}
//                                       onChange={(e) => onChange("email", e.target.value)}
//                                     />
//                                   </>
//                                 )}
//                               />
//                         `}
//                     />
//                   </Card>
//                 </Box>
//               </Card>
//             </Box>
//           </Card>

//           {/* Dialogs */}
//           <Box id="dialogs">
//             <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2 }}>
//               <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
//                 Dialogs
//               </Typography>
//               <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//                 Modal components used to display information or request user
//                 actions without navigating away from the page.
//               </Typography>
//               {/* Confirm Dialogs */}
//               <Card>
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6" sx={{ mb: 2 }}>
//                     Confirm Dialog
//                   </Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Use for confirming critical or irreversible actions,
//                     ensuring user awareness before proceeding.
//                   </Typography>
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`
//                       import { ModalElement } from "../components/atom/ModalElement";
//                       import { useModal } from "../hooks/useDialog";

//                       const confirmModal = useModal();
//                       <ConfirmDialog
//                         open={confirmModal.open}
//                         onClose={confirmModal.handleClose}
//                         onConfirm={handleConfirm}
//                         title="Confirm Submission"
//                         message={'Are you sure you want to delete the user'}
//                         confirmColor="error"
//                         cancelColor="secondary"
//                       />
//                     `}
//                 />
//               </Card>

//               {/* Content Dialogs */}
//               <Card sx={{ mt: 3 }}>
//                 <Box sx={{ p: 4 }}>
//                   <Typography variant="h6" sx={{ mb: 2 }}>
//                     Content Dialog
//                   </Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Use for displaying forms, details, or other structured
//                     content inside a modal container.
//                   </Typography>
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`
//                       import { ModalElement } from "../components/atom/ModalElement";
//                       import { useModal } from "../hooks/useDialog";

//                       const formModal = useModal();

//                       <ModalElement
//                         open={formModal.open}
//                         title="Create User"
//                         onClose={formModal.handleClose}
//                       >
//                         <Stack spacing={2}>
//                           <TextField
//                             label="Name"
//                             value={formData.name}
//                             onChange={(e) => setFormData({ name: e.target.value })}
//                             fullWidth
//                           />
//                           <Button variant="contained" onClick={handleFormSubmit}>
//                             Save
//                           </Button>
//                         </Stack>
//                       </ModalElement>
//                     `}
//                 />
//               </Card>
//             </Card>
//           </Box>

//           {/* Tables */}
//           <Box id="tables">
//             <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2 }}>
//               {/* Datatables */}
//               <Box>
//                 <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
//                   DataTables
//                 </Typography>

//                 {/* Basic Datatables */}
//                 <Card sx={{ mt: 3 }}>
//                   <Box sx={{ p: 4 }}>
//                     <Typography variant="h6" sx={{ mb: 2 }}>
//                       Basic Datatables
//                     </Typography>
//                     <Typography
//                       variant="body2"
//                       sx={{ mb: 2 }}
//                       color="text.secondary"
//                     >
//                       Interactive data tables with built-in support for sorting,
//                       filtering, and pagination.
//                     </Typography>
//                     <DataTable
//                       columns={columns}
//                       rows={rows as any}
//                       loading={false}
//                       pagination={true}
//                       pageSizeOptions={[5, 10, 25]}
//                       checkboxSelection={false}
//                       tableHeight={500}
//                       disableRowClickSelection={false}
//                     />
//                   </Box>
//                   <ShowCodeAccordion
//                     code={`
//                         import { DataTable } from "../components/tables/DataTables";

//                         const [filterName, setFilterName] = useState("");

//                         const employees = [
//                           {
//                             id: 1,
//                             name: "John",
//                             status: "Active",
//                             dob: "1996-03-22",
//                           },
//                           {
//                             id: 2,
//                             name: "Clark",
//                             status: "Inactive",
//                             dob: "1999-10-14",
//                           },
//                           {
//                             id: 3,
//                             name: "Nick",
//                             status: "Active",
//                             dob: "1995-07-09",
//                           },
//                         ];
                      
//                         const filteredEmployees = employees.filter((e) =>
//                           e.name.toLowerCase().includes(filterName.toLowerCase())
//                         );
                      
//                         const columns: GridColDef[] = [
//                           { field: "name", headerName: "Employee Name", flex: 1 },
//                           {
//                             field: "status",
//                             headerName: "Status",
//                             flex: 1,
//                             renderCell: (params) => (
//                               <Label
//                                 label={params.value ?? ""}
//                                 color={params.value === "Active" ? "success" : "error"}
//                                 variant="soft"
//                               />
//                             ),
//                           },
//                           {
//                             field: "dob",
//                             headerName: "Date of Birth",
//                             flex: 1,
//                             align: "center",
//                             headerAlign: "center",
//                             renderCell: (params) => {
//                               const date = new Date(params.value ?? "");
//                               return <span>{date.toLocaleDateString("en-IN")}</span>;
//                             },
//                           },
//                           {
//                             field: "actions",
//                             headerName: "Actions",
//                             flex: 0.5,
//                             sortable: false,
//                             renderCell: (params) => (
//                               <>
//                                 <MenuAtom items={[
//                                   { icon: <EditIcon sx={{ mr: 1.75 }} />, label: "Edit", onClick: () => alert('Edit ' + params.row.name) },
//                                   { icon: <DeleteIcon sx={{ mr: 1.75 }} />, label: "Delete", onClick: () => alert('Delete ' + params.row.name) },
//                                 ]} />
//                               </>
//                             ),
//                           },
//                         ];

//                         <DataTable
//                           columns={columns}
//                           rows={filteredEmployees}
//                           filterName={filterName}
//                           onFilterName={(e) => setFilterName(e.target.value)}
//                           action={
//                             <Button
//                               variant="contained"
//                               startIcon={<AddIcon />}
//                               onClick={() => alert("Add Employee")}
//                             >
//                               Add Employee
//                             </Button>
//                           }
//                           loading={false}
//                           headerBgColor={theme.palette.primary.light} 
//                           bodyBgColor={theme.palette.secondary.light} 
//                           pagination= true
//                           pageSizeOptions={[5, 10, 25]}
//                           checkboxSelection={false}
//                           tableHeight={500}
//                           disableRowClickSelection={false}
//                         />
//                       `}
//                   />
//                 </Card>

//                 {/* Inline Editable Datatables */}
//                 <Card sx={{ mt: 3 }}>
//                   <Box sx={{ p: 4 }}>
//                     <Typography variant="h6" sx={{ mb: 2 }}>
//                       Editable Datatables
//                     </Typography>
//                     <Typography
//                       variant="body2"
//                       sx={{ mb: 2 }}
//                       color="text.secondary"
//                     >
//                       Interactive data tables with built-in support for inline
//                       edit of data present in table.
//                     </Typography>
//                     <EditableDataGridWithConfirm
//                       rows={rows}
//                       columns={columns}
//                     />
//                   </Box>
//                   <ShowCodeAccordion
//                     code={`
//                         import { EditableDataGridWithConfirm } from "../components/tables/data-table/EditableDataGridWithConfirm";

//                         const columns: GridColDef[] = [
//                           { field: "name", headerName: "Name", flex: 1, editable: true },
//                           { field: "age", headerName: "Age", flex: 0.5, editable: true, type: "number" },
//                           { field: "dateCreated", headerName: "Date Created", type: "date", flex: 0.75, editable: true },
//                           { field: "lastLogin", headerName: "Last Login", type: "dateTime", flex: 0.75, editable:true },
//                         ];

//                         const rows: GridRowsProp = [
//                           { id: 1, name: "Jane", age: 25, dateCreated: new Date("2025-01-15"), lastLogin: new Date("2025-12-01") },
//                           { id: 2, name: "Steve", age: 30, dateCreated: new Date("2025-03-22"), lastLogin: new Date("2025-12-05") },
//                         ];
//                         <Card>
//                           <EditableDataGridWithConfirm
//                             rows={rows}
//                             columns={columns}
//                           />
//                         </Card>
//                       `}
//                   />
//                 </Card>

//                 {/* Quick Filter Datatables */}
//                 <Card sx={{ mt: 3 }}>
//                   <Box sx={{ p: 4 }}>
//                     <Typography variant="h6" sx={{ mb: 2 }}>
//                       Quick Filter Datatables
//                     </Typography>
//                     <Typography
//                       variant="body2"
//                       sx={{ mb: 2 }}
//                       color="text.secondary"
//                     >
//                       Interactive data tables with built-in support for quick
//                       filtering and csv export.
//                     </Typography>
//                     <QuickFilterDataGrid
//                       rows={quickrows}
//                       columns={quickcolumns}
//                       pageSize={5}
//                       // quickFilterValues={["India"]} for default search
//                     />
//                   </Box>
//                   <ShowCodeAccordion
//                     code={`
//                         import { QuickFilterDataGrid } from "../components/tables/data-table/QuickFilterDataGrid";

//                         <Card>
//                           <QuickFilterDataGrid
//                             rows={quickrows}
//                             columns={quickcolumns}
//                             pageSize={5}
//                             // quickFilterValues={["India"]} for default search
//                           />
//                         </Card>
//                       `}
//                   />
//                 </Card>
//               </Box>

//               {/* Native Tables */}
//               <Box sx={{ mt: 3 }}>
//                 <Typography variant="h6" sx={{ mb: 2 }}>
//                   Native Tables
//                 </Typography>

//                 {/* Standard Table */}
//                 <Card sx={{ mt: 3 }}>
//                   <Box sx={{ p: 4 }}>
//                     <Typography variant="h6" sx={{ mb: 2 }}>
//                       Standard Tables
//                     </Typography>
//                     <Typography
//                       variant="body2"
//                       sx={{ mb: 2 }}
//                       color="text.secondary"
//                     >
//                       Simple static tables ideal for displaying read-only
//                       datasets or summaries.
//                     </Typography>
//                   </Box>
//                   <ShowCodeAccordion
//                     code={`

//                         // For sticky header pass sticky={true} in standard table element as props

//                         import { StandardTable } from "../components/tables/StandardTable";
//                         import { Label } from "../components/atom/Label";
//                         import type { StandardTableColumn } from "../types/types";
                        
//                         export default function StandardTableDemo() {

//                           const columns: StandardTableColumn[] = [
//                             { id: "name", label: "Name" },
//                             { id: "age", label: "Age", align: "center" },
//                             {
//                               id: "status",
//                               label: "Status",
//                               align: "center",
//                               render: (row: any) => (
//                                 <Label
//                                   label={row.status}
//                                   color={row.status === "Active" ? "success" : "error"}
//                                   variant="soft"
//                                 />
//                               ),
//                             },
//                             {
//                                 id:'action',
//                                 label:'Actions',
//                                 render: (row: any) => (
//                                     <MenuAtom items={[
//                                       { icon: <EditIcon sx={{ mr: 1.75 }} />, label: "Edit", onClick: () => alert('Edit ' + row.name) },
//                                       { icon: <DeleteIcon sx={{ mr: 1.75 }} />, label: "Delete", onClick: () => alert('Delete ' + row.name) },
//                                     ]} />
//                                 ),
//                             }
//                           ];
                        
//                           const rows = [
//                             { name: "John", age: 28, status: "Active" },
//                             { name: "Emily", age: 25, status: "Inactive" },
//                             { name: "Nick", age: 30, status: "Active" },
//                           ];
                        
//                           return (
//                             <div style={{ padding: 24 }}>
//                               <StandardTable columns={columns} rows={rows} />
//                             </div>
//                           );

//                           <DenseTableAtom columns={densecolumns} rows={denserows} />
//                         }
//                       `}
//                   />
//                 </Card>

//                 {/* Dense Table */}
//                 <Card sx={{ mt: 3 }}>
//                   <Box sx={{ p: 4 }}>
//                     <Typography variant="h6" sx={{ mb: 2 }}>
//                       Dense Table
//                     </Typography>
//                     <Typography
//                       variant="body2"
//                       sx={{ mb: 2 }}
//                       color="text.secondary"
//                     >
//                       Compact, high-density data tables optimized for
//                       space-constrained layouts.
//                     </Typography>
//                     <DenseTableAtom columns={densecolumns} rows={denserows} />
//                   </Box>
//                   <ShowCodeAccordion
//                     code={`
//                         import { DenseTableAtom } from "../components/tables/standard-table/DenseTableAtom";

//                           const densecolumns = [
//                             { label: "Dessert (100g serving)", field: "name", align: "left"  },
//                             { label: "Calories", field: "calories", align: "right" },
//                             { label: "Fat (g)", field: "fat", align: "right" },
//                             { label: "Carbs (g)", field: "carbs", align: "right" },
//                             { label: "Protein (g)", field: "protein", align: "right" },
//                           ];

//                           const denserows = [
//                             { name: "Frozen yoghurt", calories: 159, fat: 6, carbs: 24, protein: 4.0 },
//                             { name: "Ice cream sandwich", calories: 237, fat: 9, carbs: 37, protein: 4.3 },
//                             { name: "Eclair", calories: 262, fat: 16, carbs: 24, protein: 6.0 },
//                             { name: "Cupcake", calories: 305, fat: 3.7, carbs: 67, protein: 4.3 },
//                             { name: "Gingerbread", calories: 356, fat: 16, carbs: 49, protein: 3.9 },
//                           ];

//                         <DenseTableAtom columns={densecolumns} rows={denserows} />
//                       `}
//                   />
//                 </Card>

//                 {/* Collapsible Table */}
//                 <Card sx={{ mt: 3 }}>
//                   <Box sx={{ p: 4 }}>
//                     <Typography variant="h6" sx={{ mb: 2 }}>
//                       Collapsible Tables
//                     </Typography>
//                     <Typography
//                       variant="body2"
//                       sx={{ mb: 2 }}
//                       color="text.secondary"
//                     >
//                       Expandable data tables with row-level detail views,
//                       perfect for hierarchical data and master-detail patterns.
//                     </Typography>
//                     <CollapsibleTableAtom
//                       columns={collapsecolumns}
//                       rows={collpaserows}
//                       renderCollapseContent={(row) => (
//                         <Table size="small">
//                           <TableHead>
//                             <TableRow>
//                               <TableCell>Date</TableCell>
//                               <TableCell>Customer</TableCell>
//                               <TableCell align="right">Amount</TableCell>
//                             </TableRow>
//                           </TableHead>
//                           <TableBody>
//                             {row.history?.map((h: any) => (
//                               <TableRow key={h.date}>
//                                 <TableCell>{h.date}</TableCell>
//                                 <TableCell>{h.customer}</TableCell>
//                                 <TableCell align="right">{h.amount}</TableCell>
//                               </TableRow>
//                             ))}
//                           </TableBody>
//                         </Table>
//                       )}
//                     />
//                   </Box>
//                   <ShowCodeAccordion
//                     code={`
//                       import { CollapsibleTableAtom } from "../components/tables/standard-table/CollapsibleTableAtom";
                      
//                       const collapsecolumns = [
//                         { label: "Dessert (100g serving)", field: "name" },
//                         { label: "Calories", field: "calories", align: "right" },
//                         { label: "Fat (g)", field: "fat", align: "right" },
//                         { label: "Carbs (g)", field: "carbs", align: "right" },
//                         { label: "Protein (g)", field: "protein", align: "right" },
//                       ];

//                       const collpaserows = [
//                         {
//                           id: 1,
//                           name: "Frozen yoghurt",
//                           calories: 159,
//                           fat: 6.0,
//                           carbs: 24,
//                           protein: 4.0,
//                           history: [
//                             { date: "2020-01-05", customer: "11091700", amount: 3 },
//                             { date: "2020-01-02", customer: "Anonymous", amount: 1 },
//                           ],
//                         },
//                         {
//                           id: 2,
//                           name: "Ice cream sandwich",
//                           calories: 237,
//                           fat: 9.0,
//                           carbs: 37,
//                           protein: 4.3,
//                           history: [
//                             { date: "2020-02-01", customer: "X1257", amount: 2 },
//                             { date: "2020-03-11", customer: "John Doe", amount: 1 },
//                           ],
//                         },
//                       ];

//                       <CollapsibleTableAtom
//                         columns={collapsecolumns}
//                         rows={collpaserows}
//                         renderCollapseContent={(row) => (
//                           <Table size="small">
//                             <TableHead >
//                               <TableRow>
//                                 <TableCell>Date</TableCell>
//                                 <TableCell>Customer</TableCell>
//                                 <TableCell align="right">Amount</TableCell>
//                               </TableRow>
//                             </TableHead>
//                             <TableBody>
//                               {row.history?.map((h: any) => (
//                                 <TableRow key={h.date}>
//                                   <TableCell>{h.date}</TableCell>
//                                   <TableCell>{h.customer}</TableCell>
//                                   <TableCell align="right">{h.amount}</TableCell>
//                                 </TableRow>
//                               ))}
//                             </TableBody>
//                           </Table>
//                         )}
//                       />
//                     `}
//                   />
//                 </Card>
//               </Box>
//             </Card>
//           </Box>

//           {/* Accordion Element */}
//           <Box id="accordion">
//             <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2 }}>
//               <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
//                 Accordion Element
//               </Typography>

//               {/* Accordion Element */}
//               <Card sx={{ mt: 3 }}>
//                 <Box sx={{ p: 4 }}>
//                   <Typography
//                     variant="body2"
//                     sx={{ mb: 2 }}
//                     color="text.secondary"
//                   >
//                     Expandable panels that reveal or hide content to organize
//                     complex information in a compact, user-friendly way.
//                   </Typography>
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`

//                       import { AccordionElement } from "../components/atom/show-code-accordion/Accordion";

//                       <AccordionElement title="Add New User" defaultOpen>
//                         <form onSubmit={(e) => e.preventDefault()}>
//                           <Stack spacing={2}>
//                             <TextField label="Name" fullWidth />
//                             <TextField label="Email" fullWidth />
//                             <Button type="submit" variant="contained" color="primary">
//                               Save
//                             </Button>
//                           </Stack>
//                         </form>
//                       </AccordionElement>

//                       // Accordion with checkboxes ad indeterminate checks
//                       <AccordionElement
//                         title="Select Categories"
//                         open={open}
//                         onChange={() => setOpen(!open)}
//                         showCheckbox={true}
//                         checkboxProps={{
//                             checked: allChecked,
//                             indeterminate: someChecked, // Indeterminate state
//                             onChange: handleParentChange,
//                             onClick: (e) => {
//                                 e.stopPropagation();
//                             },
//                             label: "",
//                         }}
//                         >
//                         <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
//                             {items.map((item) => (
//                             <Checkbox
//                                 key={item.id}
//                                 checked={item.checked}
//                                 onChange={() => handleChildChange(item.id)}
//                                 label={item.label}
//                             />
//                             ))}
//                         </Box>
//                     </AccordionElement>
//                     `}
//                 />
//               </Card>
//             </Card>
//           </Box>

//           {/* Slider Element */}
//           <Box id="slider">
//             <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2 }}>
//               <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
//                 Slider Element
//               </Typography>
//               <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//                 Expandable panels that reveal or hide content to organize
//                 complex information in a compact, user-friendly way.
//               </Typography>
//               {/* Accordion Element */}
//               <Card sx={{ mt: 3 }}>
//                 <Box sx={{ p: 4 }}>
//                   <Box sx={{ width: { xs: "100%", sm: 300, md: 400 } }}>
//                     <Typography gutterBottom>Volume: {value}</Typography>
//                     <SliderAtom
//                       value={value}
//                       onChange={setValue}
//                       min={0}
//                       max={100}
//                       step={5}
//                       marks={[
//                         { value: 0, label: "0" },
//                         { value: 50, label: "50" },
//                         { value: 100, label: "100" },
//                       ]}
//                     />
//                   </Box>
//                 </Box>
//                 <ShowCodeAccordion
//                   code={`

//                       import { SliderAtom } from "../components/slider";

//                       <SliderAtom
//                         value={value}
//                         onChange={setValue}
//                         min={0}
//                         max={100}
//                         step={5}
//                         marks={[
//                           { value: 0, label: "0" },
//                           { value: 50, label: "50" },
//                           { value: 100, label: "100" },
//                         ]}
//                       />
//                     `}
//                 />
//               </Card>
//             </Card>
//           </Box>

//           {/* Tabs Element */}
//           <Box id="tabs">
//             <Card sx={{ mt: 3, p: { xs: 2, md: 5 }, pt: 2 }}>
//               <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
//                 Tabs Element
//               </Typography>
//               <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
//                 Tabs element used to have seperate sections of content in pages.
//               </Typography>
//               {/* Accordion Element */}
//               <Card sx={{ mt: 3 }}>
//                 <TabsAtom tabs={atomtabs} />
//                 <ShowCodeAccordion
//                   code={`
//                       import { TabsAtom } from "../components/tabs/Tabs";

//                       const atomtabs = [
//                         {
//                           label: "Profile",
//                           icon: <PersonOutlineTwoTone sx={{ fontSize: "1.3rem" }} />,
//                           content: "Profile content goes here.",
//                         },
//                         {
//                           label: "Followers",
//                           icon: <RecentActorsTwoTone sx={{ fontSize: "1.3rem" }} />,
//                           content: "Followers list...",
//                         },
//                         {
//                           label: "Friends",
//                           icon: <PeopleAltTwoTone sx={{ fontSize: "1.3rem" }} />,
//                           chipLabel: "01",
//                           content: "Friends content...",
//                         },
//                         {
//                           label: "Gallery",
//                           icon: <PanoramaTwoTone sx={{ fontSize: "1.3rem" }} />,
//                           content: "Gallery content here.",
//                         },
//                       ];

//                       <TabsAtom tabs={atomtabs} />
//                     `}
//                 />
//               </Card>
//               <Card sx={{ mt: 3 }}>
//                 <VerticalTabsAtom tabs={verticaltabs} />
//                 <ShowCodeAccordion
//                   code={`
//                       import { VerticalTabsAtom } from "../components/tabs/VerticalTabs";

//                       const tabs = [
//                         {
//                           label: "User Profile",
//                           subLabel: "Profile Settings",
//                           icon: <PersonOutlineTwoTone />,
//                           content: (
//                             <Stack spacing={2}>
//                               <Typography>Profile settings content</Typography>
//                             </Stack>
//                           ),
//                         },
//                         {
//                           label: "Billing",
//                           subLabel: "Billing Information",
//                           icon: <DescriptionTwoTone />,
//                           content: <Typography>Billing info content</Typography>,
//                         },
//                         {
//                           label: "Payment",
//                           subLabel: "Add & Update Card",
//                           icon: <CreditCardTwoTone />,
//                           content: <Typography>Payment content</Typography>,
//                         },
//                         {
//                           label: "Change Password",
//                           subLabel: "Update Profile Security",
//                           icon: <VpnKeyTwoTone />,
//                           content: <Typography>Password change content</Typography>,
//                         },
//                       ];

//                       <VerticalTabsAtom tabs={tabs} />
//                     `}
//                 />
//               </Card>
//             </Card>
//           </Box>
//         </CardContent>
//       </Card>
//     </Box>
//   );
// }

// export default StyleGuideOld;
