import { Box, Stack } from "@mui/material";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { useState, type KeyboardEvent } from "react";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { TextAreaField } from "../../../../../../components/atom/text-area-field";

interface ChatComposerProps {
  disabled?: boolean;
  sending?: boolean;
  canSendInternalNotes?: boolean;
  onSend: (message: string, isInternal: boolean) => void;
}

export default function ChatComposer({
  disabled = false,
  sending = false,
  canSendInternalNotes = false,
  onSend,
}: ChatComposerProps) {
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || sending) return;
    onSend(trimmed, isInternal);
    setText("");
    setIsInternal(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
      onKeyDown={handleKeyDown}
    >
      <Stack spacing={1.25}>
        {canSendInternalNotes && (
          <Checkbox
            label="Internal note (visible to agents only)"
            checked={isInternal}
            onChange={(event) => setIsInternal(event.target.checked)}
            disabled={disabled || sending}
          />
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-end">
          <TextAreaField
            label="Message"
            value={text}
            onChange={setText}
            rows={3}
            disabled={disabled || sending}
            sx={{ width: "100%", flex: 1 }}
          />
          <PrimaryButton
            onClick={handleSend}
            disabled={disabled || sending || !text.trim()}
            loading={sending}
            endIcon={<SendOutlinedIcon />}
            sx={{ minWidth: { sm: 120 }, alignSelf: { xs: "stretch", sm: "auto" } }}
          >
            Send
          </PrimaryButton>
        </Stack>
      </Stack>
    </Box>
  );
}
