import { useState, useRef, useEffect } from "react";
import { Box, InputBase, IconButton, useTheme, alpha } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

interface AnimatedSearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
  placeholder?: string;
  width?: string | number;
  size?: "small" | "medium";
}

export default function AnimatedSearchInput({
  value = "",
  onChange,
  onSearch,
  onOpenChange,
  placeholder = "Search...",
  width = 250,
  size = "medium",
}: AnimatedSearchInputProps) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchValue("");
    onChange?.("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onChange?.(newValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch?.(searchValue);
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        height: size === "small" ? 40 : 48,
      }}
    >
      {/* Search Icon Button */}
      <IconButton
        onClick={handleOpen}
        sx={{
          position: "absolute",
          right: 0,
          zIndex: 10,
          color: theme.palette.text.secondary,
          transition: "all 0.3s ease",
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto",
          "&:hover": {
            color: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
        }}
        size={size === "small" ? "small" : "medium"}
      >
        <SearchIcon />
      </IconButton>

      {/* Input Container with Animation */}
      <Box
        sx={{
          position: "absolute",
          right: 0,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          px: 1,
          height: "100%",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isOpen ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "right",
          width: isOpen ? width : 0,
          overflow: "hidden",
          "&:hover": {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
          },
        }}
      >
        <InputBase
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          fullWidth
          sx={{
            fontSize: size === "small" ? "0.875rem" : "1rem",
            "& .MuiInputBase-input": {
              py: size === "small" ? 0.5 : 1,
              px: 0.5,
              "&::placeholder": {
                color: theme.palette.text.disabled,
                opacity: 1,
              },
            },
          }}
        />

        {/* Close Button */}
        <IconButton
          onClick={handleClose}
          size={size === "small" ? "small" : "medium"}
          sx={{
            color: theme.palette.text.secondary,
            flexShrink: 0,
            transition: "color 0.2s ease",
            "&:hover": {
              color: theme.palette.error.main,
              backgroundColor: alpha(theme.palette.error.main, 0.08),
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
