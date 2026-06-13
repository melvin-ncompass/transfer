// src/components/reminder/AddReminderBody.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Stack,
  Button,
  Autocomplete,
  TextField as MuiTextField,
  Checkbox,
  TextField,
} from "@mui/material";
import { SingleSelectElement } from "../../../../components/atom/select-field/SingleSelect";
import { TextFieldElement } from "../../../../components/atom/text-field";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import { PrimaryButton } from "../../../../components/atom/button";
import { DatePickerElement } from "../../../../components/atom/date-picker";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useGetAllUsersQuery } from "../../../setting/usermanagement/api/user.api";
import { AccordionElement } from "../../../../components/atom/accordion";
import {
  useCreateReminderMutation,
  useGetReminderByIdQuery,
  useUpdateReminderMutation,
} from "../api/reminders.api";
import {
  ReminderFrequency,
  ReminderBeforeUnit,
  RepeatUnit,
} from "../types/types";
import { MultiSelectElement } from "../../../../components/atom/select-field/MultiSelect";
import { isValidEmail } from "../../../auth/utils/EmailVerification";
import { Chip } from "../../../../components/atom/chips"; // adjust path

type EmailField = "to" | "cc" | "bcc" | "slack";

type EmailChipInputProps = {
  label: string;
  field: EmailField;
  state: { input: string; values: string[] };
  setEmailState: React.Dispatch<
    React.SetStateAction<
      Record<EmailField, { input: string; values: string[] }>
    >
  >;
  onErrorChange?: (hasError: boolean) => void;
};

type Option = { label: string; value: string };
// Frequency of the reminder

const FREQUENCY_OPTIONS: Option[] = Object.values(ReminderFrequency).map(
  (f) => ({
    label: f
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    value: f,
  }),
);

const UNIT_OPTIONS: Option[] = Object.values(ReminderBeforeUnit).map((u) => ({
  label: u
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" "),
  value: u,
}));

const CUSTOM_UNIT: Option[] = Object.values(RepeatUnit).map((u) => ({
  label: u
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" "),
  value: u,
}));

const WEEKDAYS = [
  { label: "Sunday", value: "sun" },
  { label: "Monday", value: "mon" },
  { label: "Tuesday", value: "tue" },
  { label: "Wednesday", value: "wed" },
  { label: "Thursday", value: "thu" },
  { label: "Friday", value: "fri" },
  { label: "Saturday", value: "sat" },
];

const YES_NO: Option[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const pluralize = (word: string, count: number) =>
  count === 1 ? word.replace(/s$/, "") : word;

export interface AddReminderBodyProps {
  rowId?: number;
  onSave?: () => void;
  onError?: (message: string) => void;
  duplicate?: boolean;
}

export function AddReminderBody({
  rowId,
  onSave,
  onError,
  duplicate = false,
}: AddReminderBodyProps) {
  // Form state
  const [subject, setSubject] = useState("");
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [frequency, setFrequency] = useState<ReminderFrequency>(
    ReminderFrequency.ONE_TIME,
  );
  const [remindBeforeValue, setRemindBeforeValue] = useState<number | "">("");
  const [remindBeforeUnit, setRemindBeforeUnit] = useState<ReminderBeforeUnit>(
    ReminderBeforeUnit.DAYS,
  );
  const [remindOnSameDay, setRemindOnSameDay] = useState<string>("yes");
  const [notifyTo, setNotifyTo] = useState<string[]>([]);

  const [sendEmail, setSendEmail] = useState(false);
  const [sendSlack, setSendSlack] = useState(false);
  const [showEmailDetails, setShowEmailDetails] = useState(false);
  const [showSlackDetails, setShowSlackDetails] = useState(false);

  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  // const [slackChannelUrl, setSlackChannelUrl] = useState("");
  const [slackInputError, setSlackInputError] = useState(false);

  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customInterval, setCustomInterval] = useState<number | "">(1);
  const [customUnit, setCustomUnit] = useState<RepeatUnit>(RepeatUnit.DAYS);
  const [customWeekdays, setCustomWeekdays] = useState<string[]>([]);
  const [customMonthDay, setCustomMonthDay] = useState<number | "">("");
  const [customRecurrence, setCustomRecurrence] = useState<any | null>(null);

  const [emailState, setEmailState] = useState<
    Record<EmailField, { input: string; values: string[] }>
  >({
    to: { input: "", values: [] },
    cc: { input: "", values: [] },
    bcc: { input: "", values: [] },
    slack: { input: "", values: [] },
  });

  //   useEffect(() => {
  //   if (initialData?.frequency === "CUSTOM") {
  //     setCustomRecurrence({
  //       type: "custom",
  //       interval: initialData.repeatEvery ?? 1,
  //       unit: initialData.repeatUnit?.toLowerCase() ?? "days",
  //     });

  //     setCustomInterval(initialData.repeatEvery ?? 1);
  //     setCustomUnit(initialData.repeatUnit?.toLowerCase() ?? "days");
  //   }
  // }, [initialData]);

  const { data: usersData } = useGetAllUsersQuery();
  const notifyToOptions = useMemo(
    () =>
      (usersData?.data || []).map((user) => ({
        label: `${user.userName} (${user.email})`,
        value: user.userId,
      })),
    [usersData],
  );

  // RTK mutation
  const [createReminder, { isLoading }] = useCreateReminderMutation();
  const [updateReminder, { isLoading: isUpdating }] =
    useUpdateReminderMutation();
  console.log(rowId)
  const { data: reminderData } = useGetReminderByIdQuery({ id: rowId },{skip: !rowId});

  const handlePrefill = () => {
    if (!reminderData?.data) return;

    const reminder = reminderData.data;

    setSubject(reminder.subject);
    setStartDate(dayjs(reminder.startDate));
    setFrequency(reminder.frequency as ReminderFrequency);

    // remind before
    setRemindBeforeValue(reminder.remindBeforeValue ?? "");
    setRemindBeforeUnit(reminder.remindBeforeUnit ?? ReminderBeforeUnit.DAYS);

    setRemindOnSameDay(reminder.remindOnSameDay ? "yes" : "no");

    // notifyTo (already array)
    setNotifyTo(reminder.notifyTo || []);

    // :white_check_mark: Prefill email chips
    setEmailState({
      to: {
        input: "",
        values: reminder.sendTo?.emails || [],
      },
      cc: {
        input: "",
        values: reminder.sendTo?.cc || [],
      },
      bcc: {
        input: "",
        values: reminder.sendTo?.bcc || [],
      },
      slack: {
        input: "",
        values: reminder.sendTo?.slackChannels || [],
      },
    });

    // open accordion automatically if emails exist
    if (
      reminder.sendTo?.emails?.length ||
      reminder.sendTo?.cc?.length ||
      reminder.sendTo?.bcc?.length
    ) {
      setShowEmailDetails(true);
      setSendEmail(true);
    }

    // :white_check_mark: Custom frequency prefill
    if (reminder.frequency === ReminderFrequency.CUSTOM) {
      setCustomInterval(reminder.repeatEvery ?? 1);
      setCustomUnit(reminder.repeatUnit ?? RepeatUnit.DAYS);

      setCustomRecurrence({
        type: ReminderFrequency.CUSTOM,
        interval: reminder.repeatEvery ?? 1,
        unit: reminder.repeatUnit ?? RepeatUnit.DAYS,
      });
    }
  };

  useEffect(() => {
    handlePrefill();
  }, [reminderData]);
  // Frequency select change
  const handleFrequencyChange = (v: string) => {
    if ((v as ReminderFrequency) === ReminderFrequency.CUSTOM) {
      setCustomModalOpen(true);
    }
    setFrequency(v as ReminderFrequency);
  };

  const handleCustomSave = () => {
    setCustomRecurrence({
      type: ReminderFrequency.CUSTOM,
      interval: customInterval || 1,
      unit: customUnit,
      ...(customUnit === RepeatUnit.WEEKS ? { weekdays: customWeekdays } : {}),
      ...(customUnit === RepeatUnit.MONTHS
        ? { day: customMonthDay || null }
        : {}),
    });
    setCustomModalOpen(false);
  };

  const buildFrequencyPayload = () => {
    if (frequency !== ReminderFrequency.CUSTOM) return frequency;
    return (
      customRecurrence || {
        type: ReminderFrequency.CUSTOM,
        interval: customInterval || 1,
        unit: customUnit,
      }
    );
  };
  // const handleSave = async () => {
  //   try {
  //     if (!subject.trim()) {
  //       onError?.("Subject is required");
  //       return;
  //     }

  //     if (!startDate) {
  //       onError?.("Start date is required");
  //       return;
  //     }

  //     const isCustom = frequency === ReminderFrequency.CUSTOM;
  //     const isSameDay = remindOnSameDay === "yes";
  //     const remindValue =
  //       remindBeforeValue === "" ? null : Number(remindBeforeValue);

  //     const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  //     const payload: any = {
  //       subject: subject.trim(),

  //       //  Correct format (NO Z, NO milliseconds)
  //       startDate: startDate.format("YYYY-MM-DDTHH:mm:ss"),

  //       frequency: isCustom ? ReminderFrequency.CUSTOM : frequency,
  //       remindOnSameDay: isSameDay,
  //       notifyTo,
  //       timezone,

  //       sendTo: {
  //         emails: emailState.to.values,
  //         cc: emailState.cc.values,
  //         bcc: emailState.bcc.values,
  //       },
  //     };

  //     // Custom recurrence
  //     if (isCustom) {
  //       payload.repeatEvery = customInterval || 1;
  //       payload.repeatUnit = customUnit;
  //     }

  //     // Remind before condition
  //     const shouldSendRemindBefore =
  //       remindValue !== null && !(isSameDay && remindValue === 0);

  //     if (shouldSendRemindBefore) {
  //       payload.remindBeforeValue = remindValue;
  //       payload.remindBeforeUnit = remindBeforeUnit;
  //     }

  //     if (rowId) {
  //       await updateReminder({ id: rowId, data: payload }).unwrap();
  //     } else {
  //       await createReminder(payload).unwrap();
  //     }

  //     onSave?.();
  //   } catch (err: any) {
  //     console.error("Failed to save reminder", err);
  //     onError?.(err?.data?.message?.[0] || "Something went wrong");
  //   }
  // };
  const handleSave = async () => {
    try {
      if (!subject.trim()) {
        onError?.("Subject is required");
        return;
      }

      if (!startDate) {
        onError?.("Start date is required");
        return;
      }

      const isCustom = frequency === ReminderFrequency.CUSTOM; // Force false if ONE_TIME and don't send the key

      const isSameDay =
        frequency === ReminderFrequency.ONE_TIME
          ? false
          : remindOnSameDay === "yes";

      const remindValue =
        remindBeforeValue === "" ? null : Number(remindBeforeValue);

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const payload: any = {
        subject: subject.trim(),
        startDate: startDate.format("YYYY-MM-DDTHH:mm:ss"),
        frequency: isCustom ? ReminderFrequency.CUSTOM : frequency,
        notifyTo,
        timezone,
        sendTo: {
          emails: emailState.to.values,
          cc: emailState.cc.values,
          bcc: emailState.bcc.values,
          slackChannels: emailState.slack.values,
        },
      }; // Only include remindOnSameDay if NOT ONE_TIME

      if (frequency !== ReminderFrequency.ONE_TIME) {
        payload.remindOnSameDay = isSameDay;
      } // Custom recurrence

      if (isCustom) {
        payload.repeatEvery = customInterval || 1;
        payload.repeatUnit = customUnit;
      } // Only send remindBefore when allowed

      const shouldSendRemindBefore =
        remindValue !== null && !(isSameDay && remindValue === 0);

      if (shouldSendRemindBefore) {
        payload.remindBeforeValue = remindValue;
        payload.remindBeforeUnit = remindBeforeUnit;
      }

      if (rowId && !duplicate) {
        await updateReminder({ id: rowId, data: payload }).unwrap();
      } else {
        await createReminder(payload).unwrap();
      }

      onSave?.();
    } catch (err: any) {
      onError?.(err?.data?.message || "Something went wrong");
    }
  };

  return (
    <Box sx={{ width: "100%", px: "5px", py: "0px" }}>
      {/* body grid */}
      <Grid container spacing={2}>
        {/* left column */}
        <Grid size={12}>
          <TextFieldElement
            label="Reminder Subject"
            value={subject}
            onChange={(e: any) => setSubject(e.target.value)}
            placeholder="Enter reminder subject"
            fullWidth
            required
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            <DatePickerElement
              label="Reminder Start Date"
              value={startDate}
              // min={dayjs().add(1, "day")}
              onChange={(newValue) => setStartDate(newValue)}
              required
              width="100%"
              withTime
            />

            <Grid container spacing={1}>
              <Grid size={7}>
                <TextFieldElement
                  label="Remind Before"
                  value={String(remindBeforeValue)}
                  onChange={(e: any) => {
                    const v = e.target.value;
                    const num = v === "" ? "" : Number(v);
                    setRemindBeforeValue(num === 0 && v !== "" ? 0 : num);
                  }}
                  type="number"
                  placeholder="0"
                  fullWidth
                />
              </Grid>

              <Grid size={5}>
                <SingleSelectElement
                  label="Unit"
                  value={remindBeforeUnit}
                  onChange={(v: string) =>
                    setRemindBeforeUnit(v as ReminderBeforeUnit)
                  }
                  options={UNIT_OPTIONS}
                  width="100%"
                />
              </Grid>
            </Grid>
          </Stack>
        </Grid>

        {/* right column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            <SingleSelectElement
              label="Frequency"
              value={frequency}
              onChange={handleFrequencyChange}
              options={FREQUENCY_OPTIONS}
              required
              width="100%"
            />

            {/* show a brief summary when customRecurrence is set */}
            {frequency === ReminderFrequency.CUSTOM && customRecurrence && (
              <Box
                sx={{ typography: "body2", color: "text.secondary", p: 1 }}
                width={"100%"}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <Stack direction={"row"}>
                  <strong>Custom:</strong>{" "}
                  {`Every ${customRecurrence.interval} ${pluralize(customRecurrence.unit, customRecurrence.interval)}${customRecurrence.unit === "weeks" &&
                    customRecurrence.weekdays
                    ? ` on ${customRecurrence.weekdays.join(", ")}`
                    : customRecurrence.unit === "months" &&
                      customRecurrence.day
                      ? ` on day ${customRecurrence.day}`
                      : ""
                    }`}
                </Stack>
                <Button
                  size="small"
                  onClick={() => setCustomModalOpen(true)}
                  sx={{ ml: 1 }}
                >
                  Edit
                </Button>
              </Box>
            )}

            {/* Remind before */}
            {/* {frequency != "custom" && (
              <Grid container spacing={1}>
                <Grid size={7}>
                  <TextFieldElement
                    label="Remind Before"
                    value={String(remindBeforeValue)}
                    onChange={(e: any) => {
                      const v = e.target.value;
                      const num = v === "" ? "" : Number(v);
                      setRemindBeforeValue(num === 0 && v !== "" ? 0 : num);
                    }}
                    type="number"
                    placeholder="0"
                    fullWidth
                  />
                </Grid>

                <Grid size={5}>
                  <SingleSelectElement
                    label="Unit"
                    value={remindBeforeUnit}
                    onChange={(v: string) => setRemindBeforeUnit(v)}
                    options={UNIT_OPTIONS}
                    width="100%"
                  />
                </Grid>
              </Grid>
            )} */}
            {/* Send Reminder To */}
          </Stack>
        </Grid>
        <Box width={"100%"} display={"flex"} alignItems={"center"} gap={2}>
          <Grid size={6}>
            <Box>
              <MultiSelectElement
                label="Notify To"
                options={notifyToOptions}
                value={notifyTo}
                onChange={setNotifyTo}
                width={"100%"}
              />
            </Box>
          </Grid>
          <Grid size={6}>
            <SingleSelectElement
              label="Remind on Same Day"
              value={remindOnSameDay}
              onChange={(v: string) => setRemindOnSameDay(v)}
              options={YES_NO}
              width="100%"
              disabled={frequency === ReminderFrequency.ONE_TIME}
            />
          </Grid>
        </Box>
        <Typography variant="subtitle2">Send Reminder To</Typography>
        <Box width={"100%"} display={"flex"} gap={2}>
          {/* Email Accordion */}
          <Box width={"50%"}>
            <AccordionElement
              title="Email"
              open={showEmailDetails}
              onChange={() => {
                setShowEmailDetails((s) => !s);
                setSendEmail((s) => !s);
              }}
            >
              <Grid container spacing={3}>
                <Grid size={12}>
                  <EmailChipInput
                    label="To"
                    field="to"
                    state={emailState.to}
                    setEmailState={setEmailState}
                  />
                </Grid>

                <Grid size={12}>
                  <EmailChipInput
                    label="CC"
                    field="cc"
                    state={emailState.cc}
                    setEmailState={setEmailState}
                  />
                </Grid>

                <Grid size={12}>
                  <EmailChipInput
                    label="BCC"
                    field="bcc"
                    state={emailState.bcc}
                    setEmailState={setEmailState}
                  />
                </Grid>
              </Grid>
            </AccordionElement>
          </Box>

          {/* Slack Accordion */}
          <Box width={"50%"}>
            <AccordionElement
              title="Slack"
              open={showSlackDetails}
              onChange={() => setShowSlackDetails((s) => !s)}
            >
              {/* <TextFieldElement
                label="Slack Channel URL"
                value={slackChannelUrl}
                onChange={(e: any) => setSlackChannelUrl(e.target.value)}
                placeholder="https://hooks.slack.com/..."
                fullWidth
              /> */}
              <EmailChipInput
                label="Slack Channels"
                field="slack"
                state={emailState.slack}
                setEmailState={setEmailState}
                onErrorChange={setSlackInputError}
              />
            </AccordionElement>
          </Box>
        </Box>
      </Grid>

      {/* footer */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
        <PrimaryButton
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={isLoading || subject.length < 1 || slackInputError}
        >
          {isLoading ? "Saving..." : "Save Reminder"}
        </PrimaryButton>
      </Box>

      {/* CUSTOM RECURRENCE MODAL */}
      <ModalElement
        open={customModalOpen}
        title="Custom recurrence"
        onClose={() => setCustomModalOpen(false)}
        maxWidth="sm"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Grid container spacing={1} alignItems="center">
            <Grid size={5}>
              <TextFieldElement
                label="Every"
                value={String(customInterval)}
                onChange={(e: any) => {
                  const raw = e.target.value;
                  const num = raw === "" ? "" : Number(raw);
                  setCustomInterval(Number.isNaN(num) ? "" : num);
                }}
                type="number"
                placeholder="1"
                fullWidth
              />
            </Grid>

            <Grid size={7}>
              <SingleSelectElement
                label="Unit"
                value={customUnit}
                onChange={(v: string) => {
                  setCustomUnit(v as RepeatUnit);
                  setCustomWeekdays([]);
                  setCustomMonthDay("");
                }}
                options={CUSTOM_UNIT}
                width="100%"
              />
            </Grid>

            {/* Weekdays chooser */}
            {customUnit === RepeatUnit.WEEKS && (
              <Grid size={12} sx={{ mt: 1 }}>
                <Autocomplete
                  multiple
                  options={WEEKDAYS}
                  getOptionLabel={(o) => o.label}
                  value={WEEKDAYS.filter((d) =>
                    customWeekdays.includes(d.value),
                  )}
                  onChange={(_, selected) =>
                    setCustomWeekdays(selected.map((s) => s.value))
                  }
                  disableCloseOnSelect
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox style={{ marginRight: 8 }} checked={selected} />
                      {option.label}
                    </li>
                  )}
                  renderInput={(params) => (
                    <MuiTextField
                      {...params}
                      label="Repeat on"
                      placeholder="Select weekdays"
                      size="small"
                    />
                  )}
                />
              </Grid>
            )}

            {/* Month day chooser */}
            {customUnit === RepeatUnit.MONTHS && (
              <Grid size={12} sx={{ mt: 1 }}>
                <TextFieldElement
                  label="Day of month"
                  value={String(customMonthDay)}
                  onChange={(e: any) => {
                    const raw = e.target.value;
                    const num = raw === "" ? "" : Number(raw);
                    if (
                      num === "" ||
                      (Number.isInteger(num) && num >= 1 && num <= 31)
                    ) {
                      setCustomMonthDay(num);
                    }
                  }}
                  type="number"
                  placeholder="1"
                  fullWidth
                />
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 0.5, color: "text.secondary" }}
                >
                  Leave empty to repeat on same day as start date.
                </Typography>
              </Grid>
            )}
          </Grid>

          {/* modal actions */}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}
          >
            <PrimaryButton onClick={handleCustomSave} variant="contained">
              Save
            </PrimaryButton>
          </Box>
        </Box>
      </ModalElement>
    </Box>
  );
}

function EmailChipInput({
  label,
  field,
  state,
  setEmailState,
  onErrorChange,
}: EmailChipInputProps) {
  const [helper, setHelper] = useState("");

  const addEmail = () => {
    const value = state.input.trim();

    if (!value) {
      setHelper("");
      onErrorChange?.(false);
      return;
    }

    // Email validation
    if (field !== "slack" && !isValidEmail(value.toLowerCase())) {
      setHelper("Email not valid");
      onErrorChange?.(true);
      return;
    }

    // Slack webhook validation
    if (field === "slack" && !value.startsWith("https://hooks.slack.com/")) {
      setHelper("Invalid Slack webhook URL");
      onErrorChange?.(true);
      return;
    }

    setEmailState((prev) => ({
      ...prev,
      [field]: {
        input: "",
        values: prev[field].values.includes(value)
          ? prev[field].values
          : [...prev[field].values, value],
      },
    }));

    onErrorChange?.(false);
    setHelper("");
  };

  return (
    <TextField
      size="small"
      label={label}
      fullWidth
      value={state.input}
      error={!!helper}
      helperText={helper}
      onChange={(e) => {
        setHelper(""); // clear error while typing
        onErrorChange?.(false);
        setEmailState((prev) => ({
          ...prev,
          [field]: { ...prev[field], input: e.target.value },
        }));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          addEmail();
        }
      }}
      onBlur={addEmail}
      InputProps={{
        startAdornment: (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 0.5,
              maxWidth: "100%",
            }}
          >
            {state.values.map((email) => (
              <Chip
                key={email}
                label={email}
                size="small"
                color="info"
                onDelete={() =>
                  setEmailState((prev) => ({
                    ...prev,
                    [field]: {
                      ...prev[field],
                      values: prev[field].values.filter((e) => e !== email),
                    },
                  }))
                }
              />
            ))}
          </Box>
        ),
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          pt: 1,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
        },
        "& .MuiOutlinedInput-input": {
          padding: "6px 8px",
          flexGrow: 1,
          minWidth: 140,
        },
      }}
    />
  );
}
