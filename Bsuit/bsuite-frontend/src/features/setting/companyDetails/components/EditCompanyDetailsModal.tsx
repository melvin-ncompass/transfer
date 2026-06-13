import { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Grid,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  EditOutlined,
  CloseOutlined,
  Business,
  Image as ImageIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { PrimaryButton } from "../../../../components/atom/button";
import {
  useGetImagesQuery,
  useUpdateImagesMutation,
} from "../api/companyBranding.api";
import {
  setHeader,
  setHeaderModalState,
  setLogo,
  setLogoModalState,
} from "../slice/companyBrandingSlice";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../components/atom/text-field";
import { ImageCropper } from "./ImageUploader";

function EditCompanyDetailsModal({ onSave }: { onSave?: () => void }) {
  const dispatch = useAppDispatch();
  const branding = useAppSelector((state) => state.branding);

  const [errors, setErrors] = useState<{ name?: string; shortName?: string }>(
    {},
  );
  const [serverErrors, setServerErrors] = useState<{
    name?: string;
    shortName?: string;
  }>({});

  const [logoUrl, setLogoUrl] = useState<string>("");
  const [headerUrl, setHeaderUrl] = useState<string>("");

  const { data: imagesData, isLoading: isFetching } = useGetImagesQuery();
  const [updateImagesAPI, { isLoading: isUpdating }] =
    useUpdateImagesMutation();

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");

  const [isShortNameEdited, setIsShortNameEdited] = useState(false);
  const [removeHeader, setRemoveHeader] = useState(false);
  const [removeLogo, setRemoveLogo] = useState(false);

  /* --------------------------------------------------
     HELPERS (LOGIC ONLY)
  -------------------------------------------------- */
  const extractFirstWord = (value: string) => {
    if (!value.trim()) return "";
    return value.trim().split(" ")[0];
  };

  /* --------------------------------------------------
     INIT VALUES
  -------------------------------------------------- */
  useEffect(() => {
    setName(branding.companyName);
    setShortName(branding.shortName);
    setIsShortNameEdited(true); // prevent auto overwrite on load
  }, [branding.companyName, branding.shortName]);

  useEffect(() => {
    if (imagesData?.data) {
      setLogoUrl(imagesData.data.logoUrl || "");
      setHeaderUrl(imagesData.data.headerUrl || "");

      dispatch(setLogo(imagesData.data.logoUrl || ""));
      dispatch(setHeader(imagesData.data.headerUrl || ""));
    }
  }, [imagesData, dispatch]);

  const previewFor = (type: "logo" | "header") => {
    return type === "logo"
      ? branding.logoPreview || logoUrl
      : branding.headerPreview || headerUrl;
  };

  const handleOpenModal = (type: "logo" | "header") => {
    if (type === "logo") dispatch(setLogoModalState(true));
    else dispatch(setHeaderModalState(true));
  };

  const handleRemove = (type: "logo" | "header") => {
    if (type === "logo") {
      dispatch(setLogo(""));
      setLogoUrl("");
      if (logoUrl) setRemoveLogo(true);
    } else {
      dispatch(setHeader(""));
      setHeaderUrl("");
      if (headerUrl) setRemoveHeader(true);
    }
  };

  /* --------------------------------------------------
     COMPANY NAME LOGIC
  -------------------------------------------------- */
  const handleCompanyNameChange = (value: string) => {
    setName(value);

    if (isShortNameEdited && shortName !== extractFirstWord(value)) {
      setShortName(extractFirstWord(value));
      setIsShortNameEdited(false);
    } else if (!isShortNameEdited) {
      setShortName(extractFirstWord(value));
    }

    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleCompanyShortNameChange = (value: string) => {
    setIsShortNameEdited(true);
    setShortName(value);

    if (errors.shortName) {
      setErrors((prev) => ({ ...prev, shortName: undefined }));
    }
  };

  const handleSave = async () => {
    const newErrors: typeof errors = {};

    // Client-side validation
    if (!name.trim()) newErrors.name = "Company name is required";
    if (!shortName.trim())
      newErrors.shortName = "Company short name is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setServerErrors({}); // clear previous server errors

    const fd = new FormData();
    fd.append("companyName", name);
    fd.append("companyShortName", shortName);

    if (removeHeader) fd.append("removeHeaderImage", "true");
    if (removeLogo) fd.append("removeLogo", "true");

    if (branding.logoFile) {
      fd.append("logo", branding.logoFile as Blob);
    } else if (logoUrl !== branding.logoPreview) {
      fd.append("logo", logoUrl);
    }

    if (branding.headerFile) {
      fd.append("headerImage", branding.headerFile as Blob);
    } else if (headerUrl !== branding.headerPreview) {
      fd.append("headerImage", headerUrl);
    }

    try {
      await updateImagesAPI(fd).unwrap();
      onSave?.();
    } catch (err: any) {
      // handle server validation errors
      if (err?.data?.message) {
        // example backend error: "Company name can only contain letters, numbers, and spaces."
        setServerErrors({ name: err.data.message });
      } else {
        console.error("Update branding failed", err);
      }
    }
  };

  /* --------------------------------------------------
     IMAGE BOX
  -------------------------------------------------- */
  const ImageBox = ({
    width,
    height,
    type,
  }: {
    width: number;
    height: number;
    type: "logo" | "header";
  }) => {
    const theme = useTheme();
    const [preview, setPreview] = useState(previewFor(type));

    useEffect(() => {
      setPreview(previewFor(type));
    }, [branding.logoPreview, branding.headerPreview, logoUrl, headerUrl]);

    return (
      <Box
        sx={{
          width,
          height,
          border: "1px solid grey",
          position: "relative",
          backgroundColor: "white",
        }}
      >
        {isFetching ? (
          <Box
            sx={{
              width,
              height,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "white",
                overflow: "hidden",
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt={type}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: type === "logo" ? "contain" : "cover",
                  }}
                />
              ) : type === "logo" ? (
                <Business
                  sx={{ fontSize: 80, color: theme.palette.secondary.main }}
                />
              ) : (
                <ImageIcon
                  sx={{ fontSize: 60, color: theme.palette.secondary.main }}
                />
              )}
            </Box>

            <Tooltip title="Change Image">
              <IconButton
                onClick={() => handleOpenModal(type)}
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  transform: "translate(30%, -30%)",
                  width: 32,
                  height: 32,
                  padding: 0,
                  backgroundColor: "white",
                  border: `2px solid ${theme.palette.secondary.main}`,
                  borderRadius: "50%",
                  ":hover": {},
                  boxShadow: 2,
                }}
              >
                <EditOutlined sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            {preview && (
              <>
                <Tooltip title="Remove Image">
                  <IconButton
                    onClick={() => {
                      setPreview("");
                      handleRemove(type);
                    }}
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      transform: "translate(30%, 30%)",
                      width: 32,
                      height: 32,
                      padding: 0,
                      backgroundColor: theme.palette.error.main,
                      border: `2px solid white`,
                      borderRadius: "50%",
                      boxShadow: 2,
                    }}
                  >
                    <CloseOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                {/* <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(type)}
                    sx={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      bgcolor: "rgba(255,255,255,0.8)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                    }}
                  >
                  </IconButton>
                </Tooltip> */}
              </>
            )}
          </>
        )}
      </Box>
    );
  };

  return (
    <Box width="100%">
      <Grid container spacing={2} alignItems="center">
        <Grid size={4}>
          <Typography>Company Name</Typography>
        </Grid>
        <Grid size={8}>
          <TextFieldElement
            required
            label="Company Name"
            fullWidth
            value={name}
            onChange={(e) => handleCompanyNameChange(e.target.value)}
            error={!!errors.name || !!serverErrors.name}
            helperText={errors.name || serverErrors.name}
          />
        </Grid>

        <Grid size={4}>
          <Typography>Company Short Name</Typography>
        </Grid>
        <Grid size={8}>
          <TextFieldElement
            label="Company Short Name"
            fullWidth
            required
            value={shortName}
            onChange={(e) => handleCompanyShortNameChange(e.target.value)}
            error={!!errors.shortName || !!serverErrors.shortName}
            helperText={errors.shortName || serverErrors.shortName}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Typography>Company Logo</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <ImageBox width={150} height={150} type="logo" />
          <Typography fontSize="12px">
            [Recommended: 200 × 200 pixels]
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Typography>Company Header Image</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <ImageBox width={300} height={75} type="header" />
          <Typography fontSize="12px">
            [Recommended: 2400 × 600 pixels for exported PDFs]
          </Typography>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="end" mt={2}>
        <PrimaryButton onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save"}
        </PrimaryButton>
      </Box>

      <ModalElement
        open={branding.logoModal}
        onClose={() => dispatch(setLogoModalState(false))}
        title="Edit Company Logo"
      >
        <ImageCropper
          aspectRatio={1}
          onCropComplete={(file) => {
            dispatch(setLogo(file));
            dispatch(setLogoModalState(false));
          }}
        />
      </ModalElement>

      <ModalElement
        open={branding.headerModal}
        onClose={() => dispatch(setHeaderModalState(false))}
        title="Edit Company Header Image"
      >
        <ImageCropper
          onCropComplete={(file) => {
            dispatch(setHeader(file));
            dispatch(setHeaderModalState(false));
          }}
        />
      </ModalElement>
    </Box>
  );
}

export default EditCompanyDetailsModal;
