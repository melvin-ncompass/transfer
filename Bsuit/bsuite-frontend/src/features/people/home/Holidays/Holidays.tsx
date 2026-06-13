import { Box, Card, Typography } from "@mui/material";

import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useGetHolidaysForHomeQuery } from "./api/homeHoliday.api";
import { useGetEmployeeInfoQuery } from "../../api/people.api";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import HolidayView from "./AllHolidays";
import { PrimaryButton } from "../../../../components/atom/button";

function Holidays() {
  const { data: employeeInfo } = useGetEmployeeInfoQuery();
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data: holidays = [],
    isLoading,
    isError,
  } = useGetHolidaysForHomeQuery(employeeInfo?.data?.employeeId!.toString()!, {
    skip: !employeeInfo?.data?.employeeId,
  });

  const [currentIdx, setCurrentIdx] = useState(0);

  const pleasantColors = [
    "#e0bda5",
    "#FFB3C6",
    "#BFD7EA",
    "#C8E6C9",
    "#FFF9C4",
    "#D1C4E9",
    "#FFCCBC",
  ];
  const contrastColors = [
    "#5A3E36",
    "#7B2840",
    "#1A3D5C",
    "#2E4F3C",
    "#5A5330",
    "#422675",
    "#B33E27",
  ];

  const [colorIndex] = useState(() =>
    Math.floor(Math.random() * pleasantColors.length),
  );

  const bgColor = pleasantColors[colorIndex];
  const textColor = contrastColors[colorIndex];

  const upcomingHolidays = useMemo(() => {
    const startOfToday = dayjs().startOf("day");
    return holidays.filter(
      (h) => !dayjs(h.date).startOf("day").isBefore(startOfToday),
    );
  }, [holidays]);

  if (isLoading || isError) return null;

  const currentHoliday = upcomingHolidays[currentIdx];
  const hasUpcoming = upcomingHolidays.length > 0;

  return (
    <Card
      elevation={2}
      sx={{
        p: 1.5,
        px: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        bgcolor: bgColor,
        color: textColor,
        borderRadius: 1,
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Holidays
          </Typography>
          {/* Content with navigation */}
          <Box display="flex" alignItems="center" gap={1}>
            {/* {currentIdx > 0 && (
            <IconButton
              size="small"
              onClick={() => setCurrentIdx((prev) => prev - 1)}
              sx={{ color: textColor }}
            >
              <ArrowBackIosNewRounded fontSize="small" />
            </IconButton>
          )} */}

            <Box flex={1}>
              {hasUpcoming && currentHoliday ? (
                <>
                  <Typography variant="h5" fontWeight={600}>
                    {currentHoliday.description}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {dayjs(currentHoliday.date).format("dddd, MMM DD, YYYY")}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" fontWeight={500} sx={{ opacity: 0.9 }}>
                  No upcoming holiday
                </Typography>
              )}
            </Box>

            {/* {currentIdx < list.length - 1 && (
            <IconButton
              size="small"
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              sx={{ color: textColor }}
            >
              <ArrowForwardIosRounded fontSize="small" />
            </IconButton>
          )} */}
          </Box>
        </Box>

        <PrimaryButton
          onClick={() => setModalOpen(true)}
          color="success"
          sx={{
            px: 2,
            py: 0.75,
            border: "none",
            borderRadius: 1,
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
            // ":hover": {
            //   bgcolor: "rgba(255, 255, 255, 0.7)",
            // },
          }}
        >
          View All
        </PrimaryButton>
      </Box>


      {/* Modal */}
      <ModalElement
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="All Holidays"
        maxWidth="lg"
      >
        <HolidayView />
      </ModalElement>
    </Card>
  );
}

export default Holidays;