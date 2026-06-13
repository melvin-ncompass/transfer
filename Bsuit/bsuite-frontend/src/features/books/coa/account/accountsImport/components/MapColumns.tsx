import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../../../store/store";
import ColumnDropDown from "./CSVColumnSelect";

const systemColumns = [
  "Account Name",
  "Account Type",
  "Account Code",
  "Account Currency",
  "Notes",
  "Group Name",
  "Parent Account",
];

// simple similarity scoring (0–100)
function similarityScore(a: string, b: string) {
  if (!a || !b) return 0;
  const A = a.toLowerCase();
  const B = b.toLowerCase();

  if (A === B) return 100; // perfect match
  if (A.replace(/\s+/g, "") === B.replace(/\s+/g, "")) return 95; // ignore spaces
  if (B.includes(A) || A.includes(B)) return 80; // substring
  if (A[0] === B[0]) return 30; // same starting letter
  return 0;
}

function MapColumns({
  update,
  setMissing,
}: {
  update: (s: Record<string, string>) => void;
  setMissing: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { rawData, columnMapping: original } = useAppSelector(
    (state) => state.accImport,
  );
  const [columnMapping, setLocalMapping] = useState<Record<string, string>>({});

  // csv columns available (preserve original header names)
  const csvColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  // Normalize: lowercase + remove spaces + remove underscores
  function normalizeSimple(str: string) {
    return str.toLowerCase().replace(/[\s_]+/g, "");
  }

  function autoMapColumns(systemCols: string[], csvCols: string[]) {
    const mapped: Record<string, string> = {};

    const normalizedCSV: { original: string; norm: string }[] = csvCols.map(
      (col) => ({
        original: col,
        norm: normalizeSimple(String(col ?? "").trim()),
      }),
    );

    systemCols.forEach((sysCol) => {
      const normSys = normalizeSimple(sysCol);

      // 1) Exact normalized match
      let match: { original: string; norm: string } | undefined =
        normalizedCSV.find((c) => c.norm === normSys);
      if (match) {
        mapped[sysCol] = match.original;
        return;
      }

      // 2) Substring / partial match
      match = normalizedCSV.find(
        (c) => c.norm.includes(normSys) || normSys.includes(c.norm),
      );
      if (match) {
        mapped[sysCol] = match.original;
        return;
      }

      // 3) Similarity score fallback (pick best candidate above threshold)
      const bestResult = normalizedCSV.reduce(
        (
          acc: {
            score: number;
            item: { original: string; norm: string } | null;
          },
          c,
        ) => {
          const score = similarityScore(normSys, c.norm);
          if (score > acc.score) return { score, item: c };
          return acc;
        },
        { score: 0, item: null },
      );
      if (bestResult.item && bestResult.score >= 60) {
        mapped[sysCol] = bestResult.item.original;
      }
    });

    return mapped;
  }

  useEffect(() => {
    // Prefer original (saved) mapping if exists
    if (original && Object.keys(original).length > 0) {
      setLocalMapping(original);
      update(original);
      return;
    }

    // Otherwise auto-map
    if (csvColumns.length > 0) {
      const auto = autoMapColumns(systemColumns, csvColumns);

      setLocalMapping(auto);
      update(auto);
    }
  }, []);

  // Keep parent in sync
  useEffect(() => {
    const requiredColumns = [
      "Account Name",
      "Account Type",
      "Account Currency",
    ];
    const missingRequired = requiredColumns.some(
      (col) => columnMapping[col] === "",
    );
    setMissing(missingRequired);
    update(columnMapping);
  }, [columnMapping]);

  return (
    <Box
      sx={{
        width: "100%",

        display: "flex",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          border: "1px solid #e5e7eb",
          p: 2,
        }}
      >
        <TableContainer
          sx={{
            maxHeight: "385px", // important for scrolling
          }}
        >
          <Table stickyHeader>
            {/* HEADER */}
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f8fa" }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    borderBottom: "none",
                    width: "50%",
                  }}
                >
                  System Fields
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 600,
                    borderBottom: "none",
                    width: "50%",
                  }}
                >
                  CSV Columns
                </TableCell>
              </TableRow>
            </TableHead>

            {/* BODY */}
            <TableBody>
              {systemColumns.map((col, index) => (
                <TableRow key={index}>
                  {/* SYSTEM FIELD */}
                  <TableCell
                    sx={{
                      py: 2,
                      borderBottom: "1px solid #f1f5f9",
                      fontWeight: 500,
                      width: "50%",
                    }}
                  >
                    {col}
                  </TableCell>

                  {/* CSV DROPDOWN */}
                  <TableCell
                    sx={{
                      borderBottom: "1px solid #f1f5f9",
                      width: "50%",
                    }}
                  >
                    <ColumnDropDown
                      value={columnMapping[col] ?? ""}
                      options={csvColumns}
                      onChange={(val: string) =>
                        setLocalMapping((prev) => ({
                          ...prev,
                          [col]: val,
                        }))
                      }
                      required={[
                        "Account Name",
                        "Account Type",
                        "Account Currency",
                      ].includes(col)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default MapColumns;
