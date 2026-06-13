import { useState, useCallback } from "react";

export function useModal(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return { open, handleOpen, handleClose, setOpen };
}