import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PrimaryButton, PrimaryIconButton } from "../../../../../../components/atom/button";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import {
  useGetTicketByIdQuery,
  useHoldTicketMutation,
  useResumeTicketMutation,
  useAcceptTicketMutation,
  useMoveInProgressMutation,
  useUpdateTicketPriorityMutation,
  useFollowTicketMutation,
  useUnfollowTicketMutation,
  useRemoveFollowerMutation,
  useSetTicketConfidentialMutation,
} from "../../api/ticket.api";
import { useGetAllPrioritiesQuery } from "../../api/category.api";
import { useGetEmployeeInfoQuery } from "../../../../api/people.api";
import AssignTicketModal from "../components/AssignTicketModal";
import CloseTicketModal from "../components/CloseTicketModal";
import ReopenTicketModal from "../components/ReopenTicketModal";
import ResolveTicketModal from "../components/ResolveTicketModal";
import RejectCancelTicketModal from "../components/RejectCancelTicketModal";
import RejectReassignTicketModal from "../components/RejectReassignTicketModal";
import {
  formatDateTime,
  getBackendMessage,
  getPersonDisplayName,
  getTicketSla,
} from "../../common/utils/helpdeskUtils";
import {
  TicketChatPanel,
  buildParticipants,
} from "../../chat";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} py={0.75}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = Number(id);

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [rejectCancelModalOpen, setRejectCancelModalOpen] = useState(false);
  const [rejectReassignModalOpen, setRejectReassignModalOpen] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const { data, isLoading, isError } = useGetTicketByIdQuery(ticketId, {
    skip: !ticketId || Number.isNaN(ticketId),
  });

  const { data: employeeInfo } = useGetEmployeeInfoQuery();
  const { data: prioritiesData } = useGetAllPrioritiesQuery();

  const [holdTicket, { isLoading: isHolding }] = useHoldTicketMutation();
  const [resumeTicket, { isLoading: isResuming }] = useResumeTicketMutation();
  const [acceptTicket, { isLoading: isAccepting }] = useAcceptTicketMutation();
  const [moveInProgress, { isLoading: isMovingInProgress }] = useMoveInProgressMutation();
  const [updateTicketPriority, { isLoading: isUpdatingPriority }] = useUpdateTicketPriorityMutation();
  const [followTicket, { isLoading: isFollowingTicket }] = useFollowTicketMutation();
  const [unfollowTicket, { isLoading: isUnfollowingTicket }] = useUnfollowTicketMutation();
  const [removeFollower, { isLoading: isRemovingFollower }] = useRemoveFollowerMutation();
  const [setConfidential, { isLoading: isUpdatingConfidential }] = useSetTicketConfidentialMutation();

  const ticket = data?.data;
  const statusSlug = ticket?.status?.slug?.toLowerCase() ?? "";
  const sla = ticket ? getTicketSla(ticket) : null;
  const chatParticipants = useMemo(
    () => (ticket ? buildParticipants(ticket) : []),
    [ticket],
  );

  const employeeId = employeeInfo?.data?.employeeId ?? null;
  const isAgent = employeeInfo?.data?.isAdmin === true || employeeInfo?.data?.isEmployee !== true;
  const isAssignee = ticket?.assignee?.id === employeeId;
  const isFollowing = ticket?.followers?.some((f) => f.id === employeeId) ?? false;

  const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const runLifecycleAction = async (
    action: () => Promise<{ message?: string }>,
    successMessage: string,
    errorMessage: string,
  ) => {
    try {
      const response = await action();
      showSnackbar(response.message ?? successMessage, "success");
    } catch (error) {
      showSnackbar(getBackendMessage(error, errorMessage), "error");
    }
  };

  const handlePriorityChange = async (newPriorityId: string) => {
    if (!ticket) return;
    try {
      await updateTicketPriority({
        id: ticket.id,
        body: { priorityId: Number(newPriorityId) },
      }).unwrap();
      showSnackbar("Ticket priority updated and SLA recalculated", "success");
    } catch (error) {
      showSnackbar(getBackendMessage(error, "Failed to update priority"), "error");
    }
  };

  const handleFollowToggle = async () => {
    if (!ticket) return;
    try {
      if (isFollowing) {
        await unfollowTicket(ticket.id).unwrap();
        showSnackbar("Stopped following this ticket", "success");
      } else {
        await followTicket(ticket.id).unwrap();
        showSnackbar("You are now following this ticket", "success");
      }
    } catch (error) {
      showSnackbar(getBackendMessage(error, "Failed to toggle follow status"), "error");
    }
  };

  const handleRemoveFollower = async (empId: number) => {
    if (!ticket) return;
    try {
      await removeFollower({ id: ticket.id, employeeId: empId }).unwrap();
      showSnackbar("Follower removed", "success");
    } catch (error) {
      showSnackbar(getBackendMessage(error, "Failed to remove follower"), "error");
    }
  };

  const handleConfidentialToggle = async () => {
    if (!ticket) return;
    try {
      await setConfidential({
        id: ticket.id,
        body: { isConfidential: !ticket.isConfidential },
      }).unwrap();
      showSnackbar(`Ticket is now ${!ticket.isConfidential ? "Confidential" : "Public"}`, "success");
    } catch (error) {
      showSnackbar(getBackendMessage(error, "Failed to toggle confidentiality"), "error");
    }
  };

  const actionButtons = useMemo(() => {
    if (!ticket) return null;

    const buttons: ReactNode[] = [];

    if ((statusSlug === "new" || statusSlug === "") && isAgent) {
      buttons.push(
        <PrimaryButton
          key="accept"
          disabled={isAccepting}
          onClick={() =>
            runLifecycleAction(
              () => acceptTicket(ticket.id).unwrap(),
              "Ticket accepted successfully",
              "Failed to accept ticket",
            )
          }
        >
          Accept Ticket
        </PrimaryButton>
      );
    }

    if (isAssignee && statusSlug !== "closed" && statusSlug !== "resolved") {
      buttons.push(
        <PrimaryButton
          key="reject-cancel"
          variant="outlined"
          color="error"
          onClick={() => setRejectCancelModalOpen(true)}
        >
          Reject & Cancel
        </PrimaryButton>,
        <PrimaryButton
          key="reject-reassign"
          variant="outlined"
          color="warning"
          onClick={() => setRejectReassignModalOpen(true)}
        >
          Reject & Reassign
        </PrimaryButton>
      );
    }

    if (statusSlug === "open") {
      buttons.push(
        <PrimaryButton
          key="in-progress"
          disabled={isMovingInProgress}
          onClick={() =>
            runLifecycleAction(
              () => moveInProgress(ticket.id).unwrap(),
              "Ticket moved to In Progress",
              "Failed to move ticket to In Progress",
            )
          }
        >
          Start Work
        </PrimaryButton>
      );
    }

    if (statusSlug === "open" || statusSlug === "assigned" || statusSlug === "in_progress") {
      buttons.push(
        <PrimaryButton
          key="hold"
          variant="outlined"
          disabled={isHolding}
          onClick={() =>
            runLifecycleAction(
              () => holdTicket(ticket.id).unwrap(),
              "Ticket placed on hold",
              "Failed to hold ticket",
            )
          }
        >
          Hold
        </PrimaryButton>,
        <PrimaryButton
          key="resolve"
          variant="outlined"
          onClick={() => setResolveModalOpen(true)}
        >
          Resolve
        </PrimaryButton>,
        <PrimaryButton
          key="close"
          variant="outlined"
          onClick={() => setCloseModalOpen(true)}
        >
          Close
        </PrimaryButton>,
      );
    }

    if (statusSlug === "on_hold") {
      buttons.push(
        <PrimaryButton
          key="resume"
          disabled={isResuming}
          onClick={() =>
            runLifecycleAction(
              () => resumeTicket(ticket.id).unwrap(),
              "Ticket resumed",
              "Failed to resume ticket",
            )
          }
        >
          Resume
        </PrimaryButton>,
      );
    }

    if (statusSlug === "closed" || statusSlug === "resolved") {
      buttons.push(
        <PrimaryButton key="reopen" onClick={() => setReopenModalOpen(true)}>
          Reopen
        </PrimaryButton>,
      );
    }

    if (isAgent) {
      buttons.push(
        <PrimaryButton
          key="assign"
          variant="outlined"
          onClick={() => setAssignModalOpen(true)}
        >
          Assign
        </PrimaryButton>
      );
    }

    return buttons;
  }, [
    ticket,
    statusSlug,
    isHolding,
    isResuming,
    holdTicket,
    resumeTicket,
    isAgent,
    isAssignee,
    isAccepting,
    acceptTicket,
    isMovingInProgress,
    moveInProgress,
  ]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={320}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !ticket) {
    return (
      <Box p={3}>
        <PrimaryIconButton
          icon={<ArrowBackIcon />}
          variant="outlined"
          onClick={() => navigate(-1)}
        />
        <Typography color="error" mt={2}>
          Unable to load ticket details.
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <PrimaryIconButton
          icon={<ArrowBackIcon />}
          variant="outlined"
          onClick={() => navigate("/people/home?tab=4&mainTab=4")}
        />
        <Typography variant="h6">
          {ticket.ticketNumber} — {ticket.subject}
        </Typography>
        {isAgent ? (
          <Chip
            size="small"
            label={ticket.isConfidential ? "Confidential" : "Public"}
            color={ticket.isConfidential ? "warning" : "default"}
            onClick={handleConfidentialToggle}
            disabled={isUpdatingConfidential}
            sx={{ cursor: "pointer" }}
          />
        ) : (
          ticket.isConfidential && (
            <Chip size="small" label="Confidential" color="warning" />
          )
        )}
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={3} alignItems="flex-start">
        <Paper sx={{ p: 2, flex: 2, width: "100%" }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            Ticket Information
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <DetailRow label="Ticket Number" value={ticket.ticketNumber} />
          <DetailRow label="Subject" value={ticket.subject} />
          <DetailRow label="Description" value={ticket.description || "—"} />
          <DetailRow label="Requester" value={getPersonDisplayName(ticket.requester)} />
          <DetailRow label="Assignee" value={getPersonDisplayName(ticket.assignee)} />
          <DetailRow label="Category" value={ticket.category?.categoryName ?? "—"} />

          {isAgent ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} py={0.75} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
                Priority
              </Typography>
              <SingleSelectElement
                label=""
                value={ticket.priority?.id ? String(ticket.priority.id) : ""}
                onChange={handlePriorityChange}
                options={
                  prioritiesData?.data?.map((p) => ({
                    label: p.name,
                    value: String(p.id),
                  })) ?? []
                }
                disabled={isUpdatingPriority}
                sx={{ minWidth: 160 }}
              />
            </Stack>
          ) : (
            <DetailRow label="Priority" value={ticket.priority?.name ?? "—"} />
          )}

          <DetailRow label="Status" value={ticket.status?.name ?? "—"} />
          <DetailRow label="Created Date" value={formatDateTime(ticket.createdAt)} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} py={0.75} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
              Followers
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} alignItems="center">
              {ticket.followers && ticket.followers.length > 0 ? (
                ticket.followers.map((follower) => (
                  <Chip
                    key={follower.id}
                    size="small"
                    label={getPersonDisplayName(follower)}
                    onDelete={
                      isAgent && follower.id !== employeeId
                        ? () => handleRemoveFollower(follower.id!)
                        : undefined
                    }
                    disabled={isRemovingFollower}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  No followers
                </Typography>
              )}
              {employeeId && (
                <PrimaryButton
                  size="small"
                  variant="text"
                  onClick={handleFollowToggle}
                  disabled={isFollowingTicket || isUnfollowingTicket}
                  sx={{ ml: 1, py: 0.25, minWidth: 0 }}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </PrimaryButton>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Stack spacing={2} flex={1} width="100%">
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              SLA Summary
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <DetailRow
              label="Response due"
              value={formatDateTime(sla?.responseDueAt)}
            />
            <DetailRow
              label="Resolution due"
              value={formatDateTime(sla?.resolutionDueAt)}
            />
            <Stack direction="row" spacing={1} mt={1}>
              <Chip
                size="small"
                label={`Response breached: ${sla?.responseBreached ? "Yes" : "No"}`}
                color={sla?.responseBreached ? "error" : "default"}
              />
              <Chip
                size="small"
                label={`Resolution breached: ${sla?.resolutionBreached ? "Yes" : "No"}`}
                color={sla?.resolutionBreached ? "error" : "default"}
              />
            </Stack>
            {!sla && (
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                SLA details will appear here when available from ticket SLA integration.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {actionButtons}
            </Stack>
          </Paper>
        </Stack>
      </Stack>

      <Box mt={3}>
        <TicketChatPanel
          key={`${ticket.id}-${ticket.status?.slug}-${ticket.updatedAt}`}
          ticketId={ticket.id}
          ticketNumber={ticket.ticketNumber}
          participants={chatParticipants}
          title="Ticket conversation"
          minHeight={480}
        />
      </Box>

      <CloseTicketModal
        open={closeModalOpen}
        ticketId={ticket.id}
        onClose={() => setCloseModalOpen(false)}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      <ResolveTicketModal
        open={resolveModalOpen}
        ticketId={ticket.id}
        onClose={() => setResolveModalOpen(false)}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      <AssignTicketModal
        open={assignModalOpen}
        ticketId={ticket.id}
        currentAssigneeId={ticket.assignee?.id}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      <ReopenTicketModal
        open={reopenModalOpen}
        ticketId={ticket.id}
        onClose={() => setReopenModalOpen(false)}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      <RejectCancelTicketModal
        open={rejectCancelModalOpen}
        ticketId={ticket.id}
        onClose={() => setRejectCancelModalOpen(false)}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      <RejectReassignTicketModal
        open={rejectReassignModalOpen}
        ticketId={ticket.id}
        onClose={() => setRejectReassignModalOpen(false)}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
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
