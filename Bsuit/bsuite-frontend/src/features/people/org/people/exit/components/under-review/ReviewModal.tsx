import { useState } from "react";
import { Box, Divider, Typography, CircularProgress, Stack } from "@mui/material";
import { ModalElement } from "../../../../../../../components/dialogs/modal-element";
import { ExitDetailsCard } from "../ExitDetailsCard";
import {
  useGetExitRequestQuery,
  useReviewExitMutation,
} from "../../api/exit.api";
import { CheckCircleOutline, CancelOutlined } from "@mui/icons-material";
import { Chip } from "../../../../../../../components/atom/chips";
import { PrimaryButton } from "../../../../../../../components/atom/button";
import { Snackbar } from "../../../../../../../components/atom/snackbar";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  exitId?: number | null;
}

export const ReviewModal = ({ open, onClose, exitId }: ReviewModalProps) => {
  const [reviewExit, { isLoading: isReviewing }] = useReviewExitMutation();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; color: string }>({
    open: false,
    message: "",
    color: "",
  });

  const { data: exitRequest, isFetching } = useGetExitRequestQuery(exitId ?? undefined, {
    skip: !exitId || !open,
  });

  const { exit, approvedByAdmin } = exitRequest ?? {};

  const handleReview = async (status: "approved" | "rejected") => {
    if (!exitId) return;
    try {
      await reviewExit({ exitId, body: { status } }).unwrap();
      setSnackbar({
        open: true,
        message: "Review successful",
        color: "success"
      })
      onClose();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.data?.message || "Review failed",
        color: "error"
      })
    }
  };

  return (
    <>
      <ModalElement
        open={open}
        title="Resignation review"
        onClose={onClose}
        maxWidth="md"
        hideCloseButton={false}
        leftHeaderAction={exit && (
          <Chip
            label={`${exit.status.charAt(0).toUpperCase() + exit.status.slice(1)}`}
            color="warning"
            size="small"
            sx={{ fontWeight: 500 }}
          />
        )}
        sx={{
          height: 600,
          "& .MuiDialog-paper": {
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          {isFetching ? (
            <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
              <CircularProgress size={28} />
            </Box>
          ) : !exit ? (
            <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
              <Typography variant="body2" color="text.secondary">
                No data available.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Stack spacing={2}>
                <ExitDetailsCard ExitData={exit} />

                {/* Status section */}
                <Box padding={1}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    color="textSecondary"
                    mb={1}
                  >
                    Status
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor:
                          exit.status === "approved"
                            ? "success.main"
                            : exit.status === "pending"
                              ? "warning.main"
                              : "info.main",
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {exit.status === "pending"
                        ? `Review pending on ${exit.employee.contact?.name ||
                        exit.employee.employeeId ||
                        "-"
                        }`
                        : exit.status === "approved"
                          ? "Approved"
                          : "Exited"}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          )}
        </Box>

        {exit?.status === "pending" && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
            <PrimaryButton
              variant="outlined"
              color="error"
              startIcon={isReviewing ? <CircularProgress size={14} /> : <CancelOutlined />}
              disabled={isReviewing}
              onClick={() => handleReview("rejected")}
            >
              Reject
            </PrimaryButton>

            <PrimaryButton
              variant="contained"
              color="primary"
              startIcon={
                isReviewing ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <CheckCircleOutline />
                )
              }
              disabled={isReviewing}
              onClick={() => handleReview("approved")}
            >
              Approve
            </PrimaryButton>
          </Box>
        )}
      </ModalElement>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color as any}
          onClose={() => setSnackbar({ open: false, message: "", color: "" })}
        />
      )}
    </>
  );
};