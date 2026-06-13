import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  FilterList,
  Clear
} from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PrimaryButton, PrimaryIconButton } from "../../../../../../components/atom/button";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import {
  useGetAllCategoriesQuery,
  useGetAllPrioritiesQuery,
  useGetAllStatusesQuery,
} from "../../api/category.api";
import {
  useDeleteTicketMutation,
  useFollowTicketMutation,
  useGetAllTicketsQuery,
  useGetAssignedTicketsQuery,
  useGetFollowingTicketsQuery,
  useGetMyTicketsQuery,
  useHoldTicketMutation,
  useResumeTicketMutation,
  useUnfollowTicketMutation,
  type Ticket,
} from "../../api/ticket.api";
import AssignTicketModal from "../components/AssignTicketModal";
import CloseTicketModal from "../components/CloseTicketModal";
import CreateTicketModal from "../components/CreateTicketModal";
import ReopenTicketModal from "../components/ReopenTicketModal";
import ResolveTicketModal from "../components/ResolveTicketModal";
import {
  formatDateTime,
  getBackendMessage,
  getPersonDisplayName,
  getSlaStatusLabel,
  getTicketSla,
} from "../../common/utils/helpdeskUtils";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { ToggleSwitch } from "../../../../../../components/atom/toggle-switch";

type ListMode = "all" | "mine" | "assigned" | "following";

const dash = (value: unknown) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && value.trim() === "") return "—";
  return String(value);
};

function getStatusSlug(ticket: Ticket): string {
  return ticket.status?.slug?.toLowerCase() ?? "";
}

export default function Tickets() {
  const navigate = useNavigate();

  const listMode: ListMode = "all";
  const [searchQuery, setSearchQuery] = useState("");

  // Applied filters (used for actual filtering)
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [myTickets, setMyTickets] = useState(false);
  const [followingTickets, setFollowingTickets] = useState(false);

  // Pending filters (local to the modal, not applied until "Apply Filters" is clicked)
  const [pendingStatus, setPendingStatus] = useState("");
  const [pendingPriority, setPendingPriority] = useState("");
  const [pendingCategory, setPendingCategory] = useState("");
  const [pendingAssignedToMe, setPendingAssignedToMe] = useState(false);
  const [pendingMyTickets, setPendingMyTickets] = useState(false);
  const [pendingFollowingTickets, setPendingFollowingTickets] = useState(false);

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const effectiveMode: ListMode = assignedToMe
    ? "assigned"
    : myTickets
      ? "mine"
      : followingTickets
        ? "following"
        : listMode;

  const {
    data: allTicketsData,
    isLoading: isLoadingAll,
    isFetching: isFetchingAll,
  } = useGetAllTicketsQuery(undefined, { skip: effectiveMode !== "all" });

  const {
    data: myTicketsData,
    isLoading: isLoadingMine,
    isFetching: isFetchingMine,
  } = useGetMyTicketsQuery(undefined, { skip: effectiveMode !== "mine" });

  const {
    data: assignedTicketsData,
    isLoading: isLoadingAssigned,
    isFetching: isFetchingAssigned,
  } = useGetAssignedTicketsQuery(undefined, {
    skip: effectiveMode !== "assigned",
  });

  const {
    data: followingTicketsData,
    isLoading: isLoadingFollowing,
    isFetching: isFetchingFollowing,
  } = useGetFollowingTicketsQuery(undefined, {
    skip: effectiveMode !== "following",
  });

  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: prioritiesData } = useGetAllPrioritiesQuery();
  const { data: statusesData } = useGetAllStatusesQuery();

  const [holdTicket] = useHoldTicketMutation();
  const [resumeTicket] = useResumeTicketMutation();
  const [deleteTicket, { isLoading: isDeleting }] = useDeleteTicketMutation();
  const [followTicket] = useFollowTicketMutation();
  const [unfollowTicket] = useUnfollowTicketMutation();

  const isLoading =
    (effectiveMode === "all" && isLoadingAll) ||
    (effectiveMode === "mine" && isLoadingMine) ||
    (effectiveMode === "assigned" && isLoadingAssigned) ||
    (effectiveMode === "following" && isLoadingFollowing);

  const isFetching =
    (effectiveMode === "all" && isFetchingAll) ||
    (effectiveMode === "mine" && isFetchingMine) ||
    (effectiveMode === "assigned" && isFetchingAssigned) ||
    (effectiveMode === "following" && isFetchingFollowing);

  const tickets = useMemo(() => {
    const source =
      effectiveMode === "mine"
        ? myTicketsData?.data
        : effectiveMode === "assigned"
          ? assignedTicketsData?.data
          : effectiveMode === "following"
            ? followingTicketsData?.data
            : allTicketsData?.data;
    return source ?? [];
  }, [
    effectiveMode,
    allTicketsData,
    myTicketsData,
    assignedTicketsData,
    followingTicketsData,
  ]);

  const statusOptions = useMemo(
    () =>
      statusesData?.data?.map((status) => ({
        label: status.name,
        value: String(status.id),
      })) ?? [],
    [statusesData],
  );

  const priorityOptions = useMemo(
    () =>
      prioritiesData?.data?.map((priority) => ({
        label: priority.name,
        value: String(priority.id),
      })) ?? [],
    [prioritiesData],
  );

  const categoryOptions = useMemo(
    () =>
      categoriesData?.data?.map((category) => ({
        label: category.categoryName,
        value: String(category.id),
      })) ?? [],
    [categoriesData],
  );

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (statusFilter && String(ticket.status?.id) !== statusFilter) {
        return false;
      }
      if (priorityFilter && String(ticket.priority?.id) !== priorityFilter) {
        return false;
      }
      if (categoryFilter && String(ticket.category?.id) !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        ticket.ticketNumber?.toLowerCase().includes(q) ||
        ticket.subject?.toLowerCase().includes(q)
      );
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const clearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setAssignedToMe(false);
    setMyTickets(false);
    setFollowingTickets(false);
    // Also reset pending state to stay in sync
    setPendingStatus("");
    setPendingPriority("");
    setPendingCategory("");
    setPendingAssignedToMe(false);
    setPendingMyTickets(false);
    setPendingFollowingTickets(false);
  };

  const handleOpenFilterModal = () => {
    // Sync pending state with currently applied filters when opening
    setPendingStatus(statusFilter);
    setPendingPriority(priorityFilter);
    setPendingCategory(categoryFilter);
    setPendingAssignedToMe(assignedToMe);
    setPendingMyTickets(myTickets);
    setPendingFollowingTickets(followingTickets);
    setFilterModalOpen(true);
  };

  const handleApplyFilters = () => {
    setStatusFilter(pendingStatus);
    setPriorityFilter(pendingPriority);
    setCategoryFilter(pendingCategory);
    setAssignedToMe(pendingAssignedToMe);
    setMyTickets(pendingMyTickets);
    setFollowingTickets(pendingFollowingTickets);
    setFilterModalOpen(false);
  };

  const handleClearPendingFilters = () => {
    setPendingStatus("");
    setPendingPriority("");
    setPendingCategory("");
    setPendingAssignedToMe(false);
    setPendingMyTickets(false);
    setPendingFollowingTickets(false);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    ticket: Ticket,
  ) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedTicket(ticket);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const runAction = async (
    action: () => Promise<{ message?: string }>,
    successMessage: string,
    fallbackError: string,
  ) => {
    try {
      const response = await action();
      showSnackbar(response.message ?? successMessage, "success");
    } catch (error) {
      showSnackbar(getBackendMessage(error, fallbackError), "error");
    } finally {
      handleMenuClose();
      setSelectedTicket(null);
    }
  };

  const statusSlug = selectedTicket ? getStatusSlug(selectedTicket) : "";

  const menuItems = useMemo(() => {
    if (!selectedTicket) return [];

    const items = [
      {
        label: "View",
        onClick: () => {
          navigate(`/people/helpdesk/tickets/${selectedTicket.id}`);
          handleMenuClose();
        },
      },
      {
        label: "Assign",
        onClick: () => {
          setAssignModalOpen(true);
          handleMenuClose();
        },
      },
    ];

    if (statusSlug === "assigned" || statusSlug === "in_progress") {
      items.push(
        {
          label: "Hold",
          onClick: () =>
            runAction(
              () => holdTicket(selectedTicket.id).unwrap(),
              "Ticket placed on hold",
              "Failed to hold ticket",
            ),
        },
        {
          label: "Resolve",
          onClick: () => {
            setResolveModalOpen(true);
            handleMenuClose();
          },
        },
        {
          label: "Close",
          onClick: () => {
            setCloseModalOpen(true);
            handleMenuClose();
          },
        },
      );
    }

    if (statusSlug === "on_hold") {
      items.push({
        label: "Resume",
        onClick: () =>
          runAction(
            () => resumeTicket(selectedTicket.id).unwrap(),
            "Ticket resumed",
            "Failed to resume ticket",
          ),
      });
    }

    if (statusSlug === "closed" || statusSlug === "resolved") {
      items.push({
        label: "Reopen",
        onClick: () => {
          setReopenModalOpen(true);
          handleMenuClose();
        },
      });
    }

    items.push({
      label: selectedTicket.isFollowing ? "Unfollow" : "Follow",
      onClick: () =>
        runAction(
          () =>
            (selectedTicket.isFollowing
              ? unfollowTicket(selectedTicket.id)
              : followTicket(selectedTicket.id)
            ).unwrap(),
          selectedTicket.isFollowing
            ? "Unfollowed ticket"
            : "Following ticket",
          "Failed to update follow status",
        ),
    });

    items.push({
      label: "Delete",
      onClick: () => {
        setDeleteDialogOpen(true);
        handleMenuClose();
      },
    });

    return items;
  }, [
    selectedTicket,
    statusSlug,
    navigate,
    holdTicket,
    resumeTicket,
    followTicket,
    unfollowTicket,
  ]);

  const columns = [
    {
      id: "ticketNumber",
      label: "Ticket Number",
      render: (row: Ticket) => (
        <Typography variant="body2">{dash(row.ticketNumber)}</Typography>
      ),
    },
    {
      id: "subject",
      label: "Subject",
      render: (row: Ticket) => (
        <Typography variant="body2">{dash(row.subject)}</Typography>
      ),
    },
    {
      id: "requester",
      label: "Requester",
      render: (row: Ticket) => (
        <Typography variant="body2">{getPersonDisplayName(row.requester)}</Typography>
      ),
    },
    {
      id: "assignee",
      label: "Assignee",
      render: (row: Ticket) => (
        <Typography variant="body2">{getPersonDisplayName(row.assignee)}</Typography>
      ),
    },
    {
      id: "category",
      label: "Category",
      render: (row: Ticket) => (
        <Typography variant="body2">{dash(row.category?.categoryName)}</Typography>
      ),
    },
    {
      id: "priority",
      label: "Priority",
      render: (row: Ticket) => (
        <Chip
          size="small"
          label={dash(row.priority?.name)}
          sx={
            row.priority?.color
              ? { bgcolor: row.priority.color, color: "#fff" }
              : undefined
          }
        />
      ),
    },
    {
      id: "status",
      label: "Status",
      render: (row: Ticket) => (
        <Typography variant="body2">{dash(row.status?.name)}</Typography>
      ),
    },
    {
      id: "createdAt",
      label: "Created At",
      render: (row: Ticket) => (
        <Typography variant="body2">{formatDateTime(row.createdAt)}</Typography>
      ),
    },
    {
      id: "slaStatus",
      label: "SLA Status",
      render: (row: Ticket) => {
        const sla = getTicketSla(row);
        const label = getSlaStatusLabel(sla);
        const isBreached = label === "Breached";
        return (
          <Chip
            size="small"
            label={label}
            color={isBreached ? "error" : label === "On track" ? "success" : "default"}
            variant={label === "—" ? "outlined" : "filled"}
          />
        );
      },
    },
    {
      id: "actions",
      label: "Actions",
      width: 80,
      render: (row: Ticket) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, row)}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const handleDeleteConfirm = async () => {
    if (!selectedTicket) return;
    try {
      const response = await deleteTicket(selectedTicket.id).unwrap();
      showSnackbar(response.message ?? "Ticket deleted successfully", "success");
    } catch (error) {
      showSnackbar(getBackendMessage(error, "Failed to delete ticket"), "error");
    }
    setDeleteDialogOpen(false);
    setSelectedTicket(null);
  };

  return (
    <Box p={2} height="100%" display="flex" flexDirection="column" gap={2}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        gap={2}
      >
        <Typography variant="h6">Tickets</Typography>
        <PrimaryButton
          onClick={() => {
            setEditTicket(null);
            setCreateModalOpen(true);
          }}
        >
          + Create Ticket
        </PrimaryButton>
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <TextFieldElement
          label="Search ticket number or subject"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1 }}
        />

        <Stack direction="row" spacing={1}>
          <PrimaryIconButton
            variant="outlined"
            icon={<FilterList />}
            onClick={handleOpenFilterModal}

          />

          <PrimaryIconButton
            icon={<Clear />}
            variant="outlined"
            onClick={clearFilters}
          />
        </Stack>

      </Stack>
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <StandardTable
          columns={columns}
          rows={filteredTickets}
          loading={isFetching && !isLoading}
          sticky
          emptyMessage="No tickets found"
          onRowClick={(row) => navigate(`/people/helpdesk/tickets/${row.id}`)}
          isRowClickable={() => true}
        />
      )}

      <ModalElement
        title="Filters"
        open={filterModalOpen}
        onClose={() => { handleClearPendingFilters(); setFilterModalOpen(false); }}
      >
        <Stack spacing={3} pt={1}>
          <SingleSelectElement
            label="Status"
            value={pendingStatus}
            onChange={setPendingStatus}
            options={[{ label: "All", value: "" }, ...statusOptions]}
            width="100%"
          />

          <SingleSelectElement
            label="Priority"
            value={pendingPriority}
            onChange={setPendingPriority}
            options={[{ label: "All", value: "" }, ...priorityOptions]}
            width="100%"
          />

          <SingleSelectElement
            label="Category"
            value={pendingCategory}
            onChange={setPendingCategory}
            options={[{ label: "All", value: "" }, ...categoryOptions]}
            width="100%"
          />

          <Stack direction="row" spacing={2} flexWrap="wrap">
            <ToggleSwitch
              label="Assigned to me"
              checked={pendingAssignedToMe}
              size="small"
              onChange={(event) => {
                const checked = event.target.checked;
                setPendingAssignedToMe(checked);

                if (checked) {
                  setPendingMyTickets(false);
                  setPendingFollowingTickets(false);
                }
              }}
            />

            <ToggleSwitch
              label="My tickets"
              checked={pendingMyTickets}
              size="small"
              onChange={(event) => {
                const checked = event.target.checked;
                setPendingMyTickets(checked);

                if (checked) {
                  setPendingAssignedToMe(false);
                  setPendingFollowingTickets(false);
                }
              }}
            />

            <ToggleSwitch
              label="Following"
              checked={pendingFollowingTickets}
              size="small"
              onChange={(event) => {
                const checked = event.target.checked;
                setPendingFollowingTickets(checked);

                if (checked) {
                  setPendingAssignedToMe(false);
                  setPendingMyTickets(false);
                }
              }}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            {/* <PrimaryButton
              onClick={handleClearPendingFilters}
              sx={{ flex: 1 }}
            >
              Clear Filters
            </PrimaryButton> */}

            <PrimaryButton
              onClick={handleApplyFilters}
              sx={{ flex: 1 }}
            >
              Apply Filters
            </PrimaryButton>
          </Stack>
        </Stack>
      </ModalElement>

      <CreateTicketModal
        open={createModalOpen}
        ticket={editTicket}
        onClose={() => {
          setCreateModalOpen(false);
          setEditTicket(null);
        }}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      <CloseTicketModal
        open={closeModalOpen}
        ticketId={selectedTicket?.id ?? null}
        onClose={() => {
          setCloseModalOpen(false);
          setSelectedTicket(null);
        }}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      <ResolveTicketModal
        open={resolveModalOpen}
        ticketId={selectedTicket?.id ?? null}
        onClose={() => {
          setResolveModalOpen(false);
          setSelectedTicket(null);
        }}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      <AssignTicketModal
        open={assignModalOpen}
        ticketId={selectedTicket?.id ?? null}
        currentAssigneeId={selectedTicket?.assignee?.id}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedTicket(null);
        }}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      <ReopenTicketModal
        open={reopenModalOpen}
        ticketId={selectedTicket?.id ?? null}
        onClose={() => {
          setReopenModalOpen(false);
          setSelectedTicket(null);
        }}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      <MenuAtom
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onCloseAll={handleMenuClose}
        items={menuItems}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? This action cannot be undone."
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedTicket(null);
        }}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        confirmColor="error"
        disableConfirmButton={isDeleting}
      />

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          autoClose={4000}
        />
      )}
    </Box>
  );
}
