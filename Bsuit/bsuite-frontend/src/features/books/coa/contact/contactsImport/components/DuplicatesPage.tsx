import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../../../../store/store";
import { useUpdateDuplicatesMutation } from "../api/contactsImport.api";
import { setDuplicatesToCreate, setServerDuplicates } from "../CSVSlice";

const apiToDisplay: Record<string, string> = {
  name: "Name",
  middleName: "Middle Name",
  lastName: "Last Name",
  email: "Email",
  phoneNumber: "Phone",
  dialCode: "Dial Code",
  addressLine1: "Address Line1",
  addressLine2: "Address Line2",
  city: "City",
  state: "State",
  pincode: "pincode",
  country: "Country",
  // isOrganization: "is_archived",
  gstin: "GSTIN",
  economicTerritory: "economic territory",
  pan: "PAN Number",
  tdsPrefillValue: "tds_prefill_val",
};

const displayToApiKey: Record<string, string> = Object.entries(apiToDisplay).reduce(
  (acc, [k, v]) => ({ ...acc, [v]: k }), {}
);

export default function DuplicatesPage() {
  const dispatch = useAppDispatch();
  const serverDuplicates = useAppSelector((s) => s.file.serverDuplicates) || [];
  const mappedData = useAppSelector((s) => s.file.data) || [];
  const [updateDuplicates, { isLoading }] = useUpdateDuplicatesMutation();

  // selection state: per-duplicate index -> field -> 'local'|'server'
  const [selection, setSelection] = useState<Record<number, Record<string, string>>>(
    {}
  );

  // build a helper to match a server duplicate to a local row index
  function findRowIndexByData(itemData: any) {
    const candidates = ["email", "phoneNumber", "pan", "name"];
    for (let i = 0; i < mappedData.length; i++) {
      const row = mappedData[i] as Record<string, any>;
      for (const key of candidates) {
        const displayKey = apiToDisplay[key] ?? key;
        const rowVal = String(row[displayKey] ?? "").toLowerCase();
        const itemVal = String(itemData?.[key]?.value ?? itemData?.[displayKey]?.value ?? "").toLowerCase();
        if (itemVal && rowVal && rowVal === itemVal) return i;
      }
    }
    return -1;
  }

  const duplicatesWithContext = useMemo(() => {
    return serverDuplicates.map((dup: any, idx: number) => {
      const dataObj = dup.data ?? dup;
      const rowIndex = findRowIndexByData(dataObj);
      // map server api keys to display keys
      const serverValues: Record<string, string> = {};
      Object.entries(dataObj).forEach(([apiKey, valAny]) => {
        const value = (valAny as any)?.value ?? valAny ?? "";
        const display = apiToDisplay[apiKey] ?? apiKey;
        serverValues[display] = String(value ?? "");
      });

      const localValues: Record<string, string> = {};
      if (rowIndex !== -1 && mappedData[rowIndex]) {
        Object.entries(mappedData[rowIndex]).forEach(([k, v]) => {
          localValues[k] = String(v ?? "");
        });
      }

      return { raw: dup, serverValues, localValues, rowIndex };
    });
  }, [serverDuplicates, mappedData]);

  // initialize selection defaults to 'local' where available, else 'server'
  React.useEffect(() => {
    const init: Record<number, Record<string, string>> = {};
    duplicatesWithContext.forEach((d, i) => {
      init[i] = {};
      const keys = Array.from(new Set([...Object.keys(d.serverValues), ...Object.keys(d.localValues)]));
      keys.forEach((k) => {
        init[i][k] = d.localValues[k] !== undefined && d.localValues[k] !== "" ? "local" : "server";
      });
    });
    setSelection(init);
  }, [duplicatesWithContext]);

  const handleChoose = (dupIndex: number, field: string, choice: "local" | "server") => {
    setSelection((prev) => ({
      ...prev,
      [dupIndex]: { ...prev[dupIndex], [field]: choice },
    }));
  };

  const handleSelectAll = (dupIndex: number, choice: "local" | "server") => {
    setSelection((prev) => {
      const copy = { ...(prev[dupIndex] || {}) };
      Object.keys(copy).forEach((k) => (copy[k] = choice));
      return { ...prev, [dupIndex]: copy };
    });
  };

  const handleSubmit = async () => {
    // build final payload array
    const final: any[] = duplicatesWithContext.map((d, i) => {
      const chosen: Record<string, any> = {};
      const keys = Array.from(new Set([...Object.keys(d.serverValues), ...Object.keys(d.localValues)]));
      keys.forEach((displayKey) => {
        const pick = selection[i]?.[displayKey] ?? (d.localValues[displayKey] !== undefined ? "local" : "server");
        const val = pick === "local" ? d.localValues[displayKey] : d.serverValues[displayKey];
        const apiKey = displayToApiKey[displayKey] ?? displayKey;
        // coerce known types
        if (apiKey === "isOrganization") {
          const v = String(val ?? "").toLowerCase();
          if (v === "true" || v === "1") chosen[apiKey] = true;
          else if (v === "false" || v === "0") chosen[apiKey] = false;
          else chosen[apiKey] = val;
        } else if (apiKey === "tdsPrefillValue") {
          const n = Number(val);
          chosen[apiKey] = Number.isFinite(n) ? n : val;
        } else {
          chosen[apiKey] = val;
        }
      });
      return chosen;
    });

    try {
      await updateDuplicates(final).unwrap();
      dispatch(setDuplicatesToCreate(final));
      dispatch(setServerDuplicates(undefined));
      // leave the UI to show success
    } catch (err) {
      console.error("update_duplicates failed", err);
    }
  };

  if (!duplicatesWithContext || duplicatesWithContext.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No duplicates to resolve.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 ,height:"50vh", overflow: 'scroll' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Duplicates — resolve server vs local values
      </Typography>
      {duplicatesWithContext.map((d, i) => (
        <Box key={i} sx={{ mb: 3, border: "1px solid #ddd", p: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography>Duplicate #{i + 1} (row {d.rowIndex + 1})</Typography>
            <Box>
              <Button size="small" onClick={() => handleSelectAll(i, "local")}>Use Local</Button>
              <Button size="small" onClick={() => handleSelectAll(i, "server")}>Use Server</Button>
            </Box>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Field</TableCell>
                  <TableCell>Exsisting</TableCell>
                  <TableCell>New</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from(new Set([...Object.keys(d.serverValues), ...Object.keys(d.localValues)])).map((field) => (
                  <TableRow key={field}>
                    <TableCell>{field}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Radio
                          checked={(selection[i]?.[field] ?? "local") === "server"}
                          onChange={() => handleChoose(i, field, "server")}
                        />
                        <Typography>{d.serverValues[field] ?? ""}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Radio
                          checked={(selection[i]?.[field] ?? "local") === "local"}
                          onChange={() => handleChoose(i, field, "local")}
                        />
                        <Typography>{d.localValues[field] ?? ""}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>
          Submit Resolutions
        </Button>
      </Box>
    </Box>
  );
}
