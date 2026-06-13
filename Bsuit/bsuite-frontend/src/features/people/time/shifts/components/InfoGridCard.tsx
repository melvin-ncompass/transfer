/**
 * InfoGridCard — reusable atom component
 *
 * Renders a card with:
 * - An optional accent color strip on the left edge
 * - A header with title, optional chips/badges, and optional edit/delete icon buttons
 * - An optional collapse toggle (chevron) in the header
 * - A responsive grid of label+value cells with icon support
 *
 * All "extra" features (collapsible, edit, delete, accentColor) are optional.
 */

import {
  Box,
  Collapse,
  IconButton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Delete, Edit, ExpandLess, ExpandMore } from "@mui/icons-material";
import { useState, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InfoGridRow {
  /** Icon rendered before the label (optional) */
  icon?: ReactNode;
  /** ALL-CAPS label shown above the value */
  label: string;
  /** The value to display */
  value: ReactNode;
}

export interface InfoGridCardProps {
  // ── Content ──────────────────────────────────────────────────────────────
  /** Card title shown in the header */
  title?: string;
  /** Rows of data rendered in a responsive grid */
  rows: InfoGridRow[];
  /** How many columns to display. Defaults to 3 */
  columns?: 1 | 2 | 3 | 4;

  // ── Header extras ─────────────────────────────────────────────────────────
  /** Additional nodes rendered beside the title (e.g. Chip badges) */
  headerExtra?: ReactNode;

  Headerheight?: string | number;

  // ── Accent ───────────────────────────────────────────────────────────────
  /**
   * Accent color used for:
   * - Faint background tint on the card
   * Defaults to theme.palette.primary.main when omitted.
   */
  accentColor?: string;

  // ── Collapsible ───────────────────────────────────────────────────────────
  /** Whether the card body can be collapsed. Default: false */
  collapsible?: boolean;
  /** Initial expanded state when collapsible. Default: true */
  defaultExpanded?: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Shows a pencil icon button in the header. Called on click. */
  onEdit?: () => void;
  /** Shows a trash icon button in the header. Called on click. */
  onDelete?: () => void;
  /** Disables the delete button (e.g. active version cannot be deleted) */
  deleteDisabled?: boolean;
  /** Tooltip / title for the delete button when disabled */
  deleteDisabledTitle?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InfoGridCard({
  title,
  rows,
  Headerheight,
  columns = 3,
  headerExtra,
  accentColor,
  collapsible = false,
  defaultExpanded = true,
  onEdit,
  onDelete,
  deleteDisabled = false,
  deleteDisabledTitle,
}: InfoGridCardProps) {
  const theme = useTheme();
  const accent = accentColor ?? theme.palette.primary.main;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const hasHeader = title || headerExtra || onEdit || onDelete || collapsible;
  const isExpanded = collapsible ? expanded : true;

  // Build grid column template
  const colTemplate = `repeat(${columns}, minmax(0, 1fr))`;

  return (
    <Box
      sx={{
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        bgcolor: alpha(accent, 0.04),
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      {hasHeader && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          onClick={collapsible ? () => setExpanded((v) => !v) : undefined}
          sx={{
            px: 2,
            py: 1.25,
            height: Headerheight ? Headerheight : "auto",
            borderBottom: isExpanded ? "1px solid" : "none",
            borderColor: "divider",
            bgcolor: alpha(accent, 0.06),
            cursor: collapsible ? "pointer" : "default",
            userSelect: "none",
            "&:hover": collapsible ? { bgcolor: alpha(accent, 0.1) } : {},
            transition: "background-color 0.15s ease",
          }}
        >
          {/* Left: collapse chevron + title + extras */}
          <Stack direction="row" alignItems="center" gap={1} flex={1} minWidth={0}>
            {collapsible && (
              <IconButton
                size="small"
                disableRipple
                sx={{ p: 0, color: "text.secondary", flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              >
                {expanded ? (
                  <ExpandLess fontSize="small" />
                ) : (
                  <ExpandMore fontSize="small" />
                )}
              </IconButton>
            )}

            {title && (
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {title}
              </Typography>
            )}

            {headerExtra && (
              <Stack direction="row" alignItems="center" gap={0.75} flexShrink={0}>
                {headerExtra}
              </Stack>
            )}
          </Stack>

          {/* Right: action buttons */}
          {(onEdit || onDelete) && (
            <Stack
              direction="row"
              alignItems="center"
              gap={0.25}
              flexShrink={0}
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <IconButton size="small" onClick={onEdit} title="Edit">
                  <Edit fontSize="small" color="primary" />
                </IconButton>
              )}
              {onDelete && (
                <IconButton
                  size="small"
                  color="error"
                  disabled={deleteDisabled}
                  onClick={onDelete}
                  title={deleteDisabled ? deleteDisabledTitle : "Delete"}
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </Stack>
          )}
        </Stack>
      )}

      {/* ── Body grid ──────────────────────────────────────────────────── */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit={false}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: colTemplate,
          }}
        >
          {rows.map((row) => {
            return (
              <Box
                key={row.label}
                sx={{
                  py: 1.75,
                  px: 2,
                }}
              >
                <Stack gap={0.5}>
                  {/* Label row with optional icon */}
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    {row.icon && (
                      <Box sx={{ color: "text.disabled", display: "flex", fontSize: 16 }}>
                        {row.icon}
                      </Box>
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                      letterSpacing={0.6}
                      sx={{ textTransform: "uppercase" }}
                    >
                      {row.label}
                    </Typography>
                  </Stack>

                  {/* Value */}
                  {typeof row.value === "string" || typeof row.value === "number" ? (
                    <Typography variant="body2" fontWeight={500}>
                      {row.value}
                    </Typography>
                  ) : (
                    row.value
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
}