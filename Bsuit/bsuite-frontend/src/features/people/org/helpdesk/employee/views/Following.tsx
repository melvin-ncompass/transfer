import { Box, Stack, Typography } from "@mui/material";
import { QuickFilterDataGrid } from "../../../../../../components/tables/data-table";
import type { GridColDef } from "@mui/x-data-grid";
import { FilterList, Add } from "@mui/icons-material";
import {
  PrimaryIconButton,
  PrimaryButton,
} from "../../../../../../components/atom/button";
import { DateRangePicker } from "../../../../../../components/atom/custom-date-range-picker";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { useState } from "react";
import type { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import { useGetFollowingTicketsQuery } from "../../api/ticket.api";
import { formatDateTime, getPersonDisplayName } from "../../common/utils/helpdeskUtils";

export interface Ticket {
  ticketNo: string;
  title: string;
  raisedOn: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  category: string;
  assignedTo: string;
  ticketStatus: "Open" | "In Progress" | "Resolved" | "Closed" | "On Hold";
  lastUpdated: string;
}

// Sample data
export const sampleTickets: Ticket[] = [
  {
    ticketNo: "TCK-1001",
    title: "Login page throws 500 error",
    raisedOn: "2026-02-20 09:15 AM",
    priority: "Critical",
    category: "Authentication",
    assignedTo: "Arjun R",
    ticketStatus: "In Progress",
    lastUpdated: "2026-02-27 09:45 AM",
  },
  {
    ticketNo: "TCK-1002",
    title: "Unable to upload profile picture",
    raisedOn: "2026-02-21 11:30 AM",
    priority: "Medium",
    category: "User Profile",
    assignedTo: "Priya S",
    ticketStatus: "Open",
    lastUpdated: "2026-02-26 04:10 PM",
  },
  {
    ticketNo: "TCK-1003",
    title: "Dashboard data mismatch in reports",
    raisedOn: "2026-02-18 02:45 PM",
    priority: "High",
    category: "Reports",
    assignedTo: "Karthik M",
    ticketStatus: "On Hold",
    lastUpdated: "2026-02-25 03:20 PM",
  },
  {
    ticketNo: "TCK-1004",
    title: "Email notifications not triggering",
    raisedOn: "2026-02-15 10:00 AM",
    priority: "High",
    category: "Notifications",
    assignedTo: "Sneha V",
    ticketStatus: "Resolved",
    lastUpdated: "2026-02-24 01:15 PM",
  },
  {
    ticketNo: "TCK-1005",
    title: "Mobile responsiveness issue on settings page",
    raisedOn: "2026-02-10 04:20 PM",
    priority: "Low",
    category: "UI/UX",
    assignedTo: "Rahul K",
    ticketStatus: "Closed",
    lastUpdated: "2026-02-22 12:05 PM",
  },
  {
    ticketNo: "TCK-1006",
    title: "API timeout on employee list endpoint",
    raisedOn: "2026-02-23 08:40 AM",
    priority: "Critical",
    category: "Backend",
    assignedTo: "Divya N",
    ticketStatus: "In Progress",
    lastUpdated: "2026-02-27 08:55 AM",
  },
  {
    ticketNo: "TCK-1007",
    title: "API timeout on employee list endpoint",
    raisedOn: "2026-02-23 08:40 AM",
    priority: "Critical",
    category: "Backend",
    assignedTo: "Divya N",
    ticketStatus: "In Progress",
    lastUpdated: "2026-02-27 08:55 AM",
  },
];
// Columns definition
const ticketColumns: GridColDef[] = [
  { field: "ticketNo", headerName: "Ticket No", flex: 1 },
  { field: "title", headerName: "Title", flex: 2 },
  { field: "raisedOn", headerName: "Raised On", flex: 1.5 },
  { field: "priority", headerName: "Priority", flex: 1 },
  { field: "category", headerName: "Category", flex: 1.5 },
  { field: "assignedTo", headerName: "Assigned To", flex: 1.5 },
  { field: "ticketStatus", headerName: "Ticket Status", flex: 1.5 },
  { field: "lastUpdated", headerName: "Last Updated", flex: 1.5 },
];

function Following() {
  const navigate = useNavigate();

  // Commented off the use of getFollowingTickets for now
  // const { data, isLoading, isFetching } = useGetFollowingTicketsQuery();

  // const mappedTickets = (data?.data ?? []).map((t) => ({
  //   id: t.id,
  //   ticketNo: t.ticketNumber || "—",
  //   title: t.subject || "—",
  //   raisedOn: formatDateTime(t.createdAt),
  //   priority: t.priority?.name || "—",
  //   category: t.category?.categoryName || "—",
  //   assignedTo: getPersonDisplayName(t.assignee),
  //   ticketStatus: t.status?.name || "—",
  //   lastUpdated: formatDateTime(t.updatedAt),
  //   _slug: t.status?.slug || "",
  // }));

  // Add unique `id` for DataGrid
  const sampleTicketsWithId = sampleTickets.map((ticket) => ({
    id: ticket.ticketNo,
    ...ticket,
  }));

  // Filter tickets by status
  const openTickets = sampleTicketsWithId.filter(
    (t) => t.ticketStatus !== "Closed" && t.ticketStatus !== "Resolved",
  );
  const closedTickets = sampleTicketsWithId.filter(
    (t) => t.ticketStatus === "Closed" || t.ticketStatus === "Resolved",
  );

  return (
    <Box height="90%" overflow="scroll" p={2}>
      {/* Open Tickets Section */}
      <SectionHeader
        title="Open Tickets"
        subtitle="These are the open tickets in which you are added as a follower."
      />
      <QuickFilterDataGrid
        columns={ticketColumns}
        rows={openTickets}
        pageSize={3}
        pagination={true}
        sx={{ height: 400 }}
        // loading={isLoading || isFetching}
        // onRowClick={(params) => navigate(`/people/helpdesk/tickets/${params.id}`)}
      />

      {/* Closed Tickets Section */}
      <SectionHeader
        title="Closed Tickets"
        subtitle="These are the closed tickets in which you have been added as a follower."
        mt={4}
      />
      <QuickFilterDataGrid
        columns={ticketColumns}
        rows={closedTickets}
        pageSize={5}
        pagination
        sx={{ height: 400, mb: 2 }}
        showToolbar
        // loading={isLoading || isFetching}
        // onRowClick={(params) => navigate(`/people/helpdesk/tickets/${params.id}`)}
      />
    </Box>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  mt?: number;
}

function SectionHeader({ title, subtitle, mt = 2 }: SectionHeaderProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(e.currentTarget);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
  };
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      mt={mt}
      mb={1}
      borderBottom={subtitle ? "1px solid #ccc" : "none"}
      pb={subtitle ? 1 : 0}
    >
      <Stack spacing={0.5}>
        <Typography variant="subtitle1">{title}</Typography>
        {subtitle && <Typography variant="body2">{subtitle}</Typography>}
      </Stack>
      <Stack direction={"row"} gap={1}>
        <PrimaryIconButton
          icon={<FilterList />}
          onClick={(e) => {
            openMenu(e);
          }}
          variant="outlined"
          title="Filters"
        />
        <MenuAtom
          items={[
            {
              label: "Last 7 days",
            },
            {
              label: "Last 14 days",
            },
            {
              label: "Last 1 month",
            },
            {
              label: "Last 3 months",
            },
            {
              label: "Last 6 months",
            },
            {
              label: "Last 1 year",
            },
            {
              label: "Custom Range",
              onClick: () => {
                setDatePickerOpen(true);
              },
            },
          ]}
          onCloseAll={closeMenu}
          open={Boolean(menuAnchor)}
          anchorEl={menuAnchor}
        />
      </Stack>
      <ModalElement
        title="Select Custom Date Range"
        open={datePickerOpen}
        onClose={() => {
          setDatePickerOpen(false);
        }}
      >
        <DateRangePicker
          onChange={(dates) => {
            setFromDate(dates[0]);
            setToDate(dates[1]);

            console.log(dates);
          }}
        />
        <Box width={"100%"} display={"flex"} justifyContent={"end"} mt={1}>
          <PrimaryButton
            onClick={() => {
              setDatePickerOpen(false);
            }}
          >
            Save
          </PrimaryButton>
        </Box>
      </ModalElement>
    </Stack>
  );
}

export default Following;
