import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  ListSubheader,
  TextField,
  Popover,
  IconButton,
  type SelectChangeEvent,
} from "@mui/material";
import { Box, useMediaQuery } from "@mui/system";
import type { MultiSelectElementProps } from "../../../types/types";
import { useTheme } from "@mui/material/styles";

import { useMemo, useRef, useState, useEffect } from "react";
import { Chip } from "../chips";

export function MultiSelectElement({
  label,
  options,
  value,
  onChange,
  required = false,
  error = false,
  helperText = "",
  sx,
  disabled,
  menuMaxHeight = 300,
  width,
  menuWidth,
  highlightedValues,
  placeholder,
  onSearch,
  fullWidth,
}: MultiSelectElementProps & {
  menuMaxHeight?: number;
  menuWidth?: number | string;
  placeholder?: string;
  onSearch?: (text: string) => void;
}) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<any>(null);

  // Popover state for the +N badge
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const popoverOpen = Boolean(popoverAnchor);

  const isGrouped =
    Array.isArray(options) &&
    options.length > 0 &&
    "options" in (options[0] as any);

  /* ---------------------------------------------
   * Build lookup map: value → label
   * --------------------------------------------*/
  const valueLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    options.forEach((opt: any) => {
      if ("options" in opt) {
        opt.options.forEach((o: any) => map.set(o.value, o.label));
      } else {
        map.set(opt.value, opt.label);
      }
    });
    return map;
  }, [options]);

  /* ---------------------------------------------
   * Filter options
   * --------------------------------------------*/
  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) return options;

    if (isGrouped) {
      return (options as any[])
        .map((group) => ({
          ...group,
          options: group.options.filter((opt: any) =>
            opt.label.toLowerCase().includes(searchText.toLowerCase()),
          ),
        }))
        .filter((g) => g.options.length > 0);
    }

    return (options as any[]).filter((opt) =>
      opt.label.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [options, searchText, isGrouped]);

  /* ---------------------------------------------
   * Handlers
   * --------------------------------------------*/
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const { value: newValue } = event.target;
    const nextValue =
      typeof newValue === "string" ? newValue.split(",") : newValue;
    onChange(nextValue);
    setSearchText("");
    requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSearchText("");
  };

  const handleOverflowClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setPopoverAnchor(e.currentTarget);
  };

  const handlePopoverClose = () => setPopoverAnchor(null);

  const handleRemove = (val: string) => {
    const updated = (value as string[]).filter((v) => v !== val);
    onChange(updated);
    if (updated.length <= 1) handlePopoverClose();
  };

  /* ---------------------------------------------
   * Render selected values
   * - Always shows exactly 1 chip
   * - +N badge if more are selected (opens popover)
   * --------------------------------------------*/
  const renderSelectedValues = (selected: string[]) => {
    if (!selected?.length) {
      if (!placeholder) return null;
      return (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Box onMouseDown={(e) => e.stopPropagation()}>
            <Chip label={placeholder} size="xs" color="info" />
          </Box>
        </Box>
      );
    }

    const first = selected[0];
    const firstLabel = valueLabelMap.get(first);
    const overflowCount = selected.length - 1;

    const firstTaxId = first.toString().replace("tax_", "");
    const isFirstOverridden = highlightedValues?.some(
      (t) => String(t.taxId) === firstTaxId && t.isTaxOverridden,
    );

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexWrap: "nowrap",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* Single visible chip — truncates if label is long */}
        {firstLabel && (
          <Box
            onMouseDown={(e) => e.stopPropagation()}
            sx={{
              flexShrink: 1,
              minWidth: 0,
              overflow: "hidden",
              maxWidth: overflowCount > 0 ? "60%" : "100%",
            }}
          >
            <Chip
              label={firstLabel}
              size="xs"
              color={isFirstOverridden ? "warning" : "info"}
              onDelete={() => handleRemove(first)}
            />
          </Box>
        )}

        {/* +N badge — clickable, opens popover */}
        {overflowCount > 0 && (
          <Box
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleOverflowClick}
            sx={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              height: "20px",
              px: "8px",
              borderRadius: "100px",
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.action.hover,
              fontSize: "0.75rem",
              color: theme.palette.text.secondary,
              whiteSpace: "nowrap",
              cursor: "pointer",
              userSelect: "none",
              transition: "background-color 0.15s",
              "&:hover": {
                backgroundColor: theme.palette.action.selected,
                color: theme.palette.text.primary,
              },
            }}
          >
            +{overflowCount} more
          </Box>
        )}
      </Box>
    );
  };

  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        searchRef.current?.focus();
        searchRef.current?.select();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  return (
    <>
      <FormControl
        fullWidth={fullWidth}
        sx={{
          width: width || (fullWidth ? "100%" : (isSmallScreen ? "100%" : "20%")),
          ...sx,
        }}
      >
        <InputLabel
          shrink
          id="input-label-multi-select"
          sx={{
            fontSize: "0.9rem",
            color: error ? theme.palette.error.main : undefined,
          }}
          error={error}
        >
          {required ? `${label} *` : label}
        </InputLabel>

        <Select
          label={label}
          multiple
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          notched
          displayEmpty
          value={value}
          onChange={handleChange}
          renderValue={(selected) => renderSelectedValues(selected as string[])}
          error={error}
          disabled={disabled}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: menuMaxHeight,
                width: menuWidth || "auto",
                "& .MuiMenuItem-root": {
                  fontSize: "0.9rem",
                  padding: "10px 16px",
                },
              },
            },
            autoFocus: false,
            disableAutoFocusItem: true,
          }}
          sx={{
            fontSize: "0.9rem",
            "& .MuiSelect-select": {
              padding: "11px 11px",
              height: "22px !important",
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
              cursor: disabled ? "not-allowed" : "default",
            },
            "&:hover fieldset": { borderColor: theme.palette.secondary.light },
            "&.Mui-focused fieldset": {
              borderColor: theme.palette.secondary.main,
            },
            "&.Mui-error fieldset": { borderColor: theme.palette.error.main },
          }}
        >
          {/* Search header */}
          <ListSubheader
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: theme.palette.background.paper,
              padding: "8px",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <TextField
              size="small"
              inputRef={searchRef}
              placeholder="Search Options..."
              fullWidth
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => {
                  onSearch?.(e.target.value);
                }, 400);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key !== "Enter") e.stopPropagation();
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: "0.875rem",
                  padding: "4px 8px",
                },
                "& input": {
                  padding: "6px 8px !important",
                },
              }}
            />
          </ListSubheader>

          {filteredOptions.length > 0 ? (
            isGrouped ? (
              (filteredOptions as any[]).map((group) => [
                <ListSubheader key={group.label} sx={{ fontWeight: 600 }}>
                  {group.label}
                </ListSubheader>,
                ...group.options.map((opt: any) => (
                  <MenuItem key={opt.value} value={opt.value} sx={{ pl: 4 }}>
                    {opt.label}
                  </MenuItem>
                )),
              ])
            ) : (
              (filteredOptions as any[]).map((opt) => (
                <MenuItem
                  key={opt.value}
                  value={opt.value}
                  onClick={() => {
                    setSearchText("");
                    requestAnimationFrame(() => {
                      searchRef.current?.focus();
                    });
                  }}
                >
                  {opt.label}
                </MenuItem>
              ))
            )
          ) : (
            <MenuItem disabled>No options found</MenuItem>
          )}
        </Select>

        {helperText && (
          <FormHelperText error={error}>{helperText}</FormHelperText>
        )}
      </FormControl>

      {/* -----------------------------------------------
       * Overflow popover — all selected items with ✕
       * ----------------------------------------------- */}
      <Popover
        open={popoverOpen}
        anchorEl={popoverAnchor}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        disableAutoFocus
        disableEnforceFocus
        PaperProps={{
          sx: {
            mt: 0.5,
            p: 1,
            minWidth: 180,
            maxWidth: 280,
            maxHeight: 260,
            overflowY: "auto",
            boxShadow: theme.shadows[3],
            borderRadius: "8px",
            border: `0.5px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          {(value as string[]).map((val) => {
            const chipLabel = valueLabelMap.get(val);
            if (!chipLabel) return null;
            const taxId = val.toString().replace("tax_", "");
            const isOverridden = highlightedValues?.some(
              (t) => String(t.taxId) === taxId && t.isTaxOverridden,
            );
            return (
              <Box
                key={val}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  px: 1,
                  py: 0.5,
                  borderRadius: "6px",
                  "&:hover": { backgroundColor: theme.palette.action.hover },
                }}
              >
                <Chip
                  label={chipLabel}
                  size="xs"
                  color={isOverridden ? "warning" : "info"}
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemove(val)}
                  sx={{
                    padding: "2px",
                    flexShrink: 0,
                    color: theme.palette.text.secondary,
                    "&:hover": { color: theme.palette.error.main, backgroundColor: "transparent" },
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </IconButton>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}