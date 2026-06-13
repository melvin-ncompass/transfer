import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Typography,
  FormControl,
  Select,
  MenuItem,
  Box,
  Divider,
  IconButton,
} from "@mui/material";
import { ModalElement } from "../../../components/dialogs/modal-element";
import {
  useGetDriveAttachmentsQuery,
  useGetStorageDataQuery,
  useSaveFolderForDriveToBucketMutation,
  useSaveGoogleFolderMutation,
  useVerifyGoogleTokenMutation,
} from "./api/google.api";
import { PrimaryButton } from "../../../components/atom/button";
import { Checkbox } from "../../../components/atom/check-box";
import { Snackbar } from "../../../components/atom/snackbar";
import CustomCircularProgress from "../../../components/atom/circular-progress/CircularProgress";
import { useGetHeaderDataQuery } from "../../company/api/company.api";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelIcon from "@mui/icons-material/Cancel";
import { Tooltip } from "../../../components/atom/tooltip";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import { PermissionGuard } from "../../../guards/ComponentGuard";
import { Stack } from "@mui/system";
type ModalStep =
  | "NONE"
  | "REAUTH"
  | "DB_TO_DRIVE"
  | "REMOVE_SWITCH_CONFIRM"
  | "MIGRATE_SWITCH_CONFIRM"
  | "DRIVE_TO_DB"
  | "DRIVE_TO_DRIVE"
  | "MIGRATION_LOSS"
  | "MIGRATION_READY";
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}
type StorageState = "default" | "drive" | "REAUTH" | null;

export default function GoogleDriveView() {
  const [searchParams] = useSearchParams();
  const [storageType, setStorageType] = useState("");
  const [currentStorage, setCurrentStorage] = useState<StorageState>(null);
  const [modalStep, setModalStep] = useState<ModalStep>("NONE");
  const [previousStep, setPreviousStep] = useState<ModalStep>("NONE");
  const [migrateStep, setMigrateStep] = useState<ModalStep>("NONE");
  const [isRetain, setRetain] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const {
    data: storageDetails,
    error: storagErrorData,
    isError: isStorageError,
    isSuccess: isStorageSuccess,
  } = useGetStorageDataQuery();
  const [reauthTriggered, setReauthTriggered] = useState(false);
  const [verifyToken] = useVerifyGoogleTokenMutation();
  const [saveGoogleFolderMutation, { isLoading }] =
    useSaveGoogleFolderMutation();
  const [saveFolderForDriveToBucket, { isLoading: loading }] =
    useSaveFolderForDriveToBucketMutation();
  const { data: attachmentDetails } = useGetDriveAttachmentsQuery();
  const { data: headerData } = useGetHeaderDataQuery();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({
    open: false,
    message: "",
    color: "success",
  });
  const showSnackbar = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });
  const pickerOpened = useRef(false);
  /* ---------------- GOOGLE CONNECT ---------------- */

  const handleConnect = (action: string) => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}storage/google/drive/connect?action=${action}&retain=${isRetain}`;
  };
  /* ---------------- SAVE GOOGLE FOLDER ---------------- */

  const saveGoogleFolder = async (
    folderId: string,
    folderName: string,
    driveState: string,
  ) => {
    try {
      await saveGoogleFolderMutation({
        folderId,
        folderName,
        driveState,
      }).unwrap();
      showSnackbar(`Folder saved successfull!`, "success");
    } catch (err: any) {
      showSnackbar(err?.data?.message, "error");
    }
  };

  const handleFolderSaveForDriveToBucket = async (
    action: string,
    retain: boolean,
  ) => {
    try {
      await saveFolderForDriveToBucket({
        action,
        retain,
      }).unwrap();
      showSnackbar(`Folder saved successfully!`, "success");
    } catch (err: any) {
      showSnackbar(err?.data?.message, "error");
    }
  };
  /* ---------------- GOOGLE PICKER ---------------- */

  const checkFolderPermission = async (
    folderId: string,
    accessToken: string,
  ) => {
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,capabilities(canAddChildren,canEdit,canRemoveChildren,canRename,canListChildren,canModifyContent,canTrash)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!res.ok) {
        console.error("Failed to fetch folder:", res.status, await res.text());
        return { hasPermission: false, issues: ["Unable to access folder"] };
      }

      const data = await res.json();
      const caps = data.capabilities;

      if (!caps) {
        return { hasPermission: false, issues: ["Capabilities not available"] };
      }

      const issues: string[] = [];

      if (!caps.canAddChildren) issues.push("Upload (Add Files)");
      if (!caps.canEdit) issues.push("Edit");
      if (!caps.canRemoveChildren) issues.push("Delete Files");
      if (!caps.canRename) issues.push("Rename Folder");
      if (!caps.canListChildren) issues.push("List Files");
      if (!caps.canModifyContent) issues.push("Modify Content");

      return {
        hasPermission: issues.length === 0,
        issues,
        folderName: data.name,
      };
    } catch (err) {
      console.error("Permission check failed", err);
      return { hasPermission: false, issues: ["Permission check failed"] };
    }
  };

  let pickerInstance: any = null;

  const createPicker = (accessToken: string, driveState: string) => {
    const view = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
      .setMimeTypes("application/vnd.google-apps.folder");

    try {
      if (pickerInstance) {
        pickerInstance.setVisible(false);
      }

      pickerInstance = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setOrigin(window.location.origin)
        .enableFeature(window.google.picker.Feature.SUPPORT_DRIVES)
        .setCallback(async (data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const folder = data.docs[0];

            const permissionResult = await checkFolderPermission(
              folder.id,
              accessToken,
            );

            if (!permissionResult.hasPermission) {
              const issues = permissionResult.issues.join(", ");
              showSnackbar(`Missing folder permissions: ${issues}`, "error");

              //  Keep the existing picker open instead of recreating it
              pickerInstance.setVisible(true);
              return;
            }

            saveGoogleFolder(folder.id, folder.name, driveState);
          }
        })
        .build();

      pickerInstance.setVisible(true);
    } catch (err) {
      console.error("Picker failed", err);
      showSnackbar("Reauthentication Failed!", "error");
    }
  };

  const loadPicker = (accessToken: string, driveState: string) => {
    if (window.google?.picker) {
      createPicker(accessToken, driveState);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;

    script.onload = () => {
      window.gapi.load("picker", {
        callback: () => createPicker(accessToken, driveState),
      });
    };

    document.body.appendChild(script);
  };

  /* ---------------- STORAGE SWITCH ---------------- */

  const handleStorageChange = (value: string) => {
    setStorageType(value);

    if (
      currentStorage === "default" &&
      value === "Self Managed (Google Drive)"
    ) {
      setModalStep("DB_TO_DRIVE");
    }

    if (currentStorage === "drive" && value === "Default Storage") {
      setModalStep("DRIVE_TO_DB");
    }

    if (currentStorage === "drive" && value === "Self Managed (Google Drive)") {
      setModalStep("DRIVE_TO_DRIVE");
    }
  };
  /* ----------------  API HANDLERS ---------------- */

  const removeAndSwitch = () => {
    if (previousStep == "DB_TO_DRIVE" || previousStep === "DRIVE_TO_DRIVE") {
      handleConnect("delete");
    } else if (previousStep == "DRIVE_TO_DB") {
      handleFolderSaveForDriveToBucket("delete", isRetain);
    }
    setModalStep("NONE");
  };

  const migrateAndSwitch = () => {
    if (migrateStep == "DB_TO_DRIVE" || migrateStep == "DRIVE_TO_DRIVE") {
      handleConnect("migrate");
    } else if (migrateStep == "DRIVE_TO_DB") {
      handleFolderSaveForDriveToBucket("migrate", isRetain);
    }
    setModalStep("NONE");
  };

  const handleReauth = () => {
    setReauthTriggered(true); // mark that user clicked ReAuth
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}storage/reauth/google/drive/connect?companyId=${headerData?.data?.companyId}`;
  };
  /* ---------------- MODAL CONTENT ---------------- */

  const renderModalContent = () => {
    switch (modalStep) {
      case "DB_TO_DRIVE":
        return (
          <>
            <Typography sx={{ mb: 2 }}>
              You are updating your storage from Default Storage to Google
              Drive.
            </Typography>

            <Typography>➜ Migrate existing attachments</Typography>

            <Typography color="error" sx={{ mb: 3 }}>
              ✕ Remove all existing attachments without migration
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <PrimaryButton
                color="error"
                variant="contained"
                onClick={() => {
                  setModalStep("REMOVE_SWITCH_CONFIRM");
                  setPreviousStep("DB_TO_DRIVE");
                }}
              >
                Remove & Switch
              </PrimaryButton>

              <PrimaryButton
                variant="contained"
                color="success"
                onClick={() => {
                  setModalStep("MIGRATE_SWITCH_CONFIRM");
                  setMigrateStep("DB_TO_DRIVE");
                }}
              >
                Migrate & Switch
              </PrimaryButton>
            </Box>
          </>
        );
      case "DRIVE_TO_DB":
        return (
          <>
            <Typography sx={{ mb: 2 }}>
              Switching from Self-Managed Google Drive to Default Storage
            </Typography>

            <Typography>➜ Migrate existing attachments</Typography>

            <Typography color="error" sx={{ mb: 3 }}>
              ✕ Remove all existing attachments without migration
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <PrimaryButton
                color="error"
                variant="contained"
                onClick={() => {
                  setModalStep("REMOVE_SWITCH_CONFIRM");
                  setPreviousStep("DRIVE_TO_DB");
                }}
              >
                Remove & Switch
              </PrimaryButton>

              {storageDetails?.type === "google_drive" && storageDetails?.healthy && (
                <PrimaryButton
                  variant="contained"
                  sx={{ backgroundColor: "#4CAF50" }}
                  onClick={() => {
                    setModalStep("MIGRATE_SWITCH_CONFIRM");
                    setMigrateStep("DRIVE_TO_DB");
                  }}
                >
                  Migrate & Switch
                </PrimaryButton>
              )}
            </Box>
          </>
        );

      case "DRIVE_TO_DRIVE":
        return (
          <>
            <Typography sx={{ mb: 2 }}>
              Switching from Self-Managed Google Drive to another Drive storage
            </Typography>

            <Typography>➜ Migrate existing attachments</Typography>

            <Typography color="error" sx={{ mb: 3 }}>
              ✕ Remove all existing attachments without migration
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <PrimaryButton
                onClick={() => {
                  setModalStep("REMOVE_SWITCH_CONFIRM");
                  setPreviousStep("DRIVE_TO_DRIVE");
                }}
              >
                Remove & Switch
              </PrimaryButton>

              {storageDetails?.type === "google_drive" && storageDetails?.healthy && (
                <PrimaryButton
                  color="error"
                  variant="contained"
                  onClick={() => {
                    setModalStep("MIGRATE_SWITCH_CONFIRM");
                    setMigrateStep("DRIVE_TO_DRIVE");
                  }}
                >
                  Migrate & Switch
                </PrimaryButton>
              )}
            </Box>
          </>
        );

      case "REMOVE_SWITCH_CONFIRM":
        return (
          <>
            <Typography>You will lose access to the below files</Typography>
            {attachmentDetails.length === 0 ? (
              <Typography sx={{ mt: 2 }}>
                Currently there are no attachments
              </Typography>
            ) : (
              <>
                {attachmentDetails.map((ele: any) => {
                  return (
                    <Typography key={ele.type}>
                      {ele.type} : {ele.totalCount}
                    </Typography>
                  );
                })}

                {(previousStep === "DRIVE_TO_DRIVE" ||
                  previousStep === "DRIVE_TO_DB") && (
                    <Typography>
                      <Checkbox onChange={() => setRetain(!isRetain)} />
                      Retain all attachments
                    </Typography>
                  )}
              </>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <PrimaryButton
                variant="contained"
                color="secondary"
                onClick={() => setModalStep(previousStep)}
              >
                Back
              </PrimaryButton>

              <PrimaryButton
                variant="contained"
                color="success"
                onClick={removeAndSwitch}
              >
                Proceed
              </PrimaryButton>
            </Box>
          </>
        );
      case "MIGRATE_SWITCH_CONFIRM":
        return (
          <>
            <Typography>Below files will be migrated</Typography>
            {attachmentDetails.length === 0 ? (
              <Typography sx={{ mt: 2 }}>
                Currently there are no attachments
              </Typography>
            ) : (
              <>
                {attachmentDetails.map((ele: any) => {
                  return (
                    <Typography key={ele.type}>
                      {ele.type} : {ele.totalCount}
                    </Typography>
                  );
                })}

                {(previousStep === "DRIVE_TO_DRIVE" ||
                  previousStep === "DRIVE_TO_DB") && (
                    <Typography>
                      <Checkbox onChange={() => setRetain(!isRetain)} />
                      Retain all attachments
                    </Typography>
                  )}
              </>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <PrimaryButton
                variant="contained"
                color="secondary"
                onClick={() => setModalStep("DB_TO_DRIVE")}
              >
                Back
              </PrimaryButton>

              <PrimaryButton
                variant="contained"
                color="success"
                onClick={migrateAndSwitch}
              // onClick={migrateAndSwitch}
              >
                Proceed
              </PrimaryButton>
            </Box>
          </>
        );

      default:
        return null;
    }
  };
  /* ---------------- TOKEN FLOW ---------------- */
  useEffect(() => {
    const token = searchParams.get("token");

    if (!token || pickerOpened.current) return;

    const verify = async () => {
      try {
        const res = await verifyToken({ token }).unwrap();

        const accessToken = res?.data?.accessToken;

        if (accessToken) {
          pickerOpened.current = true;

          loadPicker(accessToken, token);

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      } catch (err) { }
    };

    verify();
  }, []);
  useEffect(() => {
    const authStatus = searchParams.get("reauth");

    if (!authStatus) return;

    if (authStatus === "success") {
      showSnackbar("Reauthentication Successfully!", "success");
    } else {
      showSnackbar("Reauthentication Failed!", "error");
    }

    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);
  /* ---------------- UI ---------------- */

  useEffect(() => {
    // Handle auth error first

    if (isStorageError) {
      setCurrentStorage("REAUTH");
      return;
    }

    if (isStorageSuccess) {
      // Handle success response
      if (storageDetails?.type === "gcp_bucket") {
        setCurrentStorage("default");
      } else if (storageDetails?.type === "google_drive") {
        setCurrentStorage("drive");
      }
    }
  }, [storageDetails, storagErrorData, isStorageError, isStorageSuccess]);

  useEffect(() => {
    console.log("current", isRetain);
  }, [isRetain]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          alignItems: "flex-start",
          p: 3,
          border: "1px solid #e0e0e0",
          borderRadius: 1,
          backgroundColor: "#fff",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Storage Location
          </Typography>
          {(isLoading || loading) && (
            <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CustomCircularProgress size={16} />
              Migration in progress. Please wait...
            </Typography>
          )}

          <Typography variant="body2" sx={{ mt: 1 }}>
            {currentStorage === "default" ? (
              "Default Storage"
            ) : currentStorage === "REAUTH" ? (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Typography>Self Managed (Google Drive)</Typography>

                  <Tooltip title="Authentication Failed Click to Authenticate">
                    <IconButton color="error" onClick={handleReauth}>
                      <NewReleasesIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography variant="body2">Self Managed (Google Drive)</Typography>
                {storageDetails?.folderName && (
               
                  <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">Folder Name: </Typography>
                    <Typography variant="body2">{storageDetails.folderName} </Typography>
                  </Stack>
                 
                )}
              </Box>
            )}
          </Typography>
        </Box>

       <PermissionGuard permission={"update_business_settings"}>
         <Box>
          {!showDropdown ? (
            <PrimaryButton onClick={() => setShowDropdown(true)}>
              Switch Storage
            </PrimaryButton>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <Select
                  displayEmpty
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value)}
                  renderValue={(selected) =>
                    selected ? selected : "Select an option"
                  }
                >
                  {currentStorage !== "default" && (
                    <MenuItem value="Default Storage">Default Storage</MenuItem>
                  )}

                  <MenuItem value="Self Managed (Google Drive)">
                    Self Managed (Google Drive)
                  </MenuItem>
                </Select>
              </FormControl>

              {/* APPLY */}
              <IconButton
                color="success"
                disabled={!storageType}
                onClick={() => {
                  handleStorageChange(storageType);
                  setShowDropdown(false);
                }}
              >
                <CheckCircleOutlineIcon />
              </IconButton>

              <IconButton
                color="error"
                onClick={() => {
                  setShowDropdown(false);
                  setStorageType("");
                }}
              >
                <CancelIcon />
              </IconButton>
            </Box>
          )}
        </Box>
       </PermissionGuard>
      </Box>

      {/* Dynamic Modal */}

      <ModalElement
        title="Document Storage - Data Migration"
        open={modalStep !== "NONE"}
        onClose={() => {
          setModalStep("NONE"), setStorageType("");
          setRetain(false);
        }}
        maxWidth="lg"
      >
        <Box sx={{ p: 2 }}>{renderModalContent()}</Box>
      </ModalElement>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        />
      )}
    </>
  );
}
