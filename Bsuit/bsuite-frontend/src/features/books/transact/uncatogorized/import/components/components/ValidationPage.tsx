import { useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from "@mui/material";
import { useAppSelector } from "../../../../../../../store/store";
import { mapRawDataToSystem } from "../utils/mapRawDataToSystem";

export default function ValidationScreen() {
  const { rawData, columnMapping, processed: mappedDataFromStore } = useAppSelector(
    (s) => s.bankAccStatementImport
  );

  const rows = useMemo(() => {
    let data = [];
    if (mappedDataFromStore && mappedDataFromStore.length > 0) data = mappedDataFromStore;
    else if (rawData && columnMapping) data = mapRawDataToSystem(rawData, columnMapping);
    return data.slice(0, 8);
  }, [mappedDataFromStore, rawData, columnMapping]);

  if (!rows || rows.length === 0) {
    return (
      <Box sx={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography color="text.secondary">No data found for validation.</Typography>
      </Box>
    );
  }

  const headers = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));

  return (
    <Box sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", gap: 1.5, minHeight: 0 }}>

      {/* Title row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Preview
        </Typography>
        <Chip
          label={`${rawData.length} rows`}
          size="small"
          sx={{ height: 20, fontSize: "0.7rem", bgcolor: "action.selected", fontWeight: 600 }}
        />
      </Box>

      {/* Scrollable table */}
      <TableContainer
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <Table size="small" stickyHeader sx={{ minWidth: "max-content" }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderBottom: "1.5px solid",
                  borderColor: "divider",
                  color: "text.disabled",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  width: 48,
                  minWidth: 48,
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                #
              </TableCell>
              {headers.map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    bgcolor: "grey.50",
                    borderBottom: "1.5px solid",
                    borderColor: "divider",
                    color: "text.disabled",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    whiteSpace: "nowrap",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    textAlign: h == "debit" || h == "credit" ? 'right': ''
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row: any, i: number) => (
              <TableRow
                key={i}
                sx={{
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <TableCell
                  sx={{
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    color: "text.disabled",
                    fontSize: "0.75rem",
                    py: 0.75,
                  }}
                >
                  {i + 1}
                </TableCell>
                {headers.map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      py: 0.75,
                      maxWidth: 240,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: "0.82rem",
                        textAlign: h == "debit" || h == "credit" ? 'right': ''
                      }}
                    >
                      {String(row[h] ?? "")}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}