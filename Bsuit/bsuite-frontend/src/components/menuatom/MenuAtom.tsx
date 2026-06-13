import { useState } from "react";
import {
  Menu,
  MenuItem,
  type MenuProps,
  ListItemIcon,
  ListItemText,
  useTheme,
  Typography,
} from "@mui/material";
import ArrowRight from "@mui/icons-material/ArrowRight";
import { alpha } from "@mui/material/styles";

// ==============================|| TYPES ||============================== //

export interface MenuAtomItem {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  children?: MenuAtomItem[];
  render?: () => React.ReactNode;   // custom UI inside MenuItem
  disableAutoClose?: boolean;
  disabled?: boolean;
}

interface MenuAtomProps extends Omit<MenuProps, "children"> {
  items: MenuAtomItem[];
  onCloseAll: () => void;
  submenuDirection?: "left" | "right";
  width?: number | string;
}

// ==============================|| COMPONENT ||============================== //

export default function MenuAtom({
  items,
  onCloseAll,
  submenuDirection = "right",
  width,
  ...menuProps
}: MenuAtomProps) {
  const [submenu, setSubmenu] = useState<{
    anchor: HTMLElement | null;
    items: MenuAtomItem[] | null;
  }>({ anchor: null, items: null });

  const theme = useTheme();

  const openSubmenu = (
    event: React.MouseEvent<HTMLElement>,
    children: MenuAtomItem[]
  ) => {
    setSubmenu({ anchor: event.currentTarget, items: children });
  };

  const closeSubmenu = () => {
    setSubmenu({ anchor: null, items: null });
  };

  const handleItemClick = (item: MenuAtomItem) => {
    item.onClick?.();
    if (!item.disableAutoClose) {
      onCloseAll();
    }
  };

  return (
    <>
      <Menu
        {...menuProps}
        onClose={onCloseAll}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: theme.shadows[8],
              border: `1px solid ${theme.palette.divider}`,
              minWidth: 140,
              width: width || "auto",
              mt: 1,
              pb: 0.2,
              pt: 0.2,
            },
          },
          list: {
            autoFocusItem: true,
            disablePadding: true,
          },
        }}
      >
        {items.map((item, i) => (
      <MenuItem
        key={i}
        disableRipple={Boolean(item.render)}
        disabled={Boolean(item.disabled)}
        onClick={(e) => {
          if (item.render || item.disabled) return;

          if (item.children) {
            openSubmenu(e, item.children);
          } else {
            handleItemClick(item);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" && item.children) {
            openSubmenu(e as any, item.children);
          }
          if (e.key === "ArrowLeft" && submenu.anchor) {
            closeSubmenu();
          }
        }}
          sx={{
                py: 1,
                px: 1.5,
                mx: 0.25,
                my: 0.25,
                minHeight: 40,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.2s ease-in-out",
                ...(item.render
                  ? {}
                  : {
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.08
                        ),
                        color: theme.palette.primary.main,
                      },
                    }),
              }}
      >
        {item.render ? (
          item.render()
        ) : (
          <>
            {item.icon && (
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        fontSize="0.875rem"
                        fontWeight={item.children ? 600 : 400}
                      >
                        {item.label}
                      </Typography>
                    }
                  />
            {item.children && <ArrowRight fontSize="small" />}
          </>
        )}
      </MenuItem>
    ))}
  </Menu>

      {/* ================= SUB MENU ================= */}
      {submenu.items && (
        <MenuAtom
          items={submenu.items}
          anchorEl={submenu.anchor}
          open={Boolean(submenu.anchor)}
          anchorOrigin={{
            vertical: "top",
            horizontal: submenuDirection === "left" ? "left" : "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: submenuDirection === "left" ? "right" : "left",
          }}
          onCloseAll={() => {
            closeSubmenu();
            onCloseAll();
          }}
          submenuDirection={submenuDirection}
        />
      )}
    </>
  );
}