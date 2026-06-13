import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import type { ModalElementProps } from "../../../types/types";
import { useRef, useEffect, useState } from "react";
import { PrimaryButton } from "../../atom/button";
import { Tooltip } from "../../atom/tooltip";
export function ModalElement({
  open,
  title,
  children,
  onClose,
  height,
  maxWidth = "sm",
  hideCloseButton = false,
  keepMounted = false,
  sx,
  contentSx,
  draggable = false,
  onClick,
  disabled,
  disabledActionTooltip,
  headerActions,
  leftHeaderAction,
}: ModalElementProps) {
  const theme = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const frozenTitleRef = useRef(title);
  if (open) frozenTitleRef.current = title;
  const stableTitle = frozenTitleRef.current;

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      const firstInput = contentRef.current?.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >("input, textarea, select, [tabindex]:not([tabindex='-1'])");

      firstInput?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, [open]);

  // Handle drag functionality
  useEffect(() => {
    if (!draggable || !isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!paperRef.current) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const newX = dragOffsetRef.current.x + deltaX;
      const newY = dragOffsetRef.current.y + deltaY;

      paperRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, draggable]);

  const handleTitleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggable || !paperRef.current) return;

    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
    dragOffsetRef.current = {
      x: position.x,
      y: position.y,
    };
    setIsDragging(true);
  };

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth={maxWidth}
      disableEscapeKeyDown
      keepMounted={keepMounted}
      slotProps={{
        paper: {
          ref: paperRef,
          sx: {
            borderRadius: "16px",
            boxShadow: theme.shadows[6],
            p: 1,
            maxHeight: height ?? "80vh",
            // When contentSx is used (split layout), set an explicit height so
            // children using height: "100%" can resolve correctly.
            ...(contentSx ? { height: height ?? "80vh", display: "flex", flexDirection: "column" } : {}),
            transition: isDragging ? "none" : "all 0.2s ease-out",
            ...sx,
          },
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(3px)",
        }
      }}
    >
      {stableTitle && (
        <DialogTitle
          onMouseDown={handleTitleMouseDown}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
            flexShrink: 0,
            cursor: draggable ? (isDragging ? "grabbing" : "grab") : "default",
            userSelect: "none",
          }}
        >
          <Box display='flex' gap={1}>
            <Typography sx={{ fontWeight: 600 }}>{stableTitle}</Typography>
            {leftHeaderAction}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {/*  Optional custom header actions */}
            {headerActions}

            {!hideCloseButton && (
              <IconButton onClick={onClose}>
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}

      <DialogContent
        ref={contentRef}
        sx={{
          pt: 2, px: 3, pb: 2, overflowY: "auto",
          ...(contentSx ? { flex: "1 1 auto", minHeight: 0 } : {}),
          ...(contentSx as object),
        }}
      >
        <Box sx={contentSx ? { height: "100%", display: "flex", flexDirection: "column" } : { mt: 1 }}>
          {children}
        </Box>
      </DialogContent>
      {onClick && (
        <Box sx={{ p: 1, pt: 2, display: "flex", justifyContent: "flex-end" }}>
          {disabled && disabledActionTooltip ? (
            <Tooltip title={disabledActionTooltip} maxWidth={360} placement="top">
              <PrimaryButton onClick={onClick} disabled={disabled}>
                Save
              </PrimaryButton>
            </Tooltip>
          ) : (
            <PrimaryButton onClick={onClick} disabled={disabled}>
              Save
            </PrimaryButton>
          )}
        </Box>
      )}
    </Dialog>
  );
}
