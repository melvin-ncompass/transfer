import { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  ZoomIn,
  ZoomOut,
  ArrowBackIosNew,
  ArrowForwardIos,
} from "@mui/icons-material";
import { useLazyGetAttachmentFileQuery } from "../../api/transact.api";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";

interface AttachmentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  attachments: { filename: string; path: string }[];
  currentIndex: number;
  showSnackBar: (msg: string, color: "success" | "error") => void;
}

function AttachmentPreviewModal({
  open,
  onClose,
  attachments,
  currentIndex,
  showSnackBar,
}: AttachmentPreviewModalProps) {
  const [fetchFile] = useLazyGetAttachmentFileQuery();
  const [zoom, setZoom] = useState(1);
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchFileRef = useRef(fetchFile);
  const showSnackBarRef = useRef(showSnackBar);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    fetchFileRef.current = fetchFile;
  }, [fetchFile]);

  useEffect(() => {
    showSnackBarRef.current = showSnackBar;
  }, [showSnackBar]);

  // Sync index
  useEffect(() => {
    setActiveIndex(currentIndex);
    setZoom(1);
  }, [currentIndex]);

  const activeFile = attachments[activeIndex];

  // Fetch file when activeFile changes
  useEffect(() => {
    if (!open || !activeFile?.path) {
      // When closing or no file, revoke any previous URL
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
      setBlobUrl(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setBlobUrl(null);

    // Revoke any previously created URL before creating a new one
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }

    fetchFileRef
      .current(activeFile.path)
      .unwrap()
      .then((res: any) => {
        if (cancelled) return;

        // Normalize different possible response shapes into a Blob
        let blob: Blob | null = null;

        if (res instanceof Blob) blob = res;
        else if (res?.data instanceof Blob) blob = res.data;
        else if (res instanceof ArrayBuffer) blob = new Blob([res]);
        else if (res?.data instanceof ArrayBuffer) blob = new Blob([res.data]);

        if (!blob) {
          console.error("AttachmentPreview: unexpected file response", res);
          throw new Error("Invalid file response");
        }

        try {
          const url = URL.createObjectURL(blob);
          prevUrlRef.current = url;
          setBlobUrl(url);
        } catch (err) {
          console.error("AttachmentPreview: failed to create object URL", err);
          throw err;
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("AttachmentPreview: fetch error", err);
          showSnackBarRef.current?.(
            err?.data?.message || "Failed to fetch file preview",
            "error",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      // revoke the URL created in this effect when cleaning up
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, [activeFile?.path, open]);

  const isImage =
    activeFile?.filename &&
    /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(activeFile.filename);
  const isPDF = activeFile?.filename && /\.pdf$/i.test(activeFile.filename);

  const handleDownload = () => {
    if (!blobUrl) return showSnackBar("No file to download", "error");
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = activeFile.filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handlePrev = () => setActiveIndex((i) => Math.max(i - 1, 0));
  const handleNext = () =>
    setActiveIndex((i) => Math.min(i + 1, attachments.length - 1));

  return (
    <ModalElement
      open={open}
      onClose={onClose}
      title="Attachment Preview"
      maxWidth="md"
      draggable
    >
      <Box
        sx={{
          position: "relative",
          textAlign: "center",
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.paper",
        }}
      >
        {loading && <CircularProgress />}

        {!loading && blobUrl && (
          <>
            {isImage ? (
              <Box
                component="img"
                src={blobUrl}
                alt={activeFile.filename ?? "attachment"}
                sx={{
                  transform: `scale(${zoom})`,
                  transition: "transform 0.2s ease",
                  maxWidth: "100%",
                  maxHeight: "65vh",
                  borderRadius: 1,
                  boxShadow: 2,
                  objectFit: "contain",
                }}
              />
            ) : isPDF ? (
              <Box
                component="iframe"
                src={blobUrl}
                sx={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                  transition: "transform 0.2s ease",
                  width: "100%",
                  height: "65vh",
                  border: "none",
                  borderRadius: 1,
                  bgcolor: "grey.100",
                }}
              />
            ) : (
              <Box sx={{ textAlign: "center" }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Preview not available for this file type.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDownload}
                >
                  Download File
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Carousel */}
        {attachments.length > 1 && (
          <>
            {activeIndex > 0 && (
              <IconButton
                onClick={handlePrev}
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: 16,
                  transform: "translateY(-50%)",
                  bgcolor: "rgba(255,255,255,0.8)",
                  "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                  boxShadow: 2,
                }}
              >
                <ArrowBackIosNew fontSize="small" />
              </IconButton>
            )}
            {activeIndex < attachments.length - 1 && (
              <IconButton
                onClick={handleNext}
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: 16,
                  transform: "translateY(-50%)",
                  bgcolor: "rgba(255,255,255,0.8)",
                  "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                  boxShadow: 2,
                }}
              >
                <ArrowForwardIos fontSize="small" />
              </IconButton>
            )}
          </>
        )}

        {!loading && blobUrl && (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: "50px",
              boxShadow: "0px 2px 10px rgba(0,0,0,0.15)",
              p: 0.5,
              zIndex: 10,
              alignItems: "center",
              backdropFilter: "blur(6px)",
            }}
          >
            <Tooltip title="Zoom Out">
              <span>
                <IconButton
                  onClick={handleZoomOut}
                  size="small"
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Typography
              variant="caption"
              sx={{ minWidth: 40, textAlign: "center" }}
            >
              {Math.round(zoom * 100)}%
            </Typography>

            <Tooltip title="Zoom In">
              <span>
                <IconButton
                  onClick={handleZoomIn}
                  size="small"
                  disabled={zoom >= 3}
                >
                  <ZoomIn fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )}

        {attachments.length > 1 && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              bottom: 50,
              left: "50%",
              transform: "translateX(-50%)",
              color: "text.secondary",
              bgcolor: "rgba(255,255,255,0.8)",
              px: 1,
              borderRadius: 1,
            }}
          >
            {activeIndex + 1} of {attachments.length}
          </Typography>
        )}
      </Box>
    </ModalElement>
  );
}

export default AttachmentPreviewModal;
