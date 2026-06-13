import { useEffect, useState, useMemo } from "react";
import { Box, IconButton, Stack, Typography, Divider } from "@mui/material";
import { useAppDispatch, useAppSelector, type RootState } from "../../../../../../../store/store";
import {
  setAccountId,
  setRawFile,
  setSelectedDateFormat,
  setUploadedFile,
} from "../CSVSlice";
import CSVStats from "./CSVStats";
import FileDropZone from "./FileDropZone";
import { SingleSelectElement } from "../../../../../../../components/atom/select-field/SingleSelect";

import Papa from "papaparse";
import { useGetDemoCsvForStatementsMutation } from "../api/bankAccStatementImport.api";
import { ModalElement } from "../../../../../../../components/dialogs/modal-element";
import { AccountForm } from "../../../../../coa/account/components/AccountForm";
import { Add } from "@mui/icons-material";
import { useGetGroupsQuery } from "../../../../../coa/account/api/groups.api";
import { Snackbar } from "../../../../../../../components/atom/snackbar";
import { useAllAccountOptions } from "../../../../transactHome/hooks/useAllAccountOptions";

export interface DataRow {
  [key: string]: string | number;
}

function UploadCSV() {
  const [getDemoCSV, { isLoading }] = useGetDemoCsvForStatementsMutation();

  const dateFormatOptions = [
    { label: "DD-MMM-YY (01-Nov-25)", value: "DD-MMM-YY" },
    { label: "DD-MMM-YYYY (01-Nov-2025)", value: "DD-MMM-YYYY" },
    { label: "DD MMM YYYY (01 Nov 2025)", value: "DD MMM YYYY" },
    { label: "MMM DD, YYYY (Nov 01, 2025)", value: "MMM DD, YYYY" },

    { label: "DD/MM/YYYY (01/11/2025)", value: "DD/MM/YYYY" },
    { label: "DD-MM-YYYY (01-11-2025)", value: "DD-MM-YYYY" },
    { label: "DD.MM.YYYY (01.11.2025)", value: "DD.MM.YYYY" },

    { label: "MM/DD/YYYY (11/01/2025)", value: "MM/DD/YYYY" },
    { label: "MM-DD-YYYY (11-01-2025)", value: "MM-DD-YYYY" },

    { label: "YYYY-MM-DD (2025-11-01)", value: "YYYY-MM-DD" },
    { label: "YYYY/MM/DD (2025/11/01)", value: "YYYY/MM/DD" },
  ];

  const { accountsData: aData, accountGroups } = useAllAccountOptions(
    null,
    true,
    "full",
    ["Asset", "Liability"]
  );

  const { uploadedFile, dateFormat: uploadDateFormat, accountId: uploadAccountId } = useAppSelector(
    (state: RootState) => state.bankAccStatementImport
  );

  const accountsList = (aData?.data ?? []) as any[];

  const firstAccountOption = accountGroups
    .flatMap((group) => group.options)
    .find((opt) => opt.value.startsWith("account_"));

  const [selectedAccount, setSelectedAccount] = useState<string | null>(
    uploadAccountId ? `account_${uploadAccountId}` : null
  );

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!selectedAccount) return;
    const accountId = selectedAccount.startsWith("account_")
      ? Number(selectedAccount.replace("account_", ""))
      : null;
    if (accountId) dispatch(setAccountId(accountId));
  }, [selectedAccount, dispatch]);

  const [dateFormat, setDateFormat] = useState<string | null>(uploadDateFormat || null);

  useEffect(() => {
    dispatch(setSelectedDateFormat(dateFormat ?? ""));
  }, [dateFormat, dispatch]);

  useEffect(() => {
    if (uploadedFile && data.length === 0) {
      Papa.parse<Record<string, string>>(uploadedFile as File, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
        },
      });
    }
  }, [uploadedFile]);

  const handleDownload = async () => {
    try {
      const blob = await getDemoCSV().unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "bankStatementSample.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    }
  };
  const [data, setData] = useState<Record<string, string>[]>([]);

  const isValidCsvFile = (file: File) => {
    const validMimeTypes = ["text/csv", "application/vnd.ms-excel", ""];
    const hasCsvExtension = file.name.toLowerCase().endsWith(".csv");

    return hasCsvExtension || validMimeTypes.includes(file.type);
  };

  const handleFileUpload = (file: File) => {
    if (!isValidCsvFile(file)) {
      setError("Only CSV files are allowed.");
      return;
    }
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
        dispatch(setRawFile(results.data));
        if (results.data.length > 0) {
          setError(null);
          dispatch(setUploadedFile(file));
        } else {
          setError("No data found in the uploaded file.");
        }
      },
      error: (err) => {
        console.error("Error parsing CSV:", err);
      },
    });
  };

  const handleRemoveFile = () => {
    dispatch(setUploadedFile(null));
    setData([]);
  };

  const [openAccountModal, setOpenAccountModal] = useState(false);

  const safeAccounts = accountsList ?? [];
  const { data: gData } = useGetGroupsQuery("");
  const groupsData = gData?.data;
  const safeGroups = groupsData ?? [];

  const parentAccounts = useMemo(() => {
    return (
      safeAccounts?.map((acc: any) => ({
        label: acc.accountName,
        value: acc.id?.toString(),
        groupId: acc.group?.id ?? "",
        accountType: acc.accountType,
      })) || []
    );
  }, [safeAccounts]);

  const groupNames = useMemo(() => {
    return (
      safeGroups?.map((grp: any) => ({
        label: grp.groupName,
        value: grp.id,
        type: grp.groupType,
      })) || []
    );
  }, [safeGroups]);

  const [error, setError] = useState<string | null>(null);

  const checklist = [
    { label: "CSV file uploaded", done: !!uploadedFile },
    { label: "Date format selected", done: !!dateFormat },
    { label: "Account selected", done: !!selectedAccount },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {/* ── Main two-column card ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(400px, 1fr) minmax(320px, auto)",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "background.paper",
          maxHeight: "calc(100vh - 280px)",
        }}
      >
        {/* ── LEFT: Drop zone + stats ── */}
        <Box
          sx={{
            p: 1.5,
            borderRight: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
          }}
        >
          <Stack
            direction={data.length > 0 ? "row" : "column"}
            spacing={2}
            alignItems={data.length > 0 ? "flex-start" : "stretch"}
          >
            <Box sx={{ flex: 'auto' }}>
              <FileDropZone
                onFileUpload={handleFileUpload}
                existingFile={uploadedFile as File | null}
                onRemove={handleRemoveFile}
                onDownload={handleDownload}
              />
              {data.length > 0 && (
                <Box sx={{ width: '100%', pt: 1 }}>
                  <CSVStats data={data} />
                </Box>
              )}
            </Box>
          </Stack>
        </Box>

        {/* ── RIGHT: Configuration ── */}
        <Box
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            overflowY: "auto",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
            }}
          >
            Configuration
          </Typography>

          {/* Date Format */}
          <Box>
            <SingleSelectElement
              required
              label="Date Format"
              options={dateFormatOptions}
              value={dateFormat!}
              onChange={(val) => {
                setDateFormat(val);
                dispatch(setSelectedDateFormat(val));
              }}
            />
          </Box>

          {/* Account */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <SingleSelectElement
                required
                label="Account"
                options={accountGroups.slice(0, 2)}
                value={selectedAccount!}
                onChange={(val) => {
                  setSelectedAccount(val);
                  dispatch(setAccountId(Number(val)));
                }}
              />
              <IconButton
                color="primary"
                onClick={() => setOpenAccountModal(true)}
                size="large"
              >
                <Add />
              </IconButton>
            </Stack>
          </Box>

          <Divider />

          {/* Checklist */}
          <Box sx={{ bgcolor: "grey.50", borderRadius: 2, p: 2 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "text.secondary",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                display: "block",
                mb: 1.5,
              }}
            >
              Checklist
            </Typography>
            <Stack spacing={1}>
              {checklist.map((item) => (
                <Stack
                  key={item.label}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      bgcolor: item.done ? "primary.main" : "grey.200",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    {item.done && (
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "#fff",
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >
                        ✓
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: item.done ? "text.primary" : "text.disabled",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Snackbar */}
      {error && (
        <Snackbar
          message={error}
          color="error"
          onClose={() => setError(null)}
        />
      )}

      {/* Add Account Modal */}
      <ModalElement
        title="Add Account"
        open={openAccountModal}
        onClose={() => setOpenAccountModal(false)}
        maxWidth="sm"
      >
        <AccountForm
          mode="edit"
          editData={{}}
          parentAccounts={parentAccounts}
          groupNames={groupNames}
          onOpenCreateGroup={(type) => console.log("Create group:", type)}
          onSuccess={(newAccount?: { id: number; accountName?: string }) => {
            setOpenAccountModal(false);
            if (newAccount?.id) {
              const newValue = `account_${newAccount.id}`;
              setSelectedAccount(newValue);
              dispatch(setAccountId(newAccount.id));
            }
          }}
        />
      </ModalElement>
    </Box>
  );
}

export default UploadCSV;