import { Box, Divider, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { PieChart } from "@mui/x-charts/PieChart";

import type { LeaveStat } from "../api/leave.api";

/**
 * Opacity of the backend accent used for “remaining” / unlimited ring segments.
 * Tuned for contrast on the light card background (was 0.12, too faint).
 */
const REMAINDER_TRACK_OPACITY = 0.25;

/** Donut ring thickness = outer − inner (px at 140×140 chart). */
const DONUT_INNER_RADIUS = 52;
const DONUT_OUTER_RADIUS = 62;

type LeaveStatCardProps = {
  stat: LeaveStat;
  /** Backend leave type color — consumed is full opacity; remainder uses the same hue at `REMAINDER_TRACK_OPACITY`. */
  accentColor: string;
};

function formatBalance(v: number | string | undefined): string {
  if (v === "Unlimited") return "Unlimited";
  if (v === undefined || v === null) return "—";
  if (typeof v === "number" && Number.isFinite(v)) {
    return Number.isInteger(v) ? String(v) : String(v);
  }
  return String(v);
}

export function LeaveStatCard({ stat, accentColor }: LeaveStatCardProps) {
  const remainderTrack = alpha(accentColor, REMAINDER_TRACK_OPACITY);
  const theme = useTheme();
  const isUnlimited = stat.available === "Unlimited";
  const remainingNum =
    typeof stat.available === "number" && Number.isFinite(stat.available)
      ? stat.available
      : 0;
  const consumed = Number(stat.consumed) || 0;

  const allocatedLabel = (() => {
    if (stat.allocated !== undefined && stat.allocated !== null) {
      return formatBalance(stat.allocated);
    }
    if (!isUnlimited) {
      return formatBalance(remainingNum + consumed);
    }
    return "Unlimited";
  })();

  const carryLabel = String(stat.carryOver ?? 0);

  const showDonut = isUnlimited
    ? consumed > 0
    : remainingNum > 0 || consumed > 0;

  const donutSeries = (() => {
    if (!showDonut) return null;
    if (isUnlimited) {
      // No finite total — don't split the ring into "consumed vs fake remainder".
      // Full ring uses accent at REMAINDER_TRACK_OPACITY only; consumed is in the stat grid below.
      // `value: 1` is only so the chart draws a full circle; hover shows "Unlimited" (valueFormatter).
      return {
        data: [{ id: "unlimited", value: 1 }],
        colors: [remainderTrack],
        valueFormatter: () => "Unlimited",
      };
    }
    const rem = Math.max(remainingNum, 0);
    const use = Math.max(consumed, 0);
    if (rem <= 0 && use <= 0) return null;
    // Consumed first in full accent; remaining in higher-opacity tint for contrast on the card.
    return {
      data: [
        { id: "consumed", value: use, label: "Consumed" },
        { id: "remaining", value: rem, label: "Remaining" },
      ],
      colors: [accentColor, remainderTrack],
      valueFormatter: (item: { value: number }) => formatBalance(item.value),
    };
  })();

  return (
    <Box
      sx={{
        bgcolor: theme.palette.secondary.light,
        borderRadius: "14px",
        width: "100%",
        maxWidth: 253,
        minHeight: 278,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          mx: 1.5,
          mt: 1.5,
          borderRadius: 1,
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          bgcolor: "transparent",
        }}
      >
        {donutSeries ? (
          <PieChart
            width={140}
            height={140}
            series={[
              {
                type: "pie",
                data: donutSeries.data,
                innerRadius: DONUT_INNER_RADIUS,
                outerRadius: DONUT_OUTER_RADIUS,
                paddingAngle: 1,
                valueFormatter: donutSeries.valueFormatter,
              },
            ]}
            colors={donutSeries.colors}
            slotProps={{ legend: { sx: { display: "none" } } }}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            sx={{ bgcolor: "transparent" }}
          />
        ) : null}

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            gap: 0.25,
          }}
        >
          <Typography
            sx={{
              color: "#000",
              fontWeight: 700,
              fontSize: isUnlimited ? 28 : 22,
              lineHeight: 1.1,
              fontFamily: "inherit",
            }}
          >
            {isUnlimited ? "∞" : remainingNum}
          </Typography>
          <Typography
            sx={{
              color: "rgba(0,0,0,0.55)",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            remaining
          </Typography>
        </Box>
      </Box>

      <Typography
        textAlign="center"
        sx={{
          fontSize: 14,
          fontWeight: 700,
          color: "#000",
          mt: 1,
          px: 1,
        }}
      >
        {stat.leaveTypeName}
      </Typography>

      <Divider sx={{ borderColor: "rgba(0,0,0,0.12)", mx: 2, mt: 1 }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          px: 2,
          py: 1.5,
          flex: 1,
          alignContent: "start",
        }}
      >
        <StatCell
          label="Remaining"
          value={isUnlimited ? "Unlimited" : formatBalance(stat.available)}
        />
        <StatCell label="Consumed" value={formatBalance(stat.consumed)} />
        <StatCell label="Allocated" value={allocatedLabel} />
        <StatCell label="Carry Over" value={carryLabel} />
      </Box>
    </Box>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#000" }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 700,
          color: "#000",
          mt: 0.25,
          lineHeight: 1.2,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
