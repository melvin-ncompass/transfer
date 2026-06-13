import { Typography, Box, type TypographyProps } from "@mui/material";
import { Tooltip } from "../../../../../components/atom/tooltip";
import { truncateText } from "./transact.utils";

type RenderDescriptionOptions = {
  maxLength?: number;
  variant?: TypographyProps["variant"];
};

export const renderDescription = (
  description: string,
  options?: RenderDescriptionOptions
) => {
  const {
    maxLength = 45,
    variant = "body2",
  } = options || {};

  const text = description || "-";
  const { display, isTruncated } = truncateText(text, maxLength);
  const content = (
    <Typography
      variant={variant}
      sx={{
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {display}
    </Typography>
  );

  if (!isTruncated) {
    return content;
  }

  return (
    <Tooltip title={text} placement="top" variant="dark" maxWidth={350}>
      <Box sx={{ maxWidth: "100%", cursor: "pointer" }}>{content}</Box>
    </Tooltip>
  );
};
