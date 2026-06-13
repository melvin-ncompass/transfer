import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import dayjs, { type Dayjs } from "dayjs";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import { TextFieldElement } from "../../../../../components/atom/text-field/TextField";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { DatePickerElement } from "../../../../../components/atom/date-picker/DatePicker";
import { PrimaryButton, SecondaryButton } from "../../../../../components/atom/button";
import { useGetExpenseCategoriesQuery } from "../../../org/expense/category/api/expenseCategory.api";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import { useGetEmployeeInfoQuery } from "../../../api/people.api";
import { useGetEmployeeQuery } from "../../../org/people/directory/api/directory.api";
import {
  useCreateExpenseClaimMutation,
  useUpdateExpenseClaimMutation,
  type ExpenseClaimResponse,
  type ExpenseClaimAttachment,
} from "../api/expenseClaim.api";

const inrAmountFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Strip invalid chars; single `.`; max 2 decimal places. */
function sanitizeAmountInput(raw: string): string {
  const s = raw.replace(/,/g, "");
  let out = "";
  let seenDot = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c >= "0" && c <= "9") out += c;
    else if (c === "." && !seenDot) {
      out += ".";
      seenDot = true;
    }
  }
  const dot = out.indexOf(".");
  if (dot === -1) return out;
  return out.slice(0, dot + 1) + out.slice(dot + 1).replace(/\./g, "").slice(0, 2);
}

/** Formatted with grouping commas when field is not focused. */
function formatAmountDisplayBlurred(clean: string): string {
  if (!clean) return "";
  if (clean === ".") return "0.";
  if (clean.endsWith(".")) {
    const intOnly = clean.slice(0, -1);
    if (intOnly === "") return "0.";
    const n = Number(intOnly);
    if (!Number.isFinite(n)) return clean;
    return `${inrAmountFormatter.format(n)}.`;
  }
  const n = Number(clean);
  if (!Number.isFinite(n)) return clean;
  return inrAmountFormatter.format(n);
}

const getAttachmentName = (item: ExpenseClaimAttachment | any): string => {
  if (!item) return "attachment";
  if (typeof item === "string") return item.split("/").pop() ?? item;
  // Backend returns { filename, path } objects
  if (item.filename) return item.filename;
  if (item.path) return item.path.split("/").pop() ?? item.path;
  if (item.name) return item.name;
  return "attachment";
};

interface ClaimExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (isSubmit: boolean) => void;
  onError?: (message: string) => void;
  draftData?: ExpenseClaimResponse | null;
}

export function ClaimExpenseModal({
  open,
  onClose,
  onSuccess,
  onError,
  draftData,
}: ClaimExpenseModalProps) {
  const isEditMode = !!draftData;

  const [expenseDate, setExpenseDate] = useState<Dayjs | null>(dayjs());
  const [categoryId, setCategoryId] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  // Existing attachments from backend — { filename, path } objects
  const [existingAttachments, setExistingAttachments] = useState<ExpenseClaimAttachment[]>([]);
  // Newly picked files (not yet uploaded)
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [amountFocused, setAmountFocused] = useState(false);

  const { data: categories } = useGetExpenseCategoriesQuery();
  const { data: headerData } = useGetHeaderDataQuery();
  const currency = headerData?.data?.reportingCurrency?.split(" - ")[0] ?? "₹";

  // Resolve current employee's expense policy to filter categories
  const { data: employeeInfo } = useGetEmployeeInfoQuery();
  const numericId = Number(employeeInfo?.data?.employeeId);
  const { data: employeeData } = useGetEmployeeQuery(numericId, {
    skip: !numericId || isNaN(numericId),
  });
  const expensePolicyId =
    employeeData?.data?.expensePolicyId ?? employeeData?.data?.expensePolicy?.id;
  const [createExpenseClaim, { isLoading: isCreating }] = useCreateExpenseClaimMutation();
  const [updateExpenseClaim, { isLoading: isUpdating }] = useUpdateExpenseClaimMutation();

  const isLoading = isCreating || isUpdating;

  
  const categoryOptions =
    categories && expensePolicyId
      ? categories
          .filter((c) => c.expensePolicy?.id === expensePolicyId)
          .map((c) => ({ label: c.categoryName, value: c.id.toString() }))
      : [];

  useEffect(() => {
    if (!open) {
      setAmountFocused(false);
      return;
    }
    if (draftData) {
      setExpenseDate(draftData.expenseDate ? dayjs(draftData.expenseDate) : dayjs());
      setCategoryId(draftData.category?.id?.toString() ?? "");
      setExpenseTitle(draftData.expenseTitle ?? "");
      setAmount(String(Number(draftData.amount)));
      setComment(draftData.comment ?? "");
      setExistingAttachments(draftData.attachments ?? []);
      setNewFiles([]);
    } else {
      setExpenseDate(dayjs());
      setCategoryId("");
      setExpenseTitle("");
      setAmount("");
      setComment("");
      setExistingAttachments([]);
      setNewFiles([]);
    }
    setErrors({});
  }, [open, draftData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!expenseDate) newErrors.expenseDate = "Expense Date is required";
    if (!categoryId) newErrors.categoryId = "Category Name is required";
    if (!expenseTitle.trim()) newErrors.expenseTitle = "Expense Title is required";
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = "Amount must be greater than 0";
    if (!comment.trim()) newErrors.comment = "Comment is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildFormData = (isSubmit: boolean): FormData => {
    const formData = new FormData();
    formData.append("categoryId", categoryId);
    formData.append("expenseTitle", expenseTitle);
    formData.append("expenseDate", expenseDate!.format("YYYY-MM-DD"));
    formData.append("amount", amount);
    formData.append("comment", comment);
    formData.append("isSubmit", String(isSubmit));
    newFiles.forEach((file) => formData.append("attachments", file));
    return formData;
  };

  const hasAttachment = existingAttachments.length > 0 || newFiles.length > 0;

  const handleSubmit = async (isSubmit: boolean) => {
    if (!validate()) return;
    if (isSubmit && !hasAttachment) {
      setErrors((prev) => ({ ...prev, attachment: "Attachment is required to submit" }));
      return;
    }
    try {
      if (isEditMode) {
        const formData = buildFormData(isSubmit);
        // Send remaining existing attachments as JSON string; empty array = remove all
        formData.append("updatedAttachments", JSON.stringify(existingAttachments));
        await updateExpenseClaim({ id: draftData!.id, body: formData }).unwrap();
      } else {
        await createExpenseClaim(buildFormData(isSubmit)).unwrap();
      }
      onSuccess?.(isSubmit);
      onClose();
    } catch (err: any) {
      const raw = err?.data?.message;
      const message = Array.isArray(raw)
        ? raw.join(", ")
        : raw ?? err?.error ?? "Something went wrong. Please try again.";
      onError?.(message);
    }
  };

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    if (!picked) return;

    const valid: File[] = [];
    const invalid: string[] = [];

    Array.from(picked).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        invalid.push(`"${file.name}" — unsupported file type (allowed: images, PDF)`);
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        invalid.push(`"${file.name}" — exceeds ${MAX_FILE_SIZE_MB} MB limit`);
      } else {
        valid.push(file);
      }
    });

    if (invalid.length > 0) {
      setErrors((prev) => ({ ...prev, attachment: invalid.join("; ") }));
    } else if (errors.attachment) {
      setErrors((prev) => ({ ...prev, attachment: "" }));
    }

    if (valid.length > 0) {
      setNewFiles((prev) => [...prev, ...valid]);
    }
    e.target.value = "";
  };

  const removeExisting = (index: number) =>
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));

  const removeNew = (index: number) =>
    setNewFiles((prev) => prev.filter((_, i) => i !== index));

  const isDisabled =
    !expenseDate ||
    !categoryId ||
    !expenseTitle.trim() ||
    !amount.trim() ||
    Number(amount) <= 0 ||
    !comment.trim() ||
    isLoading;
  const isSubmitDisabled = isDisabled || !hasAttachment;

  const submitDisabledReasons: string[] = [];
  if (isLoading) submitDisabledReasons.push("Please wait while the claim is saved.");
  if (!expenseDate) submitDisabledReasons.push("Expense date is required.");
  if (!categoryId) submitDisabledReasons.push("Category is required.");
  if (!expenseTitle.trim()) submitDisabledReasons.push("Expense title is required.");
  const amt = Number(amount);
  if (!amount.trim() || !Number.isFinite(amt) || amt <= 0) {
    submitDisabledReasons.push("Enter a valid amount greater than 0.");
  }
  if (!comment.trim()) submitDisabledReasons.push("Comment is required.");
  if (!hasAttachment) submitDisabledReasons.push("At least one attachment is required to submit.");

  const submitDisabledReasonTooltip =
    submitDisabledReasons.length > 0 ? (
      <Box component="ul" sx={{ m: 0, pl: 2, py: 0.25, maxWidth: 320 }}>
        {submitDisabledReasons.map((line, i) => (
          <Box component="li" key={`${i}-${line}`} sx={{ typography: "caption", py: 0.125 }}>
            {line}
          </Box>
        ))}
      </Box>
    ) : (
      ""
    );

  return (
    <ModalElement
      open={open}
      onClose={onClose}
      title={isEditMode ? "Edit Expense Claim" : "Claim Expense"}
      maxWidth="sm"
    >
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1 }}>
        <DatePickerElement
          label="Expense Date"
          required
          value={expenseDate}
          onChange={(val) => {
            setExpenseDate(val);
            if (errors.expenseDate) setErrors({ ...errors, expenseDate: "" });
          }}
          error={!!errors.expenseDate}
          helperText={errors.expenseDate}
          width="100%"
        />

        <SingleSelectElement
          label="Category Name"
          required
          options={categoryOptions}
          value={categoryId}
          onChange={(val: string) => {
            setCategoryId(val);
            if (errors.categoryId) setErrors({ ...errors, categoryId: "" });
          }}
          error={!!errors.categoryId}
          helperText={errors.categoryId}
        />

        <TextFieldElement
          name="expenseTitle"
          label="Expense Title"
          required
          fullWidth
          value={expenseTitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setExpenseTitle(e.target.value);
            if (errors.expenseTitle) setErrors({ ...errors, expenseTitle: "" });
          }}
          placeholder="Enter Expense Title"
          error={!!errors.expenseTitle}
          helperText={errors.expenseTitle}
        />

        <Box>
          <TextFieldElement
            name="amount"
            label="Amount"
            required
            fullWidth
            value={amountFocused ? amount : formatAmountDisplayBlurred(amount)}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setAmount(sanitizeAmountInput(e.target.value));
              if (errors.amount) setErrors({ ...errors, amount: "" });
            }}
            placeholder="0.00"
            error={!!errors.amount}
            helperText={errors.amount}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
                inputProps: {
                  style: { textAlign: "right" },
                  inputMode: "decimal",
                },
              },
            }}
          />
        </Box>

        <Box sx={{ gridColumn: "span 2" }}>
          <TextFieldElement
            name="comment"
            label="Comment"
            required
            fullWidth
            multiline
            rows={3}
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setComment(e.target.value);
              if (errors.comment) setErrors({ ...errors, comment: "" });
            }}
            placeholder="Enter comment"
            error={!!errors.comment}
            helperText={errors.comment}
          />
        </Box>

        {/* ── Attachment section ── */}
        <Box sx={{ gridColumn: "span 2" }}>
          <Typography variant="subtitle2" fontWeight={600} mb={1} component="div">
            Attachment{" "}
            <Box component="span" sx={{ color: "error.main" }} aria-hidden>
              *
            </Box>
          </Typography>

          {existingAttachments.length > 0 || newFiles.length > 0 ? (
            <Stack spacing={0.75} mb={1.5}>
              {existingAttachments.map((url, i) => (
                <Box
                  key={`existing-${i}`}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{
                    bgcolor: "grey.100",
                    borderRadius: 1.5,
                    px: 1.5,
                    py: 0.5,
                    border: "1px solid",
                    borderColor: "grey.300",
                  }}
                >
                  <AttachFileIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ flex: 1, color: "text.primary" }}
                  >
                    {getAttachmentName(url)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeExisting(i)}
                    sx={{ p: 0.25 }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}

              {newFiles.map((file, i) => (
                <Box
                  key={`new-${i}`}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{
                    bgcolor: "primary.50",
                    borderRadius: 1.5,
                    px: 1.5,
                    py: 0.5,
                    border: "1px solid",
                    borderColor: "primary.200",
                  }}
                >
                  <AttachFileIcon sx={{ fontSize: 15, color: "primary.main" }} />
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ flex: 1, color: "text.primary" }}
                  >
                    {file.name}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      ml={0.5}
                    >
                      ({(file.size / 1024).toFixed(1)} KB)
                    </Typography>
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeNew(i)}
                    sx={{ p: 0.25 }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          ) : null}

          <Button
            variant="outlined"
            component="label"
            size="small"
            sx={{ textTransform: "none" }}
          >
            Add File
            <input
              type="file"
              hidden
              multiple
              accept="image/*,application/pdf"
              onChange={handleAddFiles}
            />
          </Button>
          {!!errors.attachment && (
            <Typography variant="caption" color="error.main" display="block" mt={0.75}>
              {errors.attachment}
            </Typography>
          )}
        </Box>


        {/* ── Footer buttons ── */}
        <Box
          sx={{
            gridColumn: "span 2",
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            pt: 1,
          }}
        >
          <SecondaryButton
            size="small"
            disabled={isDisabled}
            onClick={() => handleSubmit(false)}
          >
            Draft
          </SecondaryButton>
          <Tooltip
            title={submitDisabledReasonTooltip}
            placement="top"
            arrow
            disableHoverListener={!isSubmitDisabled}
          >
            <Box component="span" sx={{ display: "inline-flex" }}>
              <PrimaryButton
                size="small"
                disabled={isSubmitDisabled}
                onClick={() => handleSubmit(true)}
              >
                Submit
              </PrimaryButton>
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </ModalElement>
  );
}
