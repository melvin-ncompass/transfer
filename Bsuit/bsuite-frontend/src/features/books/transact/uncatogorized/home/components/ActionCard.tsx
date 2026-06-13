import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Button,
  Box,
  Typography,
  useTheme,
} from "@mui/material";
import MergeIcon from "@mui/icons-material/Merge";
import SendIcon from "@mui/icons-material/Send";
import MatchModal from "../../match/components/MatchModal";
import { TransferModal } from "../../transfer/components/TransferModal";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import { color } from "framer-motion";
import AdvanceJournal from "../../../transactHome/components/dialogs/AdvanceJournal";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { Snackbar } from "../../../../../../components/atom/snackbar";
interface ActionCardProps {
  title: string;
  uncatId: number;
  currentAccountId?: number;
  total?: number;
  moneyDirection?: "in" | "out";
  accountCurrencyData?: string;
  description: string;
  debit: string;
  credit: string;
}

export function ActionCard({
  title,
  uncatId,
  currentAccountId,
  total,
  moneyDirection,
  accountCurrencyData,
  description,
  debit,
  credit,
}: ActionCardProps) {
  const theme = useTheme();
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [moneyDirectionState] = useState(moneyDirection);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnackBar = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const actions = [
    {
      id: "match",
      label: "Match",
      icon: MergeIcon,
      color: "primary",
      onClick: () => setIsMatchModalOpen(true),
    },
    {
      id: "transfer",
      label: "Transfer",
      icon: SendIcon,
      color: "secondary",
      onClick: () => setIsTransferModalOpen(true),
    },
    {
      id: "journal",
      label: "Journal",
      icon: CallSplitIcon,
      color: "secondary",
      onClick: () => setIsJournalModalOpen(true),
    },
  ];
  const unCatJounralData = {
    title,
    uncatId,
    currentAccountId: currentAccountId ?? 0, // default to 0 if undefined
    total: total ?? 0, // default to 0 if undefined
    moneyDirection,
    accountCurrencyData: accountCurrencyData ?? "",
    description,
    debit,
    credit,
  };

  useEffect(() => {
    console.log({
      data: {
        title: title,
        uncatId,
        currentAccountId,
        total,
        moneyDirection,
        accountCurrencyData,
      },
    });
  }, [
    title,
    uncatId,
    currentAccountId,
    total,
    moneyDirection,
    accountCurrencyData,
  ]);
  return (
    <>
      <Card
        sx={{
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[1],
          "&:hover": {
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: theme.palette.text.primary,
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mb: 3,
            }}
          >
            Choose an action:
          </Typography>

          {/* Action Buttons */}
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1.5 }}>
            {actions.map((action) => {
              const IconComponent = action.icon;
              const isSecondary = action.color === "secondary";

              return (
                <Button
                  key={action.id}
                  onClick={action.onClick}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    flex: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    backgroundColor: "transparent",
                    color: theme.palette.text.primary,
                    textTransform: "none",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    justifyContent: "flex-start",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: isSecondary
                        ? theme.palette.secondary.light
                        : theme.palette.primary.light,
                      "& .action-icon": {
                        backgroundColor: isSecondary
                          ? theme.palette.secondary.main
                          : theme.palette.primary.main,
                        color: "#fff",
                      },
                    },
                  }}
                >
                  {/* Icon Container */}
                  <Box
                    className="action-icon"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: isSecondary
                        ? theme.palette.secondary.light
                        : theme.palette.primary.light,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease-in-out",
                      color: isSecondary
                        ? theme.palette.secondary.main
                        : theme.palette.primary.main,
                    }}
                  >
                    <IconComponent sx={{ fontSize: "1.25rem" }} />
                  </Box>

                  {/* Label */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.875rem",
                      color: theme.palette.text.primary,
                      fontWeight: 500,
                      flex: 1,
                      textAlign: "left",
                    }}
                  >
                    {action.label}
                  </Typography>
                </Button>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      <MatchModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        moneyDirection={moneyDirectionState}
        uncatId={uncatId.toString()}
        accountCurrencyData={accountCurrencyData}
        total={total}
        showSnackbar={showSnackBar}
      />
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        uncatId={[uncatId]}
        currentAccountId={currentAccountId}
        total={total}
      />

      <ModalElement
        open={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        maxWidth="md"
        title="Add Journal"
      >
        <AdvanceJournal
          onSuccess={() => {
            setIsJournalModalOpen(false);
          }}
          unCatData={unCatJounralData}
          showSnackBar = {showSnackBar}
        />
      </ModalElement>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </>
  );
}
