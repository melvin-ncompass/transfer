import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import { ModalElement } from "../../../../../../../components/dialogs/modal-element";
import { TabsAtom } from "../../../../../../../components/tabs/Tabs";
import { ExitDetailsCard } from "../ExitDetailsCard";
import { LeaveSettingsTab } from "./LeaveSettingsTab";
import { Chip } from "../../../../../../../components/atom/chips";
import { useGetExitRequestQuery } from "../../api/exit.api";
import { formatReason } from "../../util/formatReason";
import { AccordionElement } from "../../../../../../../components/atom/accordion";
import { useState } from "react";
import { useGetNoticePeriodQuery } from "../../../settings/NoticePeriod/api/notice.api";
import { usePeopleContext } from "../../../context/PeopleContext";
import { TeamTab } from "./TeamTab";
import { FinancesTab } from "./FinancesTab";
import { AssetsTab } from "./AssetsTab";
import dayjs from "dayjs";

interface ExitProgressModalProps {
  open: boolean;
  onClose: () => void;
  exitId?: number | null;
}

export const ProgressModal = ({
  open,
  onClose,
  exitId,
}: ExitProgressModalProps) => {

  const [leaveExpanded, setLeaveExpanded] = useState(true);
  const { noticePeriod } = usePeopleContext();
  const { data: fetchedData, isFetching } = useGetExitRequestQuery(exitId ?? undefined, {
    skip: !exitId || !open,
  });
  const noticeConfigId = noticePeriod.data?.id ?? (noticePeriod.configId || 1);
  const { data: noticePeriodResponse } = useGetNoticePeriodQuery(noticeConfigId, {
    skip: !open,
  });

  const { exit, approvedByAdmin } = fetchedData ?? {};

  const noticePeriodConfig = noticePeriodResponse?.data ?? noticePeriod.data;
  const noticePeriodMonths = Number(noticePeriodConfig?.duration) || 0;
  const suggestedLastWorkingDate =
    exit?.exitInitiatedDate && noticePeriodMonths
      ? dayjs(exit.exitInitiatedDate).add(noticePeriodMonths, "month")
      : null;

  return (
    <ModalElement
      open={open}
      title="Exit Progress"
      onClose={onClose}
      maxWidth="lg"
      hideCloseButton={false}
      leftHeaderAction={
        exit ? (
          <Chip
            label="Approved"
            color="info"
            size="small"
            sx={{ fontWeight: 500 }}
          />
        ) : undefined
      }
      contentSx={{}}
      sx={{
        "& .MuiDialog-paper": {
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {isFetching ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={260}>
          <CircularProgress size={28} />
        </Box>
      ) : !exit ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={260}>
          <Typography variant="body2" color="text.secondary">
            No data available.
          </Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" flex={1} minHeight={0}>
          <TabsAtom
            tabs={[
              {
                label: "Summary",
                content: (
                  <Stack spacing={2} pt={1} sx={{ margin: 0 }}>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1.5}
                      sx={{
                        p: 1.5,
                        border: "1px solid",
                        borderRadius: 2,
                        borderColor: "divider",
                        bgcolor: "grey.50",

                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          bgcolor: "primary.light",
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {exit.employee.contact?.name?.substring(0, 2).toUpperCase() ||
                          exit.employee.employeeId.substring(0, 2).toUpperCase() || "-"}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {exit.employee.contact?.name || "-"}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          Employee ID: {exit.employee.employeeId}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {exit.employee.employeeType} · Joined {dayjs(exit.employee.dateOfJoining).format('MMM DD, YYYY')}
                        </Typography>
                      </Box>
                    </Box>

                    <Box width={'100%'} sx={{ mx: 1 }}>
                      <ExitDetailsCard
                        ExitData={exit}
                        suggestedLastWorkingDate={suggestedLastWorkingDate}
                      />
                    </Box>

                    {/* Leave Details */}
                    {exit.status === "approved" && exit.leaveImpactConfigs?.length > 0 && (
                      <>
                        <Box>
                          <Stack spacing={2}>
                            <Box width="100%">

                              <Stack spacing={1.5}>
                                {exit.status === "approved" && exit.leaveImpactConfigs?.length > 0 && (

                                  <AccordionElement
                                    title="Leave details"
                                    open={leaveExpanded}
                                    onChange={(_e, isExpanded) => setLeaveExpanded(isExpanded)}
                                  >
                                    <Stack spacing={1.5}>
                                      {exit.leaveImpactConfigs.map((config) => (
                                        <Box
                                          key={config.id}
                                          sx={{
                                            border: "0.5px solid",
                                            borderColor: "grey.200",
                                            borderRadius: 2,
                                            px: 2,
                                            py: 1.5,
                                          }}
                                        >
                                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                            <Typography variant="body2" fontWeight={500}>
                                              {config.leaveType.leaveName}
                                            </Typography>
                                            <Chip
                                              label={formatReason(config.availability)}
                                              size="small"
                                              color={config.availability === "restricted" ? "error" : "success"}
                                              sx={{ fontSize: 11, height: 22, borderRadius: 10 }}
                                            />
                                          </Box>

                                          <Box display="flex" gap={1} flexWrap="wrap">
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                px: 1.25,
                                                py: 0.4,
                                                borderRadius: 1,
                                                bgcolor: "grey.100",
                                                color: "text.secondary",
                                              }}
                                            >
                                              Notice period: {formatReason(config.noticePeriodAction)}
                                            </Typography>

                                            {Number(config.extendByMultiplier) > 0 && (
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  px: 1.25,
                                                  py: 0.4,
                                                  borderRadius: 1,
                                                  bgcolor: "grey.100",
                                                  color: "text.secondary",
                                                }}
                                              >
                                                Extend by {Number(config.extendByMultiplier)} days
                                              </Typography>
                                            )}
                                          </Box>
                                        </Box>
                                      ))}
                                    </Stack>
                                  </AccordionElement>
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                        </Box>
                      </>
                    )}
                  </Stack>
                ),
              },
              {
                label: "Finances",
                content: exitId && exit ? (
                  <Box height={'100%'}>
                    <FinancesTab exitData={exit} />
                  </Box>
                ) : null
              },
              {
                label: "Team",
                content: exit ? (
                  <Box px={1} height={'100%'}>
                    <TeamTab employeeId={exit.employee.id} />
                  </Box>
                ) : null
              },

              {
                label: "Assets",
                content: exitId && exit ? (
                  <Box px={1} height={'100%'}>
                    <AssetsTab employeeId={exit.employee.id} />
                  </Box>
                ) : null,
              },
              {
                label: "Leave Type Settings",
                content: exitId ? (
                  <Box pt={1} height={'100%'}>
                    <LeaveSettingsTab
                      exitId={exitId}
                      empId={exit.employee.id}
                      existingConfigs={exit.leaveImpactConfigs ?? []}
                    />
                  </Box>
                ) : null,
              },
            ]}
            contentSx={{
              p: 0,
              pt: 1,
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          />
        </Box>
      )}
    </ModalElement>
  );
};