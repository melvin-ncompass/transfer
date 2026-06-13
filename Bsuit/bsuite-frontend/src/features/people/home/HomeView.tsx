import { Card, Typography, Button, Stack, Box } from "@mui/material";
import ClockInOutView from "./ClockInOut/ClockInOutView";
import { Grid } from "@mui/system";
import Holidays from "./Holidays/Holidays";
import BirthdaysView from "./BirthdaysAnniversaries/BirthdaysView";
import PostPollPraise from "./PostPollsPraise/PostPollsPraise";
import { useGetEmployeeInfoQuery } from "../api/people.api";
import { useGetEmployeeQuery } from "../org/people/directory/api/directory.api";
import { useGetHolidaysForHomeQuery } from "./Holidays/api/homeHoliday.api";
import FeedView from "./PostPollsPraise/FeedViewPage";
import { useCallback, useState } from "react";
import {
  useGetBirthdaysQuery,
  useGetWorkAnniversariesQuery,
  type BirthdayPerson,
} from "./BirthdaysAnniversaries/api/birthday.api";
import { EmployeeWishesDrawer } from "./BirthdaysAnniversaries/components/EmployeeWishesDrawer";

interface CelebrationCardProps {
  name: string;
  occasion: "birthday" | "work_anniversary";
  onClick: () => void;
}

function CelebrationCard({ name, occasion, onClick }: CelebrationCardProps) {
  const isBirthday = occasion === "birthday";
  const firstName = name.split(" ")[0] || "there";
  const title = isBirthday ? `Happy Birthday, ${firstName}! 🎂` : `Happy Work Anniversary, ${firstName}! 🎗️`;
  const message = isBirthday 
    ? "Wishing you a wonderful day filled with joy, laughter, and sweet surprises. Have a fantastic birthday!"
    : "Thank you for your dedication, hard work, and all the amazing contributions. Cheers to another great year!";

  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        color: (theme) => theme.palette.primary.contrastText,
        borderRadius: 2,
        p: 3,
        overflow: "hidden",
        boxShadow: (theme) => `0 8px 32px ${theme.palette.primary.main}40`,
        "@keyframes floatUp": {
          "0%": { transform: "translateY(120%) rotate(0deg)", opacity: 0 },
          "50%": { opacity: 0.8 },
          "100%": { transform: "translateY(-150px) rotate(360deg)", opacity: 0 }
        },
        "@keyframes pulseTheme": {
          "0%": { boxShadow: (theme) => `0 0 0 0 ${theme.palette.primary.contrastText}66` },
          "70%": { boxShadow: (theme) => `0 0 0 10px ${theme.palette.primary.contrastText}00` },
          "100%": { boxShadow: (theme) => `0 0 0 0 ${theme.palette.primary.contrastText}00` }
        }
      }}
    >
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            bottom: "-30px",
            left: `${10 + i * 16}%`,
            fontSize: i % 2 === 0 ? "1.5rem" : "1.1rem",
            animation: `floatUp ${5 + i * 0.7}s infinite ease-in-out`,
            animationDelay: `${i * 0.4}s`,
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 1,
          }}
        >
          {["🎉", "✨", "🎈", "🍬", "🧁", "🌟"][i % 6]}
        </Box>
      ))}

      <Stack spacing={2} sx={{ position: "relative", zIndex: 2 }}>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.5, maxWidth: "90%" }}>
          {message}
        </Typography>
        <Box sx={{ pt: 1 }}>
          <Button
            variant="contained"
            onClick={onClick}
            sx={{
              bgcolor: (theme) => theme.palette.primary.contrastText,
              color: "primary.main",
              fontWeight: 700,
              px: 3,
              borderRadius: "50px",
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
              animation: "pulseTheme 2s infinite",
              "&:hover": {
                bgcolor: (theme) => theme.palette.primary.contrastText,
                opacity: 0.95,
              }
            }}
          >
            See Your Wishes & Replies
          </Button>
        </Box>
      </Stack>
    </Card>
  );
}

function HomeView() {
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const triggerFeedRefresh = useCallback(() => setFeedRefreshKey((k) => k + 1), []);

  const { data: employeeInfo } = useGetEmployeeInfoQuery();
  const employeeId = employeeInfo?.data?.employeeId;
  const { data: employeeRes } = useGetEmployeeQuery(employeeId!, {
    skip: employeeId == null,
  });
  const showClockInOut = Boolean(employeeRes?.data?.isAttendanceEnabled);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: birthdayData } = useGetBirthdaysQuery();
  const { data: anniversaryData } = useGetWorkAnniversariesQuery();

  const birthdayToday: BirthdayPerson[] = birthdayData?.data?.today ?? [];
  const anniversaryToday: BirthdayPerson[] = anniversaryData?.data?.today ?? [];

  const isBirthdayToday = employeeId != null && birthdayToday.some((emp: BirthdayPerson) => emp.employeeId === employeeId);
  const isAnniversaryToday = employeeId != null && anniversaryToday.some((emp: BirthdayPerson) => emp.employeeId === employeeId);
  const isCelebrationToday = isBirthdayToday || isAnniversaryToday;

  const todayCelebrant = 
    birthdayToday.find((emp) => emp.employeeId === employeeId) ?? 
    anniversaryToday.find((emp) => emp.employeeId === employeeId);

  const currentUserName =
    todayCelebrant?.name ??
    employeeRes?.data?.contact?.name ??
    ([employeeRes?.data?.contact?.firstName, employeeRes?.data?.contact?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "there");

  const {
    data: holidays = [],
    isLoading: holidaysLoading,
    isError: holidaysError,
  } = useGetHolidaysForHomeQuery(
    employeeId != null ? String(employeeId) : "",
    { skip: employeeId == null }
  );
  const showHolidays =
    employeeId != null && !holidaysLoading && !holidaysError;

  const showLeftColumn = showClockInOut || showHolidays;

  return (
    <Card
      elevation={2}
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: { xs: "auto", md: "hidden" },
      }}
    >
      <Grid container spacing={2.5} sx={{
        height: { xs: "auto", md: "100%" },
        flex: 1,
        flexWrap: { xs: "wrap", md: "nowrap" },
      }}
      >
        {/* Left column */}
        <Grid
          sx={{
            width: { xs: "100%", md: "41.66%" },
            flexShrink: 0,
            height: { xs: "auto", md: "100%" },
            overflowY: { xs: "visible", md: "auto" },
          }}
        >
          <Grid
            container
            spacing={2.5}
            sx={{
              height: "100%",
              alignContent: "flex-start",
            }}
          >
            {showLeftColumn && (
              <Grid size={{ xs: 12 }}>
                <Grid container spacing={2.5}>
                  {showClockInOut && (
                    <Grid size={{ xs: 12 }}>
                      <ClockInOutView />
                    </Grid>
                  )}
                  {showHolidays && (
                    <Grid size={{ xs: 12 }}>
                      <Holidays />
                    </Grid>
                  )}
                </Grid>
              </Grid>
            )}
            {/* {isCelebrationToday && (
              <Grid size={{ xs: 12 }}>
                <CelebrationCard
                  name={currentUserName}
                  occasion={isBirthdayToday ? "birthday" : "work_anniversary"}
                  onClick={() => setDrawerOpen(true)}
                />
              </Grid>
            )} */}
            <Grid size={{ xs: 12 }}>
              <BirthdaysView />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <PostPollPraise onPostCreated={triggerFeedRefresh} />
            </Grid>
          </Grid>
        </Grid>

        {drawerOpen && todayCelebrant && (
          <EmployeeWishesDrawer
            open={drawerOpen}
            employee={todayCelebrant}
            occasionType={isBirthdayToday ? "birthday" : "work_anniversary"}
            onClose={() => setDrawerOpen(false)}
          />
        )}

        {/* Right column — FeedView */}
        <Grid
          sx={{
            width: { xs: "100%", md: "58.33%" },
            flexGrow: 1,
            height: { xs: "auto", md: "100%" },
            overflowY: { xs: "visible", md: "auto" },
            display: "flex",
            flexDirection: "column",
          }}
        >
          {isCelebrationToday && (
              <Grid size={{ xs: 12 }}>
                <CelebrationCard
                  name={currentUserName}
                  occasion={isBirthdayToday ? "birthday" : "work_anniversary"}
                  onClick={() => setDrawerOpen(true)}
                />
              </Grid>
            )}
          <FeedView currentUserId={employeeInfo?.data?.employeeId ?? null} refreshKey={feedRefreshKey} />
        </Grid>
      </Grid>
    </Card>
  );
}

export default HomeView;