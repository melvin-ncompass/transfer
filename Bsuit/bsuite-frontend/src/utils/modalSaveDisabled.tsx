import { Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

/** Tooltip content for ModalElement when Save is disabled (list of reasons). */
export function buildModalSaveDisabledTooltip(
  reasons: Array<string | false | null | undefined>,
): ReactNode | undefined {
  const messages = reasons.filter((r): r is string => Boolean(r));
  if (messages.length === 0) return undefined;
  if (messages.length === 1) return messages[0];
  return (
    <Stack component="ul" sx={{ m: 0, pl: 2, py: 0 }} spacing={0.5}>
      {messages.map((text, i) => (
        <Typography key={i} component="li" variant="body2" sx={{ display: "list-item" }}>
          {text}
        </Typography>
      ))}
    </Stack>
  );
}
