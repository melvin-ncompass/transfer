import { Box, Typography, Divider } from "@mui/material";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../../../../store/store";
import ColumnDropDown from "./CSVColumnSelect";

const systemColumns = ["date", "description", "debit", "credit"] as const;

const columnMeta: Record<string, { label: string; required?: boolean }> = {
  date: { label: "Date", required: true },
  description: { label: "Description" },
  debit: { label: "Debit", required: true },
  credit: { label: "Credit", required: true },
};

function MapColumns({
  update,
}: {
  update: (s: Record<string, string>) => void;
}) {
  const {
    rawData,
    columnMapping: original,
    dateCandidates,
    descriptionCandidates,
    debitCandidates,
    creditCandidates,
  } = useAppSelector((state) => state.bankAccStatementImport);

  const [columnMapping, setLocalMapping] = useState<Record<string, string>>({});

  const csvColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  function normalizeSimple(str: string) {
    return str.toLowerCase().replace(/[\s_]+/g, "");
  }

  function autoMapColumns(systemCols: readonly string[], csvCols: string[]) {
    const mapped: Record<string, string> = {};
    const normalizedCSV = csvCols.map((col) => ({
      original: col,
      norm: normalizeSimple(col),
    }));
    systemCols.forEach((sysCol) => {
      const match = normalizedCSV.find(
        (c) => c.norm === normalizeSimple(sysCol)
      );
      if (match) mapped[sysCol] = match.original;
    });
    return mapped;
  }

  useEffect(() => {
    if (original && Object.keys(original).length > 0) {
      setLocalMapping(original);
      update(original);
      return;
    }
    if (csvColumns.length > 0) {
      const auto = autoMapColumns(systemColumns, csvColumns);
      setLocalMapping(auto);
      update(auto);
    }
  }, [rawData, original]);

  useEffect(() => {
    update(columnMapping);
  }, [columnMapping]);

  const getCandidates = (col: string) => {
    if (col === "date") return dateCandidates?.length ? dateCandidates : csvColumns;
    if (col === "description") return descriptionCandidates?.length ? descriptionCandidates : csvColumns;
    if (col === "debit") return debitCandidates?.length ? debitCandidates : csvColumns;
    if (col === "credit") return creditCandidates?.length ? creditCandidates : csvColumns;
    return csvColumns;
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Column headers */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          gap: 2,
          px: 1,
          pb: 1.25,
        }}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          color="text.disabled"
          textTransform="uppercase"
          letterSpacing={0.7}
        >
          System Field
        </Typography>
        <Typography
          variant="caption"
          fontWeight={700}
          color="text.disabled"
          textTransform="uppercase"
          letterSpacing={0.7}
        >
          Imported CSV Header
        </Typography>
      </Box>

      <Divider />

      {systemColumns.map((col) => {
        const meta = columnMeta[col];

        return (
          <Box key={col}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "180px 1fr",
                gap: 2,
                alignItems: "center",
                px: 1,
                py: 1.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: "text.primary",
                }}
              >
                {meta?.label}
              </Typography>

              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", pt: 0.8 }}>
                <ColumnDropDown
                  value={columnMapping[col] ?? ""}
                  options={getCandidates(col)}
                  onChange={(val: string) =>
                    setLocalMapping((prev) => ({ ...prev, [col]: val }))
                  }
                />
              </Box>
            </Box>

            {/* {index < systemColumns.length - 1 && <Divider sx={{ mx: 1 }} />} */}
          </Box>
        );
      })}
    </Box>
  );
}

export default MapColumns;