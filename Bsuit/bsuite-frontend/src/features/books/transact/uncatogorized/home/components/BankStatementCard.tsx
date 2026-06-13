import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
  useTheme,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import MergeIcon from "@mui/icons-material/Merge";
import SendIcon from "@mui/icons-material/Send";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import { useDeleteUncategorizedMutation } from "../api/uncategorized.api";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import MatchModal from "../../match/components/MatchModal";
import { TransferModal } from "../../transfer/components/TransferModal";
import AdvanceJournal from "../../../transactHome/components/dialogs/AdvanceJournal";
import {
  formatCurrencyByCommaSeparation,
  formatDateShort,
} from "../../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { Stack, useMediaQuery } from "@mui/system";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { renderDescription } from "../../../transactHome/utils/renderDescription";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
interface TransactionCardProps {
  isAllSelected?: boolean;
  isHighlighted?: boolean;
  id: number;
  accountName: string;
  accountCurrency?: string;
  date: string;
  description: string;
  credit: number;
  debit: number;
  currentAccountId?: number;
  showDeleteIcon?: boolean;
  onDeleteSuccess?: (message: string) => void;
  onDeleteError?: (message: string) => void;
  showSnackbar: (message: string, color: "success" | "error") => void;
  bulkToAccount?: string;
  setBulkToAccount?: (value: string) => void;
  bulkContact?: string;
  setBulkContact: (value: string) => void;
  bulkDescription?: string;
  setBulkDescription?: (value: string) => void;
  refetchTransactCount: () => void;

  contactOptions: {
    value: string;
    label: any;
  }[];

  allAccountOptions: {
    label: string;
    options: {
      label: string;
      value: string;
    }[];
  }[];
  taxesData: any;
}

export function TransactionCard({
  isAllSelected,
  isHighlighted = false,
  id,
  accountName,
  accountCurrency = "",
  date,
  description,
  credit,
  debit,
  currentAccountId,
  showDeleteIcon = false,
  onDeleteSuccess,
  onDeleteError,
  bulkToAccount,
  setBulkToAccount,
  bulkContact,
  setBulkContact,
  contactOptions,
  allAccountOptions,
  taxesData,
  bulkDescription,
  setBulkDescription,
  refetchTransactCount,
  showSnackbar,
}: TransactionCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* ---------------- state ---------------- */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<null | HTMLElement>(null);

  /* ---------------- data ---------------- */
  const moneyDirection = credit > 0 ? "out" : "in";
  const total = debit || credit;

  const { data: headerData } = useGetHeaderDataQuery();
  const [deleteUncategorized] = useDeleteUncategorizedMutation();

  /* ---------------- helpers ---------------- */
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";

  const extractCurrencySymbol = (currencyString: string) =>
    currencyString ? currencyString.split("-")[0].trim() : "";

  const currencySymbol = extractCurrencySymbol(accountCurrency);
  const formattedDate = formatDateShort(date);


  const filteredAccountOptions = useMemo(() => {
    return allAccountOptions
      .map((group) => {
        if (!group.options) return group;

        return {
          ...group,
          options: group.options.filter((opt) => {
            if (
              currentAccountId &&
              opt.value === `account_${currentAccountId}`
            ) {
              return false;
            }

            if (opt.value.startsWith("tax_")) {
              const taxId = Number(opt.value.split("_")[1]);
              const tax = taxesData?.data?.find((t: any) => t.id === taxId);
              return tax?.abbreviation?.toLowerCase() !== "tds";
            }

            return true;
          }),
        };
      })
      .filter((g) => !g.options || g.options.length > 0);
  }, [allAccountOptions, currentAccountId, taxesData]);

  /* ---------------- handlers ---------------- */
  const handleConfirmDelete = async () => {
    try {
      await deleteUncategorized([id]).unwrap();
      setDeleteConfirmOpen(false);
      onDeleteSuccess?.("Transaction deleted successfully");
    } catch {
      onDeleteError?.("Failed to delete transaction");
    }
  };

  const actions = [
    {
      id: "match",
      label: "Match",
      icon: MergeIcon,
      onClick: () => setIsMatchModalOpen(true),
    },
    {
      id: "transfer",
      label: "Transfer",
      icon: SendIcon,
      onClick: () => setIsTransferModalOpen(true),
    },
    {
      id: "journal",
      label: "Journal",
      icon: CallSplitIcon,
      onClick: () => setIsJournalModalOpen(true),
    },
  ];

  const open = Boolean(actionsAnchor);

  const handleOpenActions = (event: React.MouseEvent<HTMLElement>) => {
    setActionsAnchor(event.currentTarget);
  };

  const handleCloseActions = () => {
    setActionsAnchor(null);
  };

  /* ---------------- render ---------------- */
  return (
    <>
      <Card
        sx={{
          position: "relative",
          width: "100%",
          borderRadius: 1,
          transition: "background-color 0.4s ease-out",
          ...(isHighlighted && {
            backgroundColor: (theme.palette as { rowHighlight?: string }).rowHighlight ?? theme.palette.success?.light ?? "#b7f5cc",
          }),
          "&:hover": { boxShadow: theme.shadows[4] },
        }}
      >
        <CardContent
          sx={{
            p: 1,
            pl: 2,
            pr: 2,
            "&:last-child": { paddingBottom: 1 },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "120px 220px 160px 1fr",
              alignItems: "center",
              gap: 2,
              pl: 1,
              minHeight: 45,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ whiteSpace: "nowrap" }}
            >
              {formattedDate}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                {accountName}
              </Typography>
              {!isAllSelected && setBulkToAccount && (
                <Typography variant="caption" pt={0.4}>
                  {renderDescription(description, { variant: "caption" })}
                </Typography>
              )}
            </Box>

            {/* Money col — always column 3, never moves */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              {debit > 0 && (
                <Box display="flex" flexDirection="column" alignItems="flex-end">
                  <Typography variant="caption">Money Out</Typography>
                  <Typography variant="body2" fontWeight={600} color="error.main">
                    {formatCurrencyByCommaSeparation(
                      debit.toFixed(2),
                      commaSeparation,
                      currencySymbol,
                    )}
                  </Typography>
                </Box>
              )}
              {credit > 0 && (
                <Box display="flex" flexDirection="column" alignItems="flex-end">
                  <Typography variant="caption">Money In</Typography>
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    {formatCurrencyByCommaSeparation(
                      credit.toFixed(2),
                      commaSeparation,
                      currencySymbol,
                    )}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Right col — Description + To Account + Contact + Actions */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              {isAllSelected && setBulkToAccount && (
                <>
                  <Box sx={{ minWidth: 250 }}>
                    <TextFieldElement
                      label="Description"
                      value={bulkDescription ?? description}
                      sx={{ width: "100%" }}
                      onChange={(e) => setBulkDescription?.(e.target.value)}
                    />
                  </Box>

                  <Box sx={{ width: 220 }}>
                    <SingleSelectElement
                      label="To Account"
                      value={bulkToAccount ?? ""}
                      onChange={setBulkToAccount}
                      options={filteredAccountOptions}
                      required
                    />
                  </Box>

                  <Box sx={{ width: 220 }}>
                    <Tooltip
                      title={
                        !bulkToAccount
                          ? "Choose any account to select contact"
                          : "Contact already selected"
                      }
                      disableHoverListener={
                        !!bulkToAccount && bulkToAccount.startsWith("account_")
                      }
                      disableFocusListener={
                        !!bulkToAccount && bulkToAccount.startsWith("account_")
                      }
                      disableTouchListener={
                        !!bulkToAccount && bulkToAccount.startsWith("account_")
                      }
                    >
                      <SingleSelectElement
                        label="Contact"
                        value={bulkContact ?? ""}
                        onChange={setBulkContact}
                        options={contactOptions}
                        disabled={
                          !bulkToAccount ||
                          !bulkToAccount.startsWith("account_")
                        }
                      />
                    </Tooltip>
                  </Box>
                </>
              )}

              {/* Actions */}
              {!isMobile ? (
                !isAllSelected &&
                actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      onClick={action.onClick}
                      sx={{
                        gap: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        textTransform: "none",
                        minWidth: 120,
                        height: 40,
                      }}
                    >
                      <Icon fontSize="small" />
                      {action.label}
                    </Button>
                  );
                })
              ) : (
                <>
                  <Button onClick={handleOpenActions} sx={{ minWidth: 10 }}>
                    <MoreVertIcon />
                  </Button>

                  <Menu
                    anchorEl={actionsAnchor}
                    open={open}
                    onClose={handleCloseActions}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                  >
                    {actions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Stack key={action.id} gap={1} p={1}>
                          <Button
                            onClick={() => {
                              handleCloseActions();
                              action.onClick();
                            }}
                            sx={{
                              gap: 1,
                              border: `1px solid ${theme.palette.divider}`,
                              textTransform: "none",
                              minWidth: 120,
                              height: 40,
                            }}
                          >
                            <Icon fontSize="small" />
                            {action.label}
                          </Button>
                        </Stack>
                      );
                    })}
                  </Menu>
                </>
              )}

              {/* Delete / More */}
              <IconButton
                size="small"
                onClick={
                  showDeleteIcon
                    ? () => setDeleteConfirmOpen(true)
                    : (e) => setAnchorEl(e.currentTarget)
                }
              >
                {showDeleteIcon ? (
                  <DeleteIcon fontSize="small" color="error" />
                ) : (
                  <MoreVertIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* menus & dialogs */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setDeleteConfirmOpen(true);
            setAnchorEl(null);
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" color="error" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        confirmColor="error"
      />

      <MatchModal
        isOpen={isMatchModalOpen}
        onClose={() => {
          setIsMatchModalOpen(false);
        }}
        moneyDirection={moneyDirection}
        uncatId={id.toString()}
        accountCurrencyData={accountCurrency}
        total={total}
        description={description}
        showSnackbar={showSnackbar}
        refetchTransactCount={refetchTransactCount}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
        }}
        uncatId={[id]}
        moneyDirection={moneyDirection}
        accountCurrencyData={accountCurrency}
        currentAccountId={currentAccountId}
        total={total}
        description={description}
        refetchTransactCount={refetchTransactCount}
        showSnackbar={showSnackbar}
      />

      <ModalElement
        open={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        title="Add Journal"
        maxWidth="lg"
      >
        <AdvanceJournal
          unCatData={{
            title: "Actions",
            uncatId: id,
            currentAccountId: currentAccountId ?? 0,
            total,
            moneyDirection,
            accountCurrencyData: accountCurrency,
            description,
            debit,
            credit,
          }}
          showSnackBar={showSnackbar}
          onSuccess={() => {
            setIsJournalModalOpen(false);
          }}
          refetchTransactCount={refetchTransactCount}
        />
      </ModalElement>
    </>
  );
}