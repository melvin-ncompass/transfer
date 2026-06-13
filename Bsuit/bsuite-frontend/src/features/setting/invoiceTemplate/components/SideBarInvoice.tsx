import React, { useState } from "react";
import { Box, Typography, Tooltip, Card } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import FeedIcon from "@mui/icons-material/Feed";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import TableRowsIcon from "@mui/icons-material/TableRows";
import MoneyIcon from "@mui/icons-material/Money";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import General from "./sidebarContents/General";
import HeaderFooter from "./sidebarContents/HeaderFooter";
import TransactionDetails from "./sidebarContents/TransactionDetails";
import TableSettings from "./sidebarContents/TableSettings";
import TotalSettings from "./sidebarContents/TotalSettings";
import OtherDetails from "./sidebarContents/OtherDetails";

interface ISidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

interface IMenuItem {
  id: number;
  label: string;
  icon: React.ReactNode;
}

const ToggleButton = styled(Box)(({ theme }) => ({
  height: 32,
  width: 32,
  border: `1px solid ${theme.palette.grey[200]}`,
  borderRadius: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#fff",
  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  cursor: "pointer",
  transition: "all 0.3s ease",
  zIndex: 20,
  position: "absolute",
  right: -16,
  top: 12,

  "&:hover": {
    backgroundColor: theme.palette.grey[100],
    transform: "scale(1.05)",
  },
}));

const SidebarContentMap: Record<number, React.ReactNode> = {
  1: <General />,
  2: <HeaderFooter />,
  3: <TransactionDetails />,
  4: <TableSettings />,
  5: <TotalSettings />,
  6: <OtherDetails />,
};

export default function SideBarInvoice({
  collapsed,
  setCollapsed,
}: ISidebarProps) {
  const theme = useTheme();
  const [activeItem, setActiveItem] = useState<number>(1);

  const menuItems: IMenuItem[] = [
    { id: 1, label: "General", icon: <AddCircleIcon /> },
    { id: 2, label: "Header & Footer", icon: <FeedIcon /> },
    { id: 3, label: "Transaction Details", icon: <AccountBalanceIcon /> },
    { id: 4, label: "Table", icon: <TableRowsIcon /> },
    { id: 5, label: "Total", icon: <MoneyIcon /> },
    { id: 6, label: "Other Details", icon: <InsertDriveFileIcon /> },
  ];

  return (
    <Card
      sx={{
        display: "flex",
        width: collapsed ? 60 : 700,
        transition: "width 0.5s ease",
        borderRight: `1px solid ${theme.palette.grey[300]}`,
        position: "relative",
        height: "100%",
        backgroundColor: "#fff",
        flexShrink: 0,
        flexDirection: "row",
        overflow: "visible",
      }}
    >
      {/* Left menu icons + labels */}
      <Box
        sx={{
          width: collapsed ? 60 : 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 6,
          gap: 1,
          overflowY: "auto",
          padding: 1,
          height: "100%",
        }}
      >
        {menuItems.map((item) => (
          <Tooltip
            key={item.id}
            title={collapsed ? item.label : undefined}
            placement="right"
            arrow
          >
            <Box
              onClick={() => setActiveItem(item.id)}
              sx={{
                width: "100%",
                height: 44,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                borderRadius: 1,
                px: collapsed ? 0 : 2,
                justifyContent: collapsed ? "center" : "flex-start",
                backgroundColor:
                  activeItem === item.id ? "primary.main" : "transparent",
                color: activeItem === item.id ? "#fff" : "#000",
                "&:hover": {
                  backgroundColor:
                    activeItem === item.id
                      ? "primary.main"
                      : theme.palette.grey[200],
                },
                whiteSpace: "nowrap",
              }}
            >
              <Box
                sx={{ minWidth: 24, display: "flex", justifyContent: "center" }}
              >
                {item.icon}
              </Box>
              {!collapsed && (
                <Typography
                  fontSize={14}
                  fontWeight={500}
                  ml={2}
                  noWrap
                  title={item.label}
                >
                  {item.label}
                </Typography>
              )}
            </Box>
          </Tooltip>
        ))}
      </Box>

      {/* Right dynamic content */}
      {!collapsed && (
        <Box
          sx={{
            // flexGrow: 1,
            width: "100%",
            borderLeft: `1px solid ${theme.palette.grey[300]}`,
            p: 2,
            overflowY: "auto",
            height: "100%",
          }}
        >
          {SidebarContentMap[activeItem]}
        </Box>
      )}

      {/* Toggle Button */}
      <ToggleButton onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? (
          <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
        ) : (
          <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
        )}
      </ToggleButton>
    </Card>
  );
}
