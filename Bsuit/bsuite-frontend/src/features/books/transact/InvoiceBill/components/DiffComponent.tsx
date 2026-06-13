import { Box, Typography } from "@mui/material";

interface DiffAmountProps {
  original?: number | null;
  value: number;
  formatter: (n: number) => string;
  align?: "left" | "right";
}

export function DiffAmount({
  original,
  value,
  formatter,
  align = "right",
}: DiffAmountProps) {
  const showDiff =
    original !== null &&
    original !== undefined &&
    original !== value;

  return (
    <Box
      sx={{
        textAlign: align,
        display: "flex",
        flexDirection: "column",
        alignItems: align === "right" ? "flex-end" : "flex-start",
        lineHeight: 1.2,
      }}
    >
      {showDiff && (
        <Typography
          sx={{
            fontSize: "0.75rem",
            color: "text.secondary",
            textDecorationLine: "line-through",
            textDecorationThickness: "2px",
          }}
        >
          {formatter(original)}
        </Typography>
      )}

      <Typography
        sx={{
          fontSize: "1rem",
          fontWeight: showDiff ? 600 : 400,
        }}
      >
        {formatter(value)}
      </Typography>
    </Box>
  );
}
