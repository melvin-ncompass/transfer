import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  FormHelperText,
  ListSubheader,
  TextField,
  Box,
  IconButton,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { Children, useState, useMemo, useRef, useEffect } from "react";
import type { SingleSelectElementProps } from "../../../types/types";
import { useTheme } from "@mui/material/styles";

export function SingleSelectElement({
  label,
  value,
  onChange,
  options,
  required = false,
  error = false,
  helperText = "",
  disabled,
  menuHeight = 400,
  clearable = false,
  menuWidth,
  fullWidth,
  width,
  sx,
  extraMenuItems,
  placeholder,
  showSearch = true,
  variant = "default",
}: SingleSelectElementProps) {
  const theme = useTheme();

  const [searchText, setSearchText] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const ignoreFocusRef = useRef(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const isGrouped = useMemo(() => {
    if (!Array.isArray(options) || options.length === 0) return false;
    return (
      typeof options[0] === "object" &&
      options[0] !== null &&
      "options" in options[0]
    );
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) return options;

    if (isGrouped) {
      return (options as any[])
        .map((group) => ({
          ...group,
          options: (group.options || []).filter((opt: any) =>
            opt.label.toLowerCase().includes(searchText.toLowerCase()),
          ),
        }))
        .filter((group) => group.options.length > 0);
    } else {
      return (options as any[]).filter((opt) =>
        opt.label.toLowerCase().includes(searchText.toLowerCase()),
      );
    }
  }, [options, searchText, isGrouped]);

  const filteredOptionsFlat = useMemo(() => {
    if (isGrouped) {
      return (filteredOptions as any[]).flatMap((group) => group.options || []);
    }
    return filteredOptions as any[];
  }, [filteredOptions, isGrouped]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptionsFlat.length]);

  useEffect(() => {
    if (open && showSearch) {
      const timeout = setTimeout(() => {
        searchRef.current?.focus();
        searchRef.current?.select();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [open, showSearch]);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setSearchText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        Math.min(prev + 1, filteredOptionsFlat.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedOption = filteredOptionsFlat[highlightedIndex];
      if (selectedOption) {
        onChange(selectedOption.value);
        setOpen(false);
        setSearchText("");
      }
    }
  };

  const getFlatIndex = (groupIndex: number, optionIndex: number) => {
    if (!isGrouped) return optionIndex;
    let count = 0;
    for (let i = 0; i < groupIndex; i++) {
      count += (filteredOptions as any[])[i].options?.length || 0;
    }
    return count + optionIndex;
  };

  const getSelectedLabel = () => {
    if (!value) return "";

    const allOptions = isGrouped
      ? (options as any[]).flatMap((g) => g.options)
      : options;

    const selected = (allOptions as any[])?.find((o) => o.value === value);
    return selected?.label || "";
  };

  return (
    <FormControl
      sx={{
        flex: 1,
        minWidth: 0,
        width: fullWidth ? "100%" : width || "100%",
        ...sx,
      }}
    >
      {variant !== "people" && (
        <InputLabel
          shrink
          id="input-label-single-select"
          error={error}
          sx={{
            fontSize: "0.9rem",
            color: error ? theme.palette.error.main : undefined,
          }}
        >
          {required ? `${label} *` : label}
        </InputLabel>
      )}

      <Select
        notched={variant !== "people" ? true : undefined}
        value={value}
        labelId={variant !== "people" ? "input-label-single-select" : undefined}
        label={variant !== "people" ? label : undefined}
        onChange={(e: SelectChangeEvent) => onChange(e.target.value)}
        error={error}
        disabled={disabled}
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
        renderValue={() => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <span>{getSelectedLabel()}</span>

            <IconButton
              size="small"
              onClick={handleClear}
              onMouseDown={(e) => e.stopPropagation()}
              sx={{
                ml: 1,
                visibility: clearable && value ? "visible" : "hidden",
                width: 20,
                height: 20,
              }}
            >
              <ClearIcon fontSize="small" sx={{ fontSize: "17px" }} />
            </IconButton>
          </Box>
        )}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: menuHeight,
              ...(menuWidth ? { width: menuWidth, minWidth: menuWidth } : {}),
              fontFamily: theme.typography?.fontFamily ?? "inherit",
              fontSize: "0.9rem",
              "& .MuiMenuItem-root": {
                fontFamily: theme.typography?.fontFamily ?? "inherit",
                fontSize: "0.9rem",
              },
              "& .MuiListSubheader-root": {
                fontFamily: theme.typography?.fontFamily ?? "inherit",
                fontSize: "0.9rem",
              },
            },
          },
          autoFocus: false,
          disableAutoFocusItem: true,
        }}
        sx={
          variant === "people"
            ? {
                fontSize: "0.95rem",
                fontWeight: 700,
                backgroundColor: theme.palette.secondary.light,
                borderRadius: "100px",
                color: theme.palette.secondary.main,
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
                "& .MuiSelect-select": {
                  padding: "6px 14px",
                  paddingRight: "32px !important", // Make room for arrow dropdown icon
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 700,
                },
                "& .MuiSelect-icon": {
                  color: theme.palette.secondary.main,
                  right: "12px",
                  fontSize: "1.2rem",
                },
                "&:hover": {
                  backgroundColor: theme.palette.secondary.light,
                  filter: "brightness(0.95)",
                },
                "&.Mui-focused": {
                  backgroundColor: theme.palette.secondary.light,
                  filter: "brightness(0.95)",
                },
                ...sx,
              }
            : {
                fontSize: "0.9rem",
                "& .MuiSelect-select": {
                  padding: "11px 11px",
                },
                "&:hover fieldset": { borderColor: theme.palette.secondary.light },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.secondary.main,
                },
                ...sx,
              }
        }
      >
        {showSearch && (
          <ListSubheader>
            <TextField
              size="small"
              inputRef={searchRef}
              placeholder={placeholder ?? "Search options..."}
              fullWidth
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
            />
          </ListSubheader>
        )}

        {filteredOptionsFlat.length > 0 ? (
          isGrouped ? (
            (filteredOptions as any[]).map((group, groupIndex) => [
              <ListSubheader key={group.label}>{group.label}</ListSubheader>,
              ...(group.options || []).map((opt: any, optionIndex: number) => {
                const flatIndex = getFlatIndex(groupIndex, optionIndex);
                return (
                  <MenuItem
                    key={opt.value}
                    value={opt.value}
                    selected={flatIndex === highlightedIndex}
                    sx={{ pl: 3 }}
                  >
                    {opt.label}
                  </MenuItem>
                );
              }),
            ])
          ) : (
            (filteredOptions as any[]).map((opt, index) => (
              <MenuItem
                key={opt.value}
                value={opt.value}
                selected={index === highlightedIndex}
              >
                {opt.label}
              </MenuItem>
            ))
          )
        ) : (
          <MenuItem disabled>No options found</MenuItem>
        )}

        {extraMenuItems && Children.toArray(extraMenuItems)}
      </Select>

      {helperText && (
        <FormHelperText error={error}>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
}
