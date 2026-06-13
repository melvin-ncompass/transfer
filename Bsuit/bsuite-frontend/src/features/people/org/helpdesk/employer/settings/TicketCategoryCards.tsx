import { useState } from "react";
import { Box, Avatar, Tooltip, Typography, Divider, Card } from "@mui/material";
import {
  MoreVert,
  Pause,
  Refresh,
  Notifications,
} from "@mui/icons-material";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { Chip } from "../../../../../../components/atom/chips/Chips";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const getPriorityDotColor = (priorityName?: string) => {
  const n = priorityName?.toLowerCase() ?? "";
  if (n.includes("critical") || n.includes("urgent") || n.includes("high")) return "#e53935";
  if (n.includes("medium") || n.includes("moderate")) return "#ffc107";
  if (n.includes("low")) return "#4caf50";
  return "#5b5a5a";
};

// ─── ToggleRow ────────────────────────────────────────────────────────────────

type ToggleRowProps = {
  icon: React.ReactNode;
  name: string;
  enabled: boolean;
  label: string;
};

export function ToggleRow({ icon, name, enabled, label }: ToggleRowProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 9px",
        borderRadius: "6px",
        bgcolor: "action.hover",
        mb: "4px",
        "&:last-child": { mb: 0 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: "5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: enabled ? "#EAF3DE" : "#F1EFE8",
            color: enabled ? "#3B6D11" : "#888780",
            flexShrink: 0,
            fontSize: 12,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: 12, fontWeight: 500, m: 0 }}>{name}</Typography>
      </Box>

      <Chip
        label={label}
        color={enabled ? "success" : "secondary"}
        size="xs"
      />
    </Box>
  );
}

// ─── AvatarStack ──────────────────────────────────────────────────────────────

export type AvatarPerson = { id: string; name: string; role: string; isLead: boolean };

export function AvatarStack({ people }: { people: AvatarPerson[] }) {
  const shown = people.slice(0, 5);
  const extra = people.length - 5;

  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: "10px", minHeight: 28 }}>
      {shown.map((p, idx) => (
        <Tooltip
          key={idx}
          arrow
          title={
            <Box sx={{ p: 0.5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 12 }}>{p.name}</Typography>
              <Typography variant="caption" sx={{ fontSize: 11 }} color="text.secondary">
                {p.role}
              </Typography>
            </Box>
          }
        >
          <Box
            sx={{
              position: "relative",
              mr: "-6px",
              cursor: "default",
              zIndex: shown.length - idx,
              "&:hover": { zIndex: 20 },
            }}
          >
            <Avatar
              sx={{
                width: 26,
                height: 26,
                fontSize: 9,
                fontWeight: 500,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                border: "2px solid",
                borderColor: "background.paper",
                boxShadow: p.isLead ? "0 0 0 2px #3B6D11" : "none",
              }}
            >
              {getInitials(p.name)}
            </Avatar>
          </Box>
        </Tooltip>
      ))}

      {extra > 0 && (
        <Tooltip
          arrow
          title={
            <Box sx={{ p: 0.5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 12 }}>{extra} more</Typography>
              <Typography variant="caption" sx={{ fontSize: 11 }} color="text.secondary">
                member{extra > 1 ? "s" : ""}
              </Typography>
            </Box>
          }
        >
          <Box sx={{ position: "relative", mr: 0, cursor: "default", zIndex: 0, "&:hover": { zIndex: 20 } }}>
            <Avatar
              sx={{
                width: 26,
                height: 26,
                fontSize: 9,
                fontWeight: 500,
                bgcolor: "action.selected",
                color: "text.secondary",
                border: "2px solid",
                borderColor: "background.paper",
              }}
            >
              +{extra}
            </Avatar>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}

// ─── CategoryCard ─────────────────────────────────────────────────────────────

export type CategoryCardProps = {
  category: any;
  employeesData: any;
  onEdit: (id: number) => void;
  onDelete: (category: any) => void;
};

export function CategoryCard({ category, employeesData, onEdit, onDelete }: CategoryCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const getEmployeeName = (id: any) => {
    const emp = employeesData?.data?.find((e: any) => String(e.id) === String(id));
    return emp?.name || emp?.contact?.name || `Employee #${id}`;
  };

  const leadId = category.categoryLead;
  const members: any[] = category.members ?? [];

  const people: AvatarPerson[] = [
    ...(leadId
      ? [{ id: String(leadId), name: getEmployeeName(leadId), role: "Category lead", isLead: true }]
      : []),
    ...members
      .filter((mId: any) => String(mId) !== String(leadId))
      .map((mId: any) => ({
        id: String(mId),
        name: getEmployeeName(mId),
        role: "Member",
        isLead: false,
      })),
  ];

  const prioritizationOn =
    category.prioritizationEnabled ??
    (category.slaMappings && category.slaMappings.length > 0) ??
    false;

  const hasResponse = category.notifyResponseBreach;
  const hasResolution = category.notifyResolutionBreach;
  const breachOn = hasResponse || hasResolution;
  const breachLabel =
    hasResponse && hasResolution
      ? "Both on"
      : hasResponse
        ? "Response on"
        : hasResolution
          ? "Resolution on"
          : "Off";

  const priorityLevel =
    category.defaultPriority?.level !== undefined ? category.defaultPriority.level : 0;

  return (
    <Card
      sx={{
        p: "1rem 1.1rem",
        display: "flex",
        flexDirection: "column",
        border: "0.5px solid",
        borderColor: "divider",
        boxShadow: "none",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.25, gap: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {category.categoryName}
            <Box component="span" sx={{ fontSize: 11, fontWeight: 400, ml: 0.5 }} color="text.disabled">
              #{category.id}
            </Box>
          </Typography>
          <Typography
            sx={{ fontSize: 11, mt: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            color="text.secondary"
          >
            {category.description || "No description"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          <Chip label="Active" color="success" size="xs" />
          <Box
            component="button"
            onClick={(e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget)}
            sx={{
              width: 26,
              height: 26,
              border: "none",
              borderRadius: "6px",
              background: "transparent",
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <MoreVert sx={{ fontSize: 16 }} />
          </Box>
        </Box>
      </Box>

      {/* Priority */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: 1.25 }}>
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: getPriorityDotColor(category.defaultPriority?.name),
            flexShrink: 0,
          }}
        />
        <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
          {category.defaultPriority?.name || "Not applicable"}
        </Typography>
        <Typography sx={{ fontSize: 11 }} color="text.secondary">
          level {priorityLevel}
        </Typography>
        <Chip
          label={`Prioritization ${prioritizationOn ? "on" : "off"}`}
          color={prioritizationOn ? "info" : "secondary"}
          size="xs"
          sx={{ ml: "auto" }}
        />
      </Box>

      {/* Lead & members */}
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          mb: "5px",
        }}
        color="text.secondary"
      >
        Lead &amp; members
      </Typography>
      <AvatarStack people={people} />

      <Divider sx={{ my: "8px" }} />

      {/* Settings */}
      <ToggleRow
        icon={<Pause sx={{ fontSize: 13 }} />}
        name="On hold"
        enabled={category.enableOnHold}
        label={category.enableOnHold ? "On" : "Off"}
      />
      <ToggleRow
        icon={<Refresh sx={{ fontSize: 13 }} />}
        name="Ticket re-open"
        enabled
        label="On"
      />
      <ToggleRow
        icon={<Notifications sx={{ fontSize: 13 }} />}
        name="Breach alerts"
        enabled={breachOn}
        label={breachLabel}
      />

      {/* Footer */}
      <Typography sx={{ mt: "8px", fontSize: 11 }} color="text.disabled">
        {category.createdAt
          ? `Created ${new Date(category.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}`
          : ""}
      </Typography>

      {/* Card menu */}
      <MenuAtom
        items={[
          {
            label: "Edit",
            onClick() {
              setMenuAnchor(null);
              onEdit(category.id);
            },
          },
          {
            label: "Delete",
            onClick() {
              setMenuAnchor(null);
              onDelete(category);
            },
          },
        ]}
        onCloseAll={() => setMenuAnchor(null)}
        open={Boolean(menuAnchor)}
        anchorEl={menuAnchor}
      />
    </Card>
  );
}
