import { Badge, Box, Stack, Typography } from "@mui/material";
import { Tooltip } from "../../../../../components/atom/tooltip";
import { formatDateShort } from "../../../../../utils/numberFormatter";
import { useState } from "react";
import { ModalElement } from "../../../../../components/dialogs/modal-element";

// formatType
export const formatType = (type: string) =>
  type
    ? type
        .split("_")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ")
    : "-";

// getHighestAndRest
export const getHighestAndRest = (accounts: any[]) => {
  if (!accounts?.length) return { highest: null, rest: [] };

  const sorted = [...accounts].sort(
    (a, b) =>
      Math.abs(Number(b.amount || b.balance || 0)) -
      Math.abs(Number(a.amount || a.balance || 0)),
  );

  return { highest: sorted[0], rest: sorted.slice(1) };
};

// renderAccounts
// export const renderAccounts = (accounts: any[]) => {
//   if (!accounts?.length) return "-";

//   const { highest, rest } = getHighestAndRest(accounts);
//   if (!highest) return "-";

//   if (!rest.length) return highest.name;

//   const tooltipContent = (
//     <Box sx={{ py: 0.5 }}>
//       {rest.map((acc, idx) => (
//         <Box
//           key={idx}
//           sx={{
//             display: "flex",
//             gap: 1,
//             px: 1.5,
//             py: 0.5,
//             alignItems: "flex-start",
//             "&:first-of-type": {
//               pt: 0.5,
//             },
//             "&:last-of-type": {
//               pb: 0.5,
//             },
//           }}
//         >
//           <Typography
//             variant="body2"
//             sx={{
//               mt: 0.3,
//               fontSize: "1rem",
//               minWidth: "4px",
//               flexShrink: 0,
//             }}
//           >
//             •
//           </Typography>
//           <Typography variant="body2" sx={{ flex: 1 }}>
//             {acc.name}
//           </Typography>
//         </Box>
//       ))}
//     </Box>
//   );
//   return (
//     <Stack direction="row" spacing={0.5} alignItems="center">
//       <Typography variant="body2" fontSize={"0.9rem"}>{highest.name}</Typography>
//       <Tooltip
//         title={tooltipContent}
//         arrow
//         placement="top"
//         variant="primary"
//         maxWidth={220}
//       >
//         <Box
//           sx={{
//             width: 20,
//             height: 20,
//             borderRadius: "50%",
//             bgcolor: "primary.main",
//             color: "white",
//             fontSize: "0.6rem",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             cursor: "pointer",
//             transition: "transform 0.2s ease-in-out",
//             "&:hover": {
//               transform: "scale(1.15)",
//             },
//           }}
//         >
//           +{rest.length}
//         </Box>
//       </Tooltip>
//     </Stack>
//   );
// };

export const renderDate = (row: any) => formatDateShort(row.date);

export const extractCurrencyCode = (val: unknown): string => {
  if (typeof val !== "string") return "";

  const trimmed = val.trim();

  // If format like "Indian Rupee - INR"
  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    return parts[parts.length - 1].trim().toUpperCase();
  }

  // If already 3-letter code
  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // If symbol like ₹ or $
  return "";
};

export const isValidCode = (v: string) => /^[A-Z]{3}$/.test(v);

// utils/currencyUtils.ts
export const getEffectiveFxRate = (
  manualFxRate?: string | number,
  fxRate?: number | null,
) => {
  return Number(manualFxRate || fxRate || 1);
};

export const getFxTotal = (
  amount?: string | number,
  effectiveFxRate?: number,
) => {
  if (!amount) return null;
  return Number(amount) * (effectiveFxRate || 1);
};

export const truncateText = (
  text: string,
  maxLength = 30,
): { display: string; isTruncated: boolean } => {
  if (!text) return { display: "-", isTruncated: false };

  if (text.length <= maxLength) {
    return { display: text, isTruncated: false };
  }

  return {
    display: `${text.slice(0, maxLength)}…`,
    isTruncated: true,
  };
};
