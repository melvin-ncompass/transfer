import { Box, Stack, Typography, Divider, CircularProgress, Button } from "@mui/material";
import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { PrimaryButton, PrimaryIconButton } from "../../../../../../components/atom/button";
import { useGetAssetAuditHistoryQuery, type AssetData, type AssignmentsType } from "../api/assetList.api";
import type { AssetType } from "../../asset-category/api/assetCategory.api";
import { DateRangePicker } from "../../../../../../components/atom/custom-date-range-picker/DateRangePicker";
import { CollapsibleCardV2 } from "../../../../../../components/atom/card/CollapsibleCard_v2";
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';

import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Chip } from "../../../../../../components/atom/chips";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface AssetDetailsModalProps {
  open: boolean;
  onClose: () => void;
  asset: any;
  activeType?: AssetType | null;
  hideHistory?: boolean;
  chipStatus?: string;
}

export const AssetDetailsModal = ({
  open,
  onClose,
  asset,
  activeType,
  hideHistory = false,
  chipStatus,
}: AssetDetailsModalProps) => {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [fromDate, toDate] = dateRange;

  const shouldSkipDateFilter =
    (!!fromDate && !toDate) || (!fromDate && !!toDate);

  const { data: auditData, isFetching: isAuditFetching } = useGetAssetAuditHistoryQuery(
    {
      typeId: activeType?.id as number,
      listId: asset?.asset?.id as number,
      from: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
      to: toDate ? toDate.format("YYYY-MM-DD") : undefined,
    },
    { skip: !open || !activeType?.id || !asset?.asset?.id || shouldSkipDateFilter, }
  );

  const handleClose = () => {
    setDateRange([null, null]);
    onClose();
  };

  const displayAsset: AssetData = auditData || asset?.asset;
  console.log(displayAsset, "audittadata")

  if (!displayAsset) return null;

  const assignments: AssignmentsType[] = displayAsset.assignments ?? [];

  return (
    <ModalElement
      open={open}
      onClose={handleClose}
      title="Asset Details"
      maxWidth={hideHistory ? "md" : "lg"}
      height={800}
    >
      <Box
        display="flex"
        gap={hideHistory ? 0 : 3}
        sx={{ height: hideHistory ? "45vh" : "65vh" }}>

        {/* LEFT PANEL */}
        <Box
          sx={{
            width: hideHistory ? "100%" : "30%",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: hideHistory ? "auto" : "100%",
          }}
        >
          <Box display='flex' gap={2} alignItems='center' mb={2}>
            <Typography variant="h6" color="textPrimary">
              {displayAsset.assetName}
            </Typography>
            {hideHistory ? (
              <Box display='flex'>
                {chipStatus && (
                  <Chip label={chipStatus} color="info" size="xs" sx={{ minWidth: 120 }} />
                )}
              </Box>
            ) : null}
          </Box>

          <Box
            sx={{
              overflowY: hideHistory ? "visible" : "auto",
              flex: 1,
              minHeight: 0,
              ...(hideHistory
                ? {
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 2,
                }
                : {
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }),
            }}
          >
            <Detail label="ASSET ID" value={displayAsset.assetId} />
            <Detail label="ASSET NAME" value={displayAsset.assetName} />
            <Detail label="LOCATION" value={displayAsset.location ? displayAsset.location : '-'} />
            <Detail label="CONDITION" value={displayAsset.assetCondition?.conditionName} />
            <Detail
              label="STATUS"
              value={(() => {
                switch (displayAsset.assetStatus) {
                  case "assigned":
                    return (
                      <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                        <Chip label="Assigned" color="info" size="xs" sx={{ minWidth: 70 }} />
                      </Box>
                    );
                  case "not_available":
                    return (
                      <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                        <Chip label="Not Available" color="error" size="xs" sx={{ minWidth: 100 }} />
                      </Box>
                    );
                  case "available":
                  default:
                    return (
                      <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                        <Chip label="Available" color="success" size="xs" sx={{ minWidth: 70 }} />
                      </Box>
                    );
                }
              })()}
            />
            <Detail label="PURCHASED ON" value={dayjs(displayAsset.purchasedOn).format("MMM DD, YYYY") || "-"} />
            <Detail label="WARRANTY EXPIRES" value={dayjs(displayAsset.warrantyExpiresOn).format("MMM DD, YYYY") || "-"} />
            <Detail label="RECOVERED ON" value={assignments[0]?.recoveredOn ? dayjs(assignments[0]?.recoveredOn).format("MMM DD, YYYY") : "-"} />
            <Detail label="RECOVERED BY" value={assignments[0]?.recoveredBy?.contact?.name
              ? `${assignments[0]?.recoveredBy?.contact?.name} ${assignments[0]?.recoveredBy?.contact?.lastName || ""}`
              : "-"}
            />

            {/* Divider spans full width in grid mode */}
            {/* <Box sx={hideHistory ? { gridColumn: "1 / -1" } : {}}>
              <Divider />
            </Box> */}

            {Object.entries(displayAsset.attributes ?? {}).map(([key, value]) => (
              <Detail
                key={key}
                label={key}
                value={
                  Array.isArray(value)
                    ? value.join(", ")
                    : String(value ?? "")
                }
              />
            ))}
          </Box>
        </Box>
        {!hideHistory && (
          /* RIGHT PANEL */
          <Box
            sx={{
              flex: 1,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              p: 2,
              height: "100%",
              overflowY: "auto",
            }}
          >
            <Box
              sx={{
                position: "sticky",
                top: -16,
                zIndex: 2,
                bgcolor: "background.paper",
                pb: 2,
                mb: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="subtitle2">
                  Asset assignment history
                </Typography>

                {assignments.length !== 0 && (
                  <Box width={320} display="flex" gap={1} alignItems="center">
                    <Box flex={1}>
                      <DateRangePicker
                        label="From-To"
                        startValue={fromDate}
                        endValue={toDate}
                        onChange={setDateRange}
                        displayFormat="full"
                        width="100%"
                        min={dayjs(displayAsset.purchasedOn)}
                      />
                    </Box>

                    {(fromDate || toDate) && (
                      <PrimaryIconButton
                        size="medium"
                        variant="outlined"
                        onClick={() => setDateRange([null, null])}
                        color="primary"
                        icon={<ClearOutlinedIcon />}
                      />
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            {isAuditFetching ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={300}
              >
                <CircularProgress />
              </Box>
            ) : assignments.length === 0 ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={300}
              >
                <Typography variant="body2" color="text.secondary">
                  No assignment history found
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {assignments.map((item: any) => {
                  const isRecovered = Boolean(item.recoveredOn);

                  const recoveredDate = item.recoveredOn
                    ? dayjs(item.recoveredOn)
                    : null;

                  const assignedDate = item.assignedOn
                    ? dayjs(item.assignedOn)
                    : null;

                  const isRecoveredInRange =
                    recoveredDate &&
                    (!fromDate || recoveredDate.isSameOrAfter(fromDate, "day")) &&
                    (!toDate || recoveredDate.isSameOrBefore(toDate, "day"));

                  const isAssignedInRange =
                    assignedDate &&
                    (!fromDate || assignedDate.isSameOrAfter(fromDate, "day")) &&
                    (!toDate || assignedDate.isSameOrBefore(toDate, "day"));

                  return (
                    <Box
                      key={`${item.id}-${item.assignedOn}-${item.recoveredOn ?? "active"}`}
                    >
                      {isRecovered && item.recoveredOn && isRecoveredInRange && (
                        <CollapsibleCardV2
                          defaultOpen={true}
                          summary={
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              width="100%"
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    bgcolor: "warning.main",
                                  }}
                                />
                                <Typography variant="body2">
                                  Asset Recovered
                                </Typography>
                              </Stack>

                              <Typography variant="caption" color="text.secondary">
                                {dayjs(item.recoveredOn).format("MMM DD, YYYY")}
                              </Typography>
                            </Box>
                          }
                          details={
                            <Box>
                              <HistoryRow label="Status" value="Recovered" />
                              <Divider />
                              <HistoryRow
                                label="Recovered on"
                                value={dayjs(item.recoveredOn).format("MMM DD, YYYY")}
                              />
                              <Divider />
                              <HistoryRow
                                label="Recovered by"
                                value={item.recoveredBy?.contact?.name}
                              />
                              <Divider />
                              <HistoryRow
                                label="Acknowledgement"
                                value={
                                  item.isAcknowledgementRequested
                                    ? "Requested"
                                    : "No"
                                }
                              />
                            </Box>
                          }
                        />
                      )}

                      {item.assignedOn && isAssignedInRange && (
                        <CollapsibleCardV2
                          defaultOpen={true}
                          summary={
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              width="100%"
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    bgcolor: "primary.main",
                                  }}
                                />
                                <Typography variant="body2">
                                  Asset Assigned
                                </Typography>
                              </Stack>

                              <Typography variant="caption" color="text.secondary">
                                {dayjs(item.assignedOn).format("MMM DD, YYYY")}
                              </Typography>
                            </Box>
                          }
                          details={
                            <Box>
                              <HistoryRow label="Status" value="Assigned" />
                              <Divider />
                              <HistoryRow
                                label="Assigned on"
                                value={dayjs(item.assignedOn).format("MMM DD, YYYY")}
                              />
                              <Divider />
                              <HistoryRow
                                label="Assigned to"
                                value={item.assignedTo?.contact?.name}
                              />
                              <Divider />
                              <HistoryRow
                                label="Assigned by"
                                value={item.assignedBy?.contact?.name}
                              />
                              <Divider />
                              <HistoryRow
                                label="Acknowledgement"
                                value={
                                  item.isAcknowledgementRequested
                                    ? "Requested"
                                    : "No"
                                }
                              />
                            </Box>
                          }
                        />
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}
      </Box>
    </ModalElement>
  );
};

const Detail = ({
  label,
  value,
}: {
  label: string;
  value?: string | React.ReactNode;
}) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>

    {typeof value === "string" || typeof value === "number" ? (
      <Typography variant="body2">{value ?? "-"}</Typography>
    ) : (
      <Box display='flex' justifyContent='flex-start'>
        {value ?? <Typography variant="body2">-</Typography>}
      </Box>
    )}
  </Box>
);

const HistoryRow = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "180px 1fr",
      p: 1.5,
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2">{value ?? "-"}</Typography>
  </Box>
);