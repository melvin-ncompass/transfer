import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Avatar,
  InputAdornment,
  Divider,
  Collapse,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { PrimaryIconButton } from "../../../../components/atom/button/PrimaryIconButton";
import {
  useLazyGetConversationsQuery,
  useLazyGetConversationQuery,
  useCreateConversationMutation,
  useSendMessageMutation,
  useDeleteConversationMutation,
} from "../../financeAgentChat/api/financeAgent.api";
import type {
  DocumentListResult,
  DocumentListRow,
  BackendMessage,
} from "../../financeAgentChat/api/financeAgent.api";
import { useGetHeaderDataQuery } from "../../../company/api/company.api";
// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string | number;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  listResult?: DocumentListResult | null;
  isError?: boolean;
}

interface ChatSession {
  id: number;
  title: string;
  messages: Message[];
  createdAt: Date;
  messagesLoaded: boolean;
}

interface FinanceAgentChatProps {
  open: boolean;
  onClose: () => void;
  onFullscreenChange?: (fullscreen: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const formatDate = (date: Date) => {
  const today = new Date();
  const d = new Date(date);
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const DOC_LIST_MARKER = "<<<DOC_LIST_TABLE>>>";

function getRenderableAssistantContent(content: string): string {
  const markerIndex = content.indexOf(DOC_LIST_MARKER);
  if (markerIndex === -1) return content;
  return content.slice(0, markerIndex).trim();
}

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Box component="strong" key={i} sx={{ fontWeight: 700 }}>
          {part.slice(2, -2)}
        </Box>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function groupSessionsByDate(sessions: ChatSession[]) {
  const groups: Record<string, ChatSession[]> = {};
  sessions.forEach((s) => {
    const label = formatDate(s.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(s);
  });
  return groups;
}

const formatMoney = (value: number | null | undefined): string =>
  typeof value === "number" ? value.toFixed(2) : "—";

function mapBackendMessage(msg: BackendMessage): Message {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.text,
    timestamp: new Date(msg.createdAt),
    listResult: msg.listResult,
  };
}

// ─── Invoice List Card ────────────────────────────────────────────────────────

function InvoiceListCard({ listResult }: { listResult: DocumentListResult }) {
  const theme = useTheme();
  const rows = listResult.rows ?? [];
  const currency = rows[0]?.currency ?? "";
  const prettyDocType = (v?: string) => (v ? `${v[0].toUpperCase()}${v.slice(1)}` : "—");
  const formatIssueDate = (v?: string) => (v ? v.slice(0, 10) : "—");

  return (
    <Box
      sx={{
        mt: 1.5,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "0.8fr 1.2fr 1fr 1.1fr 1fr 1fr",
          px: 1.5,
          py: 0.75,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        }}
      >
        {["Type", "No.", "Issued", "Contact", "Total", "Balance"].map((h) => (
          <Typography
            key={h}
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: "0.68rem",
              color: theme.palette.primary.main,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {h}
          </Typography>
        ))}
      </Box>

      {rows.map((r: DocumentListRow, i: number) => (
        <Box
          key={i}
          sx={{
            display: "grid",
            gridTemplateColumns: "0.8fr 1.2fr 1fr 1.1fr 1fr 1fr",
            px: 1.5,
            py: 0.9,
            alignItems: "center",
            borderBottom:
              i < rows.length - 1
                ? `1px solid ${alpha(theme.palette.divider, 0.6)}`
                : "none",
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          }}
        >
          <Typography variant="caption" sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
            {prettyDocType(r.doc_type)}
          </Typography>
          <Typography variant="caption" noWrap sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
            {r.document_no || "—"}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
            {formatIssueDate(r.issue_date)}
          </Typography>
          <Typography variant="caption" noWrap sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
            {r.contact_name || "—"}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.78rem", fontWeight: 600, color: theme.palette.text.primary }}>
            {currency} {formatMoney(r.total)}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.78rem", fontWeight: 600, color: theme.palette.text.primary }}>
            {currency} {formatMoney(r.balance_due)}
          </Typography>
        </Box>
      ))}

      {listResult.error && (
        <Box sx={{ px: 1.5, py: 1, borderTop: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
          <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
            {listResult.error}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          px: 1.5,
          py: 0.6,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        <Typography variant="caption" sx={{ fontSize: "0.68rem", color: theme.palette.text.disabled }}>
          {rows.length} record{rows.length !== 1 ? "s" : ""}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AgentBubble({ message }: { message: Message }) {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", maxWidth: "50%" }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: theme.palette.primary.main,
          flexShrink: 0,
          mt: 0.5,
        }}
      >
        <SmartToyOutlinedIcon sx={{ fontSize: 18 }} />
      </Avatar>
      <Box sx={{ flex: 1 }}>
        {message.isError ? (
          <Alert
            severity="error"
            icon={<ErrorOutlineIcon fontSize="small" />}
            sx={{ borderRadius: 2, fontSize: "0.8rem", py: 0.5 }}
          >
            {message.content}
          </Alert>
        ) : (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: "4px 16px 16px 16px",
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6, color: theme.palette.text.primary, fontSize: "0.825rem" }}
            >
              {renderContent(getRenderableAssistantContent(message.content))}
            </Typography>
            {message.listResult &&
              ((message.listResult.rows?.length ?? 0) > 0 || !!message.listResult.error) && (
                <InvoiceListCard listResult={message.listResult} />
              )}
          </Box>
        )}
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.disabled, mt: 0.5, display: "block", px: 0.5 }}
        >
          {formatTime(message.timestamp)}
        </Typography>
      </Box>
    </Box>
  );
}

function UserBubble({
  message,
  userProfilePic,
}: {
  message: Message;
  userProfilePic?: string;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 1.5,
        alignItems: "flex-start",
        maxWidth: "50%",
        alignSelf: "flex-end",
      }}
    >
      <Box>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: "16px 4px 16px 16px",
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.6, color: "#fff", fontSize: "0.825rem" }}>
            {message.content}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.disabled,
            mt: 0.5,
            display: "block",
            textAlign: "right",
            px: 0.5,
          }}
        >
          {formatTime(message.timestamp)}
        </Typography>
      </Box>
      <Avatar
        src={userProfilePic}
        sx={{
          width: 32,
          height: 32,
          bgcolor: alpha(theme.palette.primary.main, 0.15),
          color: theme.palette.primary.main,
          fontWeight: 700,
          fontSize: "0.75rem",
          flexShrink: 0,
          mt: 0.5,
        }}
      >
        {!userProfilePic ? "U" : null}
      </Avatar>
    </Box>
  );
}

function TypingIndicator() {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, flexShrink: 0 }}>
        <SmartToyOutlinedIcon sx={{ fontSize: 18 }} />
      </Avatar>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: "4px 16px 16px 16px",
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          display: "flex",
          gap: 0.5,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: theme.palette.primary.main,
              animation: "bounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
              "@keyframes bounce": {
                "0%, 60%, 100%": { transform: "translateY(0)" },
                "30%": { transform: "translateY(-6px)" },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinanceAgentChat({
  open,
  onClose,
  onFullscreenChange,
}: FinanceAgentChatProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  // Tracks which session IDs have had their messages loaded from the backend
  const loadedSessionIdsRef = useRef<Set<number>>(new Set());

  const [triggerGetConversations] = useLazyGetConversationsQuery();
  const [triggerGetConversation] = useLazyGetConversationQuery();
  const [createConversation] = useCreateConversationMutation();
  const [sendMessage] = useSendMessageMutation();
  const [deleteConversation] = useDeleteConversationMutation();

  const { data: headerData } = useGetHeaderDataQuery();

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isTyping]);

  // ── Focus input ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    if (open && !isTyping && activeSessionId) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, isTyping, activeSessionId]);

  // ── Fullscreen ──────────────────────────────────────────────────────────────
  useEffect(() => {
    onFullscreenChange?.(isFullscreen);
  }, [isFullscreen, onFullscreenChange]);

  useEffect(() => {
    if (!open) {
      setIsFullscreen(false);
      onFullscreenChange?.(false);
    }
  }, [open, onFullscreenChange]);

  // ── Load session messages (lazy, once per session) ──────────────────────────
  const loadSessionMessages = useCallback(
    async (sessionId: number) => {
      if (loadedSessionIdsRef.current.has(sessionId)) return;
      loadedSessionIdsRef.current.add(sessionId);
      setIsLoadingSession(true);
      try {
        const res = await triggerGetConversation(sessionId).unwrap();
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  title: res.data.conversation.title,
                  messages: res.data.messages.map(mapBackendMessage),
                  messagesLoaded: true,
                }
              : s
          )
        );
      } catch {
        // Remove from loaded set so user can retry by clicking the session again
        loadedSessionIdsRef.current.delete(sessionId);
      } finally {
        setIsLoadingSession(false);
      }
    },
    [triggerGetConversation]
  );

  // ── Create first conversation (called when list is empty) ────────────────────
  const handleNewChat = useCallback(async () => {
    try {
      const created = await createConversation().unwrap();
      const newSessionId = created.data.id;

      // Eagerly add a skeleton session so the UI switches immediately
      setSessions((prev) => [
        {
          id: newSessionId,
          title: created.data.title,
          messages: [],
          createdAt: new Date(created.data.createdAt),
          messagesLoaded: false,
        },
        ...prev,
      ]);
      setActiveSessionId(newSessionId);
      setInput("");

      // Load messages (will include the backend welcome message)
      await loadSessionMessages(newSessionId);
    } catch {
      // silently fail — user can retry with the "New chat" button
    }
  }, [createConversation, loadSessionMessages]);

  // ── Load conversation list on every open ────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const loadList = async () => {
      setIsLoadingList(true);
      try {
        const res = await triggerGetConversations({ limit: 20 }).unwrap();
        const items = res.data.items;

        if (items.length === 0) {
          // Clear any stale sessions from a previous company before creating a fresh one
          setSessions([]);
          loadedSessionIdsRef.current.clear();
          setActiveSessionId(null);
          await handleNewChat();
          return;
        }

        // Merge backend list with existing local sessions (preserving loaded messages)
        setSessions((prev) => {
          const loadedMap = new Map(prev.map((s) => [s.id, s]));
          return items.map((item) => {
            const existing = loadedMap.get(item.id);
            return existing
              ? { ...existing, title: item.title }
              : {
                  id: item.id,
                  title: item.title,
                  messages: [],
                  createdAt: new Date(item.createdAt),
                  messagesLoaded: false,
                };
          });
        });

        // Determine which session should be active
        const currentActiveStillValid = items.some((i) => i.id === activeSessionId);
        const targetId = currentActiveStillValid ? activeSessionId! : items[0].id;
        setActiveSessionId(targetId);

        // Load messages for the target session if not yet loaded
        if (!loadedSessionIdsRef.current.has(targetId)) {
          await loadSessionMessages(targetId);
        }
      } catch {
        // Network error — keep existing state
      } finally {
        setIsLoadingList(false);
      }
    };

    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Select a session from the sidebar ───────────────────────────────────────
  const handleSelectSession = useCallback(
    async (sessionId: number) => {
      setActiveSessionId(sessionId);
      await loadSessionMessages(sessionId);
    },
    [loadSessionMessages]
  );

  // ── Delete a session ─────────────────────────────────────────────────────────
  const handleDeleteSession = useCallback(
    async (sessionId: number, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await deleteConversation(sessionId).unwrap();
      } catch {
        // If the backend call fails, keep the session in the list
        return;
      }
      loadedSessionIdsRef.current.delete(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setSessions((prev) => {
          const remaining = prev.filter((s) => s.id !== sessionId);
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
            loadSessionMessages(remaining[0].id);
          } else {
            setActiveSessionId(null);
          }
          return remaining;
        });
      }
    },
    [activeSessionId, deleteConversation, loadSessionMessages]
  );

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || activeSessionId === null || isTyping) return;

    const userMsg: Message = {
      id: generateLocalId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s
      )
    );
    setInput("");
    setIsTyping(true);

    try {
      const res = await sendMessage({ id: activeSessionId, message: trimmed }).unwrap();

      const agentMsg: Message = {
        id: generateLocalId(),
        role: "agent",
        content: res.data.response,
        timestamp: new Date(),
        listResult: res.data.listResult,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                title: res.data.title || s.title,
                messages: [...s.messages, agentMsg],
              }
            : s
        )
      );
    } catch {
      const errMsg: Message = {
        id: generateLocalId(),
        role: "agent",
        content: "Something went wrong. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, messages: [...s.messages, errMsg] } : s
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedSessions = groupSessionsByDate(sessions);

  const sidebarBg = isDark ? alpha(theme.palette.background.paper, 0.97) : "#f8f9fc";
  const panelBg = isDark ? theme.palette.background.paper : "#ffffff";

  return (
    <Box
      sx={{
        position: "fixed",
        display: "flex",
        overflow: "hidden",
        zIndex: 1300,
        bgcolor: panelBg,
        ...(isFullscreen
          ? { top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", borderRadius: 0 }
          : { bottom: 90, right: 24, width: 760, height: 560, borderRadius: 3 }),
        boxShadow: isFullscreen
          ? "none"
          : `0 24px 64px ${alpha(theme.palette.common.black, 0.22)}, 0 4px 16px ${alpha(theme.palette.primary.main, 0.12)}`,
        border: isFullscreen ? "none" : `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        transformOrigin: "bottom right",
        transform: open ? "scale(1)" : "scale(0.05)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        visibility: open ? "visible" : "hidden",
        transition: open
          ? [
              "transform 0.38s cubic-bezier(0.34, 1.46, 0.64, 1)",
              "opacity 0.22s ease",
              "visibility 0s",
              "top 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
              "left 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
              "right 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
              "bottom 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
              "width 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
              "height 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
              "border-radius 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
              "box-shadow 0.32s ease",
            ].join(", ")
          : "transform 0.22s cubic-bezier(0.4, 0, 1, 1), opacity 0.18s ease, visibility 0s 0.22s",
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <Collapse in={sidebarOpen} orientation="horizontal" timeout={250}>
        <Box
          sx={{
            width: 220,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: sidebarBg,
            borderRight: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Box sx={{ p: 2, pb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <AccountBalanceIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: theme.palette.text.primary, letterSpacing: -0.3 }}
              >
                Bsuite Books
              </Typography>
            </Box>

            <Box
              component="button"
              onClick={handleNewChat}
              disabled={isLoadingList}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
                py: 1,
                px: 1.5,
                borderRadius: 2,
                border: `1.5px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                color: theme.palette.primary.main,
                cursor: isLoadingList ? "not-allowed" : "pointer",
                opacity: isLoadingList ? 0.5 : 1,
                transition: "all 0.18s",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.78rem" }}>
                New chat
              </Typography>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
            {isLoadingList ? (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <CircularProgress size={20} thickness={4} />
              </Box>
            ) : sessions.length === 0 ? (
              <Typography
                variant="caption"
                sx={{ px: 2, color: theme.palette.text.disabled, display: "block", mt: 2 }}
              >
                No chats yet
              </Typography>
            ) : (
              Object.entries(groupedSessions).map(([dateLabel, group]) => (
                <Box key={dateLabel}>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      py: 0.5,
                      display: "block",
                      color: theme.palette.text.disabled,
                      fontWeight: 600,
                      fontSize: "0.68rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {dateLabel}
                  </Typography>
                  <List disablePadding>
                    {group.map((session) => (
                      <ListItemButton
                        key={session.id}
                        selected={session.id === activeSessionId}
                        onClick={() => handleSelectSession(session.id)}
                        sx={{
                          mx: 1,
                          mb: 0.25,
                          borderRadius: 1.5,
                          py: 0.75,
                          px: 1.25,
                          "&.Mui-selected": {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.14) },
                          },
                          "&:hover .delete-btn": { opacity: 1 },
                        }}
                      >
                        <ListItemText
                          primary={session.title}
                          primaryTypographyProps={{
                            variant: "caption",
                            noWrap: true,
                            sx: {
                              fontWeight: session.id === activeSessionId ? 600 : 400,
                              fontSize: "0.78rem",
                              color:
                                session.id === activeSessionId
                                  ? theme.palette.primary.main
                                  : theme.palette.text.secondary,
                            },
                          }}
                        />
                        <PrimaryIconButton
                          className="delete-btn"
                          variant="outlined"
                          color="error"
                          icon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          sx={{
                            opacity: 0,
                            transition: "opacity 0.15s",
                            ml: 0.5,
                            flexShrink: 0,
                            width: 22,
                            height: 22,
                            "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.08) },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Collapse>

      {/* ── Main Chat Area ──────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: panelBg,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PrimaryIconButton
              variant="outlined"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              icon={<AccountBalanceIcon sx={{ fontSize: 18 }} />}
              onClick={() => setSidebarOpen((v) => !v)}
              sx={{
                width: 30,
                height: 30,
                color: theme.palette.text.secondary,
                "&:hover": { bgcolor: "transparent", color: theme.palette.primary.main },
              }}
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.2 }}
                >
                  Finance Operations Agent
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mt: 0.2 }}>
                  <FiberManualRecordIcon sx={{ fontSize: 8, color: "#22c55e" }} />
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.68rem", color: "#22c55e", fontWeight: 500 }}
                  >
                    Online
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PrimaryIconButton
              variant="outlined"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              icon={
                isFullscreen
                  ? <CloseFullscreenIcon sx={{ fontSize: 16 }} />
                  : <OpenInFullIcon sx={{ fontSize: 16 }} />
              }
              onClick={() => setIsFullscreen((v) => !v)}
              sx={{
                width: 30,
                height: 30,
                color: theme.palette.text.secondary,
                transition: "color 0.15s, transform 0.2s",
                "&:hover": { bgcolor: "transparent", color: theme.palette.primary.main, transform: "scale(1.1)" },
              }}
            />
            <PrimaryIconButton
              variant="outlined"
              title="Close"
              icon={<CloseIcon sx={{ fontSize: 18 }} />}
              onClick={onClose}
              sx={{
                width: 30,
                height: 30,
                color: theme.palette.text.secondary,
                "&:hover": { bgcolor: "transparent", color: theme.palette.text.primary },
              }}
            />
          </Box>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2.5,
            py: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            "&::-webkit-scrollbar": { width: 5 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: 3,
            },
          }}
        >
          {isLoadingSession && !activeSession?.messagesLoaded ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
              <CircularProgress size={28} thickness={3} />
            </Box>
          ) : activeSession ? (
            <>
              {activeSession.messages.map((msg) =>
                msg.role === "agent" ? (
                  <AgentBubble key={msg.id} message={msg} />
                ) : (
                  <UserBubble
                    key={msg.id}
                    message={msg}
                    userProfilePic={headerData?.data?.userProfilePic}
                  />
                )
              )}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                opacity: 0.5,
              }}
            >
              <SmartToyOutlinedIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
              <Typography variant="body2" color="text.secondary">
                Start a new chat
              </Typography>
            </Box>
          )}
        </Box>

        {/* Input */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: panelBg,
            flexShrink: 0,
          }}
        >
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={activeSessionId === null || isTyping || isLoadingSession}
            size="small"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <PrimaryIconButton
                    icon={<SendIcon sx={{ fontSize: 15 }} />}
                    onClick={handleSend}
                    disabled={!input.trim() || activeSessionId === null || isTyping || isLoadingSession}
                    sx={{
                      width: 32,
                      height: 32,
                      transition: "all 0.18s",
                      "&.Mui-disabled": {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: alpha(theme.palette.primary.main, 0.4),
                      },
                    }}
                  />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2.5,
                fontSize: "0.85rem",
                pr: 0.75,
                bgcolor: isDark
                  ? alpha(theme.palette.background.default, 0.5)
                  : alpha(theme.palette.grey[100], 0.8),
                "& fieldset": { borderColor: alpha(theme.palette.divider, 0.5) },
                "&:hover fieldset": { borderColor: alpha(theme.palette.primary.main, 0.4) },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 1.5,
                },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
