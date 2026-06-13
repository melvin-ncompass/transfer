// src/contexts/SnackbarContext.tsx
import React, { createContext, useContext, useState, type ReactNode } from "react";
import { Snackbar as UISnackbar } from "../components/atom/snackbar"; // your atom

type SnackbarType = {
  open: boolean;
  message: string;
  color: "success" | "error";
};

type SnackbarContextType = {
  showSnackbar: (message: string, color?: "success" | "error") => void;
};

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [snackbar, setSnackbar] = useState<SnackbarType>({
    open: false,
    message: "",
    color: "success",
  });

  const showSnackbar = (message: string, color: "success" | "error" = "success") => {
    setSnackbar({ open: true, message, color });
  };

  const closeSnackbar = () =>
    setSnackbar((s) => ({ ...s, open: false }));

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {/* Global Snackbar always rendered */}
     {snackbar.open && <UISnackbar
        message={snackbar.message}
        color={snackbar.color}
        
        onClose={closeSnackbar}
        autoClose={3000}
      />}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error("useSnackbar must be used within SnackbarProvider");
  return context;
};