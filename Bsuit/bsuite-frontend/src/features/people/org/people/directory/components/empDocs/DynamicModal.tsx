import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Divider,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  ArrowBackIosNew,
  ArrowForwardIos,
  ZoomOut,
  ZoomIn,
  Download,
} from "@mui/icons-material";
import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../../../components/atom/button";
import { FileUploadField } from "../../../../../../../components/atom/file-upload-field";
import { MultiSelectElement } from "../../../../../../../components/atom/select-field/MultiSelect";
import { SingleSelectElement } from "../../../../../../../components/atom/select-field/SingleSelect";
import { TextFieldElement } from "../../../../../../../components/atom/text-field";
import { useLazyGetAttachmentFileQuery } from "../../../../../../books/transact/transactHome/api/transact.api";
import {
  useUploadEmployeeDocumentMutation,
  useUpdateEmployeeDocumentMutation,
} from "../../../../../me/documents/api/empdoc.api";
import type {
  EmployeeDocumentType,
  EmployeeFolderType,
} from "../../../../documents/emp-documents/api/employee-doc.api";
import { Checkbox } from "../../../../../../../components/atom/check-box";
import { Tooltip } from "../../../../../../../components/atom/tooltip";
import { useGetEmployeeInfoQuery } from "../../../../../api/people.api";
import { Chip } from "../../../../../../../components/atom/chips";
import { useGetEmployeeQuery } from "../../api/directory.api";
import { Snackbar } from "../../../../../../../components/atom/snackbar";
import dayjs from "dayjs";
import { DatePickerElement } from "../../../../../../../components/atom/date-picker";
import { TimePickerElement } from "../../../../../../../components/atom/time-picker";

type FileItem = {
  file: File | null;
  isExisting?: boolean;
};

function DynamicModal({
  folder,
  docData,
  customFields,
  employeeId,
  attachments = [],
  onClose,
  rejected,
  detailsId,
  view,
}: {
  folder: EmployeeFolderType;
  docData: EmployeeDocumentType;
  customFields: any;
  employeeId: string;
  attachments: { path: string; filename: string }[];
  onClose: () => void;
  rejected: boolean;
  detailsId?: number | null;
  view: boolean;
}) {
  const [getFile] = useLazyGetAttachmentFileQuery();
  const [existingAttachments, setExistingAttachments] = useState<
    { filename: string; blob: Blob; url: string }[]
  >([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const { data: info } = useGetEmployeeInfoQuery();

  const { data: employeeInfo } = useGetEmployeeQuery(Number(employeeId));
  const managerId = employeeInfo?.data?.reportingToEmployee?.id;

  // States for form inputs
  const [files, setFiles] = useState<FileItem[]>([]); // For Multiple
  const [file, setFile] = useState<File | null>(null); // For Single
  const [isExistingSingle, setIsExistingSingle] = useState(false); // For Single tracking
  const [isDirty, setIsDirty] = useState(false);
  // Guard: only initialize from server once
  const [hasInitializedFiles, setHasInitializedFiles] = useState(false);

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [notApplicable, setNotApplicable] = useState<boolean>(false);
  const [deletedAttachments, setDeletedAttachments] = useState<string[]>([]);

  const [uploadDocument] = useUploadEmployeeDocumentMutation();
  const [updateDocument] = useUpdateEmployeeDocumentMutation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    color: "success",
  });

  // Preview States
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewFiles, setPreviewFiles] = useState<{ file: File; url: string }[]>([]);

  useEffect(() => {
    let currentFiles: File[] = [];
    if (docData?.attachmentType === "single") {
      if (file) currentFiles = [file];
    } else {
      currentFiles = files.filter((f) => f.file).map((f) => f.file as File);
    }

    const newPreviews = currentFiles.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setPreviewFiles(newPreviews);

    setActiveIndex((prev) => {
      if (newPreviews.length === 0) return 0;
      return Math.min(prev, newPreviews.length - 1);
    });

    return () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [file, files, docData?.attachmentType]);

  const activeFile = previewFiles[activeIndex];
  const isImage = activeFile?.file.type.startsWith("image");
  const isPDF = activeFile?.file.name?.toLowerCase().endsWith(".pdf");

  /* 1. Fetch binary files for preview */
  useEffect(() => {
    const fetchFiles = async () => {
      if (!attachments.length) {
        setExistingAttachments([]);
        return;
      }
      setLoadingFiles(true);
      const results = await Promise.all(
        attachments.map(async (attachment) => {
          const res = await getFile(attachment.path);
          if (res.data) {
            const blob = res.data as Blob;
            const url = URL.createObjectURL(blob);
            return { filename: attachment.filename, blob, url };
          }
          return null;
        }),
      );
      const filtered = results.filter(Boolean) as any[];
      setExistingAttachments(filtered);
      setLoadingFiles(false);
    };

    fetchFiles();
    return () => {
      existingAttachments.forEach((f) => URL.revokeObjectURL(f.url));
    };
  }, [attachments]);

  /* 2. Initialize Form Values from props */
  useEffect(() => {
    if (customFields?.value) {
      setFormValues(customFields.value);
    }
  }, [customFields]);

  /** Checkbox always starts unchecked; checking N/A enables submit (with valid form). */
  useEffect(() => {
    setNotApplicable(false);
  }, [docData?.id]);

  /* 3. Sync fetched files to Input States (File/Files) */
  useEffect(() => {
    if (!docData || loadingFiles || existingAttachments.length === 0 || hasInitializedFiles) return;

    if (docData.attachmentType === "single") {
      if (!file) {
        const first = existingAttachments[0];
        setFile(new File([first.blob], first.filename, { type: first.blob.type }));
        setIsExistingSingle(true);
      }
    } else if (docData.attachmentType === "multiple") {
      // Initialize Multiple only if empty
      if (files.length === 0 || (files.length === 1 && !files[0].file)) {
        setFiles(
          existingAttachments.map((f) => ({
            file: new File([f.blob], f.filename, { type: f.blob.type }),
            isExisting: true,
          })),
        );
      }
    }
    setHasInitializedFiles(true);
  }, [existingAttachments, docData, loadingFiles, hasInitializedFiles]);

  const handlePrev = () => setActiveIndex((i) => Math.max(i - 1, 0));
  const handleNext = () =>
    setActiveIndex((i) => Math.min(i + 1, previewFiles.length - 1));

  const handleDownload = () => {
    const active = previewFiles[activeIndex];
    if (!active) return;
    const link = document.createElement("a");
    link.href = active.url;
    link.download = active.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // PART A: ATTACHMENTS (JSON Pointers)
      // Filter out anything the user deleted or replaced
      const attachmentsToKeep = attachments.filter(
        (original) => !deletedAttachments.includes(original.filename),
      );
      formData.append("attachments", JSON.stringify(attachmentsToKeep));

      // PART B: FILES (Binary Blobs)
      if (docData.attachmentType === "single") {
        if (file && !isExistingSingle) {
          formData.append("files", file);
        }
      } else {
        files.forEach((item) => {
          if (item.file && !item.isExisting) {
            formData.append("files", item.file);
          }
        });
      }

      // PART C: Form Data
      formData.append("isNotApplicable", String(notApplicable));
      formData.append("customFields", JSON.stringify(formValues));
      if (detailsId) formData.append("detailsId", String(detailsId));
      if (!rejected) {
        await uploadDocument({
          employeeId,
          typeId: docData.id,
          body: formData,
        }).unwrap();
      } else {
        await updateDocument({
          employeeId,
          typeId: docData.id,
          body: formData,
          detailsId,
        }).unwrap();
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.data?.message || err?.message || "Something went wrong";
      setSnackbarState({
        open: true,
        message: errMsg,
        color: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDynamicField = (field: any) => {
    const commonProps = {
      label: field.fieldLabel,
      required: field.isMandatory,
      value: formValues[field.fieldLabel] || "",
      fullWidth: true,
      disabled: view,
    };

    switch (field.fieldType) {
      case "text":
      case "Text":
      case "text_area":
      case "Text Area":
        return (
          <TextFieldElement
            {...commonProps}
            name={field.fieldLabel}
            multiline={field.fieldType.toLowerCase().includes("area")}
            rows={field.fieldType.toLowerCase().includes("area") ? 3 : undefined}
            onChange={(e) => {
              setIsDirty(true);
              setFormValues((prev) => ({
                ...prev,
                [field.fieldLabel]: e.target.value,
              }))
            }}
          />
        );
      case "number":
      case "Number":
        return (
          <TextFieldElement
            {...commonProps}
            type="number"
            name={field.fieldLabel}
            onChange={(e) => {
              setIsDirty(true);
              setFormValues((prev) => ({
                ...prev,
                [field.fieldLabel]: e.target.value,
              }))
            }}
          />
        );
      case "date":
      case "Date":
        return (
          <DatePickerElement
            {...commonProps}
            value={formValues[field.fieldLabel] ? dayjs(formValues[field.fieldLabel]) : null}
            onChange={(val) => {
              setIsDirty(true);
              setFormValues((prev) => ({
                ...prev,
                [field.fieldLabel]: val ? val.format("YYYY-MM-DD") : "",
              }))
            }}
          />
        );
      case "time":
      case "Time":
        return (
          <TimePickerElement
            {...commonProps}
            value={formValues[field.fieldLabel] ? dayjs(formValues[field.fieldLabel], "HH:mm") : null}
            onChange={(val) => {
              setIsDirty(true);
              setFormValues((prev) => ({
                ...prev,
                [field.fieldLabel]: val ? val.format("HH:mm") : "",
              }))
            }}
          />
        );
      case "Single Select":
        return (
          <SingleSelectElement
            {...commonProps}
            options={
              (field.values as string[])?.map((val) => ({
                label: val,
                value: val,
              })) || []
            }
            onChange={(val: string) => {
              setIsDirty(true);
              setFormValues((prev) => ({ ...prev, [field.fieldLabel]: val }))
            }}
          />
        );
      case "Multi Select":
      case "Multiple Select":
        return (
          <MultiSelectElement
            {...commonProps}
            value={
              Array.isArray(formValues[field.fieldLabel])
                ? formValues[field.fieldLabel]
                : []
            }
            options={
              (field.values as string[])?.map((val) => ({
                label: val,
                value: val,
              })) || []
            }
            onChange={(vals: string[]) => {
              setIsDirty(true);
              setFormValues((prev) => ({ ...prev, [field.fieldLabel]: vals }))
            }}
          />
        );
      default:
        return null;
    }
  };

  const hasAtLeastOneCustomFieldFilled = docData.customFormFields?.some(
    (f: any) => {
      const val = formValues[f.fieldLabel];
      return Array.isArray(val) ? val.length > 0 : !!val;
    },
  );

  const isFileRequired = !notApplicable && !docData.isFileUploadOptional;

  const missingFields = [
    // Mandatory custom fields (only if not marked N/A)
    ...(!notApplicable
      ? docData.customFormFields
          ?.filter((f: any) => {
            if (!f.isMandatory) return false;
            const val = formValues[f.fieldLabel];
            return Array.isArray(val) ? val.length === 0 : !val;
          })
          .map((f: any) => f.fieldLabel) || []
      : []),

    // Optional uploads (and not marked N/A): require at least one custom field when the type defines any
    ...(docData.customFormFields?.length > 0 &&
    docData.isFileUploadOptional &&
    !notApplicable &&
    !hasAtLeastOneCustomFieldFilled
      ? ["At least one field must be filled"]
      : []),

    // File validation only if required
    ...(isFileRequired && docData.attachmentType === "single" && !file
      ? ["File upload"]
      : []),

    ...(isFileRequired &&
      docData.attachmentType === "multiple" &&
      (files.length === 0 || files.some((f) => !f.file))
      ? ["One or more file uploads"]
      : []),
  ];

  // Instagram-style dot pagination with windowing
  const total = previewFiles.length;
  let start = 0;
  let end = total;
  if (total > 5) {
    if (activeIndex <= 3) {
      start = 0;
      end = 5;
    } else if (activeIndex >= total - 4) {
      start = total - 5;
      end = total;
    } else {
      start = activeIndex - 2;
      end = activeIndex + 3;
    }
  }
  const visibleDots = previewFiles.slice(start, end);

  return (
    <Box p={2} height="100%" display="flex" flexDirection="column" gap={1}>
      <Box>
        <Typography variant="h6" fontWeight={600}>
          {docData.documentTypeName}
        </Typography>
        {activeFile && (
          <Typography variant="caption" color="text.secondary">
            {activeFile.file.name}
          </Typography>
        )}
      </Box>

      <Box display="flex" flex={1} minHeight={0} gap={2}>
        {!view && (
          <Stack
            spacing={3}
            width="50%"
            sx={{
              overflowY: "auto",
              pr: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >

        {docData.isNotApplicable && !view && (
          <Checkbox
            label="Mark as Not Applicable"
            checked={notApplicable}
            onChange={() => {
              setIsDirty(true);
              setNotApplicable(!notApplicable);
            }}
            disabled={view}
          />
        )}

        {/* Single file upload with chip */}
        {!view &&
          (docData.attachmentType === "single" ? (
            <>
              <FileUploadField
                label="Upload Document"
                multiple={false}
                value={file}
                disabled={view}
                accept="application/pdf,image/*"
                maxSize={5}
                onChange={(f) => {
                  setIsDirty(true);
                  if (f instanceof File) {
                    if (isExistingSingle && file) {
                      setDeletedAttachments((prev) => [...prev, file.name]);
                    }
                    setFile(f);
                    setIsExistingSingle(false);
                  } else if (!f) {
                    if (isExistingSingle && file) {
                      setDeletedAttachments((prev) => [...prev, file.name]);
                    }
                    setFile(null);
                    setIsExistingSingle(false);
                  }
                }}
              />
              {file && !view && (
                <Stack direction="row" flexWrap="wrap" gap={1} pt={1}>
                  <Chip
                    label={file.name}
                    onDelete={() => {
                      setIsDirty(true);
                      if (isExistingSingle && file) {
                        setDeletedAttachments((prev) => [...prev, file.name]);
                      }
                      setFile(null);
                      setIsExistingSingle(false);
                    }}
                  />
                </Stack>
              )}
            </>
          ) : (
            /* Multiple file upload with chips */
            <Stack spacing={1}>
              <FileUploadField
                label="Upload Documents"
                multiple={true}
                value={files.map((f) => f.file!).filter(Boolean)}
                disabled={view}
                accept="application/pdf,image/*"
                maxSize={5}
                onChange={(newFiles) => {
                  if (Array.isArray(newFiles)) {
                    setIsDirty(true);
                    const existingItems = files.filter((f) => f.isExisting);
                    const localItems = files.filter((f) => !f.isExisting);

                    const removedExisting = existingItems.filter(
                      (old) => old.file && !newFiles.includes(old.file),
                    );
                    removedExisting.forEach((old) => {
                      if (old.file) {
                        setDeletedAttachments((prev) => [...prev, old.file!.name]);
                      }
                    });

                    const brandNew = newFiles
                      .filter((nf) => !files.some((f) => f.file === nf))
                      .map((f) => ({ file: f, isExisting: false }));

                    const keptExisting = existingItems.filter(
                      (old) => old.file && newFiles.includes(old.file),
                    );
                    setFiles([...keptExisting, ...localItems, ...brandNew]);
                  } else if (!newFiles) {
                    setIsDirty(true);
                    files.forEach((old) => {
                      if (old.isExisting && old.file) {
                        setDeletedAttachments((prev) => [...prev, old.file!.name]);
                      }
                    });
                    setFiles([]);
                  }
                }}
              />
              {files.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1} pt={1}>
                  {files.map((item, i) =>
                    item.file ? (
                      <Chip
                        key={i}
                        label={item.file.name}
                        onDelete={
                          view
                            ? undefined
                            : () => {
                                setIsDirty(true);
                                if (item.isExisting && item.file) {
                                  setDeletedAttachments((prev) => [
                                    ...prev,
                                    item.file!.name,
                                  ]);
                                }
                                setFiles((prev) =>
                                  prev.filter((_, idx) => idx !== i),
                                );
                              }
                        }
                      />
                    ) : null,
                  )}
                </Stack>
              )}
            </Stack>
          ))}

        {docData.customFormFields?.length > 0 && (
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Additional Information
            </Typography>
            {docData.customFormFields.map((field: any, index: number) => (
              <Box key={index}>{renderDynamicField(field)}</Box>
            ))}
          </Stack>
        )}
      </Stack>
    )}

    {!view && <Divider orientation="vertical" flexItem />}

        {/* Preview Section */}
        <Box
          width={view ? "100%" : "50%"}
        display="flex"
        justifyContent="center"
        alignItems="center"
        position="relative"
        bgcolor="#f5f5f5"
        borderRadius={1}
      >
        {loadingFiles ? (
          <CircularProgress />
        ) : previewFiles.length > 0 ? (
          <>
            {/* Download button — top-right */}
            {((
              // Admin with download permission
              (info?.data.isAdmin && folder.globalAdminPermission.download) ||
              // Current employee with self download permission
              (employeeId === String(info?.data.employeeId) && folder.employeeSelfPermission.download) ||
              // check permission of reporting manager. if manager is logged in user
              (managerId === info?.data.employeeId && folder.reportingManagerPermission.download)
            )) && (
              <Box
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  display: "inline-flex",
                }}
              >
                <Tooltip title="Download" placement="top">
                  <PrimaryIconButton
                    variant="outlined"
                    onClick={handleDownload}
                    size="small"
                    icon={<Download fontSize="small" />}
                  />
                </Tooltip>
              </Box>
            )}

            <Box
              sx={{
                overflow: "hidden",
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isImage ? (
                <Box
                  component="img"
                  src={activeFile.url}
                  sx={{
                    transition: "0.2s",
                    maxWidth: "90%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />
              ) : isPDF ? (
                <Box
                  component="iframe"
                  src={activeFile.url}
                  sx={{
                    width: "100%",
                    height: "70vh",
                    border: "none",
                  }}
                />
              ) : (
                <Box textAlign="center">
                  <Typography sx={{ mb: 2 }}>No Preview Available</Typography>
                  {((
                    // Admin with download permission
                    (info?.data.isAdmin && folder.globalAdminPermission.download) ||
                    // Current employee with self download permission
                    (employeeId === String(info?.data.employeeId) && folder.employeeSelfPermission.download) ||
                    // Reporting manager with download permission (not admin, not self)
                    (managerId === info?.data.employeeId && folder.reportingManagerPermission.download)
                  )) && (
                    <Button variant="contained" onClick={handleDownload}>
                      Download {activeFile.file.name}
                    </Button>
                  )}
                </Box>
              )}
            </Box>


            {/* Pagination arrows + Instagram-style dots */}
            {previewFiles.length > 1 && (
              <>
                <PrimaryIconButton
                  onClick={handlePrev}
                  disabled={activeIndex === 0}
                  sx={{ position: "absolute", left: 1 }}
                  icon={<ArrowBackIosNew />}
                  variant="outlined"
                />
                <PrimaryIconButton
                  onClick={handleNext}
                  disabled={activeIndex === previewFiles.length - 1}
                  sx={{ position: "absolute", right: 1 }}
                  variant="outlined"
                  icon={<ArrowForwardIos />}
                />

                {/* Windowed dot indicators */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  {visibleDots.map((_, idx) => {
                    const realIndex = start + idx;
                    const isActive = realIndex === activeIndex;
                    return (
                      <Box
                        key={realIndex}
                        onClick={() => setActiveIndex(realIndex)}
                        sx={{
                          width: isActive ? 10 : 6,
                          height: 6,
                          borderRadius: isActive ? "6px" : "50%",
                          bgcolor: isActive ? "#000" : "#bbb",
                          transition: "all 0.2s",
                          cursor: "pointer",
                          opacity: isActive ? 1 : 0.6,
                        }}
                      />
                    );
                  })}
                </Box>
              </>
            )}
          </>
        ) : (
          <Typography color="text.secondary">No files to preview</Typography>
        )}
      </Box>
      </Box>

      {!view && (
        <Box display="flex" justifyContent="flex-end" pt={1}>
          <Tooltip
            title={
              missingFields.length
                ? `Required: ${missingFields.join(", ")}`
                : !isDirty && !notApplicable
                  ? "No changes to submit"
                  : ""
            }
            placement="top"
          >
            <span>
              <PrimaryButton
                onClick={handleSubmit}
                disabled={
                  missingFields.length > 0 || (!isDirty && !notApplicable) || isSubmitting
                }
              >
                {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Submit"}
              </PrimaryButton>
            </span>
          </Tooltip>
        </Box>
      )}

      {snackbarState.open && (
        <Snackbar
          message={snackbarState.message}
          color={snackbarState.color}
          onClose={() => setSnackbarState((prev) => ({ ...prev, open: false }))}
        />
      )}
    </Box>
  );
}

export default DynamicModal;
