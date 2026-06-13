import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { Fab, Tooltip, Zoom, Box } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import MessageIcon from '@mui/icons-material/Message';

import FinanceAgentChat from "./financeAgentChat/components/FinanceAgentChat";
import { useGetHeaderDataQuery } from "../company/api/company.api";

export default function BooksLayout() {
  const theme = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFullscreen, setChatFullscreen] = useState(false);

  const { data: headerData } = useGetHeaderDataQuery();
  const companyId = headerData?.data?.companyId;
  const prevCompanyIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (prevCompanyIdRef.current === undefined) {
      prevCompanyIdRef.current = companyId;
      return;
    }
    if (companyId !== prevCompanyIdRef.current) {
      prevCompanyIdRef.current = companyId;
      setChatOpen(false);
    }
  }, [companyId]);

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {/* All books child routes render here */}
      <Outlet />

      {/* Floating Action Button — hidden while chat is fullscreen */}
      {!chatFullscreen && (
      <Tooltip
        title={chatOpen ? "Close Finance Agent" : "Finance Operations Agent"}
        placement="left"
        arrow
      >
        <Zoom in timeout={400}>
          <Fab
            onClick={() => setChatOpen((v) => !v)}
            size="medium"
            aria-label="Finance Operations Agent"
            sx={{
              position: "fixed",
              bottom: 28,
              right: 28,
              zIndex: 1301,
              background: chatOpen
                ? `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
                : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: "#fff",
              boxShadow: chatOpen
                ? `0 4px 20px ${alpha(theme.palette.error.main, 0.45)}`
                : `0 4px 20px ${alpha(theme.palette.primary.main, 0.45)}`,
              transition: "background 0.25s, box-shadow 0.25s, transform 0.2s",
              "&:hover": {
                transform: "scale(1.08)",
                boxShadow: chatOpen
                  ? `0 6px 28px ${alpha(theme.palette.error.main, 0.55)}`
                  : `0 6px 28px ${alpha(theme.palette.primary.main, 0.55)}`,
              },
              "&:active": { transform: "scale(0.97)" },
            }}
          >
            <MessageIcon
              sx={{
                fontSize: 22,
                transition: "transform 0.5s",
                transform: chatOpen ? "rotate(360deg)" : "rotate(0deg)",
              }}
            />
          </Fab>
        </Zoom>
      </Tooltip>
      )}

      {/* Finance Agent Chat Panel */}
      <FinanceAgentChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onFullscreenChange={setChatFullscreen}
      />
    </Box>
  );
}
