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
  "Name",
  "Middle Name",
  "Last Name",
  "Dial Code",
  "Email",
  "Phone Number",
  "Address Line1",
  "Address Line2",
  "City",
  "State",
  "Pincode",
  "Country",
  "PAN",
  "GSTIN",
  "Is Organization",
  "Economic Territory",
  "TDS Prefill Value",
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
    (state) => state.file,
  );
  const [columnMapping, setLocalMapping] = useState<Record<string, string>>({});
  // csv columns available
  const csvColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];
  // Normalize: lowercase + remove spaces + remove underscores
  function normalizeSimple(str: string) {
    return str.toLowerCase().replace(/[\s_]+/g, "");
  }

  function autoMapColumns(systemCols: string[], csvCols: string[]) {
    const mapped: Record<string, string> = {};

    const normalizedCSV = csvCols.map((col) => ({
      original: col,
      norm: normalizeSimple(col),
    }));

    console.log(normalizedCSV);
    systemCols.forEach((sysCol) => {
      const normSys = normalizeSimple(sysCol);

      // Exact normalized match only
      const match = normalizedCSV.find((c) => c.norm === normSys);

      if (match) {
        mapped[sysCol] = match.original;
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
    const requiredColumns = ["Name"];

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
        // mt:15
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
            maxHeight: "385px",
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f8fa" }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    borderBottom: "none",
                    width: "50%",
                  }}
                >
                  Column from system
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 600,
                    borderBottom: "none",
                    width: "50%",
                  }}
                >
                  Column from CSV
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {systemColumns.map((col, index) => (
                <TableRow key={index}>
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
                        setLocalMapping((prev) => ({ ...prev, [col]: val }))
                      }
                      required={["Name"].includes(col)}
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
