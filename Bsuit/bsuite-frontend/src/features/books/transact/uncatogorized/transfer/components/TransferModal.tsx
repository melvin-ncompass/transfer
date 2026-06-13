import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../../../components/atom/button/PrimaryButton";
import { RepeaterElement } from "../../../../../../components/atom/form-repeater/FormRepeater";
import { FileUploadField } from "../../../../../../components/atom/file-upload-field";
import { useAllAccountOptions } from "../../../transactHome/hooks/useAllAccountOptions";
import { useUploadAttachmentsMutation } from "../../../transactHome/api/transact.api";
import { useSaveTransferMutation } from "../api/transfer.api";
import { Chip } from "../../../../../../components/atom/chips";
import { useNavigate } from "react-router-dom";
interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  uncatId: number[];
  moneyDirection?: "in" | "out";
  accountCurrencyData?: string;
  currentAccountId?: number;
  total?: number;
  description?: string;
  refetchTransactCount?: () => void;
  showSnackbar?: (message: string, color: "success" | "error") => void;
}
type ContactMappingMap = Record<number, string>;
export type AccountType = "account" | "contact" | "tax";

export function TransferModal({
  isOpen,
  onClose,
  uncatId,
  currentAccountId,
  total,
  showSnackbar,
  moneyDirection,
  accountCurrencyData,
  description,
  refetchTransactCount,
}: TransferModalProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isBulk = uncatId.length > 1;
  /* ----------------------- STATE ----------------------- */
  const [toAccount, setToAccount] = useState("");
  const [contact, setContact] = useState("");
  const [transferDescription, setTransferDescription] = useState(description);
  const [tdsItems, setTdsItems] = useState<
    Array<{ contactId: string; amount: string }>
  >([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  // BULK
  const [bulkToAccounts, setBulkToAccounts] = useState<Record<number, string>>(
    {},
  );
  const [bulkContacts, setBulkContacts] = useState<Record<number, string>>({});

  const [saveTransfer, { isLoading: isSaving }] = useSaveTransferMutation();
  const [uploadAttachments, { isLoading: isUploadingAttachments }] =
    useUploadAttachmentsMutation();

  const { allAccountOptions, taxesData } = useAllAccountOptions(
    null,
    true,
    "allow_misc"
  );
  const { contactsData } = useAllAccountOptions();

  /* ----------------------- OPTIONS ----------------------- */

  const contactOptions = useMemo(
    () =>
      (contactsData?.data || []).map((c: any) => ({
        value: `contact_${c.id}`,
        label: c.name,
      })),
    [contactsData],
  );
  const accountCurrency = accountCurrencyData?.split(" - ")[1] ?? "";
  const currencySymbol = accountCurrencyData?.split(" - ")[0] ?? "";
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

            if (isBulk && opt.value.startsWith("tax_")) {
              const taxId = Number(opt.value.split("_")[1]);
              const tax = taxesData?.data?.find((t: any) => t.id === taxId);
              return tax?.abbreviation?.toLowerCase() !== "tds";
            }

            return true;
          }),
        };
      })
      .filter((g) => !g.options || g.options.length > 0);
  }, [allAccountOptions, currentAccountId, isBulk, taxesData]);

  /* ----------------------- DERIVED (SINGLE) ----------------------- */

  const selectedAccountType = useMemo(() => {
    if (!toAccount) return null;
    return toAccount.split("_")[0] as AccountType;
  }, [toAccount]);

  const selectedTaxAbbreviation = useMemo(() => {
    if (selectedAccountType !== "tax") return null;
    const taxId = Number(toAccount.split("_")[1]);
    return (
      taxesData?.data
        ?.find((t: any) => t.id === taxId)
        ?.abbreviation?.toLowerCase() ?? null
    );
  }, [toAccount, selectedAccountType, taxesData]);

  const isTds =
    selectedAccountType === "tax" && selectedTaxAbbreviation === "tds";

  /* ----------------------- TDS VALIDATION ----------------------- */

  const tdsTotal = useMemo(
    () =>
      Math.round(
        tdsItems.reduce((sum, i) => sum + (parseFloat(i.amount.replace(/,/g, "")) || 0), 0) * 100
      ) / 100,
    [tdsItems],
  );

  const hasRowErrors = useMemo(
    () =>
      tdsItems.some(
        (i) => (!!i.contactId && !i.amount) || (!i.contactId && !!i.amount),
      ),
    [tdsItems],
  );

  const isTdsTotalValid = !isTds || !total || tdsTotal === Math.round(total * 100) / 100;

  /* ----------------------- EFFECTS ----------------------- */

  useEffect(() => {
    if (isOpen && isBulk) {
      setBulkToAccounts(Object.fromEntries(uncatId.map((id) => [id, ""])));
      setBulkContacts(Object.fromEntries(uncatId.map((id) => [id, ""])));
    }
  }, [isOpen, isBulk, uncatId]);

  useEffect(() => {
    if (!isOpen) {
      setToAccount("");
      setContact("");
      setTdsItems([]);
      setAttachments([]);
    }
  }, [isOpen]);

  const handleFileChange = (files: File | File[] | null) => {
    if (!files) {
      setAttachments([]);
      return;
    }

    setAttachments(Array.isArray(files) ? files : [files]);
  };

  const handleDeleteAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  /* ----------------------- SAVE ----------------------- */

  const handleSave = async () => {
    try {
      if (!toAccount) {
        showSnackbar?.("Please select To Account.", "error");
        return;
      }

      if (isTds) {
        if (!tdsItems.length || hasRowErrors || !isTdsTotalValid) {
          showSnackbar?.("Please complete valid TDS mapping.", "error");
          return;
        }
      }

      const toAccountId = Number(toAccount.split("_")[1]);
      const toAccountType = toAccount.split("_")[0] as AccountType;

      let contactMappingData: ContactMappingMap | undefined;

      if (isTds) {
        contactMappingData = Object.fromEntries(
          tdsItems.map((i) => [Number(i.contactId.split("_")[1]), i.amount]),
        );
      }

      const response = await saveTransfer({
        uncatId: uncatId[0],
        toAccountId,
        toAccountType,
        contactId:
          selectedAccountType === "account" && contact
            ? Number(contact.split("_")[1])
            : undefined,
        hasTdsMapping: isTds,
        description: transferDescription,
        contactMappingData,
      }).unwrap();

      const transactionId = String(response.data?.transactionTypeId || "");
      const transactionType = response.data?.transactionTypeName || "transfer";
      const paymentId = response.data?.payment_id || undefined;

      const afterSave = () => {
        showSnackbar?.("Transfer saved successfully.", "success");
        navigate(
          `/books/transact/home?tab=transact&highlightId=${transactionId}&transactionType=${transactionType}`,
        );
        refetchTransactCount?.();
        onClose();
      };

      if (attachments.length > 0) {
        uploadAttachments({
          files: attachments,
          transactionTypeId: transactionId,
          transactionTypeName: transactionType,
          paymentId,
        })
          .unwrap()
          .finally(afterSave);
      } else {
        afterSave();
      }
    } catch (err: any) {
      showSnackbar?.(err?.data?.message || "Failed to save transfer.", "error");
    }
  };
  /* ----------------------- UI ----------------------- */
  return (
    <>
      <ModalElement
        open={isOpen}
        onClose={onClose}
        title={isBulk ? `Bulk Transfer (${uncatId.length})` : "Transfer"}
        maxWidth={isBulk ? "lg" : "sm"}
        draggable
        leftHeaderAction={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: 'center',
              px: 1,
              py: 0.5,
              gap: 0.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              boxShadow: theme.shadows[1],
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {total?.toLocaleString("en-US", {
                style: "currency",
                currency: accountCurrency,
              })}
            </Typography>
            <Chip
              label={`Money ${moneyDirection === "out" ? "in" : "out"}`}
              size="xs"
              color={moneyDirection === "out" ? "success" : "error"}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextFieldElement
            label="Description"
            value={transferDescription}
            width='100%'
            onChange={(e) => setTransferDescription(e.target.value)}
          />

          <SingleSelectElement
            label="Account"
            value={toAccount}
            onChange={setToAccount}
            options={filteredAccountOptions}
            required
            fullWidth
          />

          {selectedAccountType === "account" && (
            <SingleSelectElement
              label="Contact (Optional)"
              value={contact}
              onChange={setContact}
              options={contactOptions}
              fullWidth
            />
          )}

          {isTds && (
            <RepeaterElement
              label="Contact Mapping"
              items={tdsItems}
              setItems={setTdsItems}
              initialItem={{ contactId: "", amount: "" }}
              renderItem={(item, _, onChange) => (
                <Box sx={{ display: "flex", width: "100%", gap: 2 }}>
                  <SingleSelectElement
                    label="Contact"
                    value={item.contactId}
                    onChange={(v) => onChange("contactId", v)}
                    options={contactOptions}
                    required
                    // fullWidth
                    sx={{ flex: 1 }}
                  />
                  <TextFieldElement
                    label="Amount"
                    value={item.amount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (!isNaN(Number(raw))) onChange("amount", raw);
                    }}
                    onBlur={() => {
                      const num = parseFloat(item.amount);
                      if (!isNaN(num)) onChange("amount", num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                    }}
                    type="text"
                    required
                    sx={{ flex: 1 }}
                    slotProps={{
                      htmlInput: { style: { textAlign: 'right' } },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {currencySymbol}
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
              )}
            />
          )}

          {/* <Divider /> */}

          <Stack spacing={2}>
            <FileUploadField
              label="Attachments"
              value={attachments}
              maxFiles={10}
              maxSize={5}
              accept={[
                "image/jpeg",
                "image/png",
                "image/webp",
                "application/pdf",
              ]}
              onChange={handleFileChange}
            />

            {attachments.length > 0 && (
              <Stack spacing={1}>
                {attachments.map((file, index) => (
                  <Stack
                    key={`${file.name}-${index}`}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">{file.name}</Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteAttachment(index)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>

          <Tooltip title={toAccount?.length < 1 ? "Select to Account" : !isBulk && isTds && (!isTdsTotalValid || hasRowErrors) ? "Transfer amount should match" : ""}>
            <Box sx={{ width: 120, alignSelf: "flex-end" }}>
              <PrimaryButton
                onClick={handleSave}
                disabled={
                  isSaving ||
                  isUploadingAttachments ||
                  toAccount?.length < 1 ||
                  (!isBulk && isTds && (!isTdsTotalValid || hasRowErrors))
                }
                sx={{ width: 120, alignSelf: "flex-end" }}
              >
                {isSaving || isUploadingAttachments ? "Saving..." : "Save"}
              </PrimaryButton>
            </Box>
          </Tooltip>
        </Box>
      </ModalElement>
    </>
  );
}
