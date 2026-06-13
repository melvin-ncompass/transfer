import { useState, type Dispatch, type SetStateAction } from "react";
import {
  Avatar,
  Card,
  Typography,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  IconButton,
  Divider,
} from "@mui/material";
import { Box, Stack } from "@mui/system";
import {
  type BirthdayPerson,
  useGetBirthdaysQuery,
  useGetWorkAnniversariesQuery,
} from "./api/birthday.api";
import { ChevronRight, CakeOutlined, WorkOutlineOutlined } from "@mui/icons-material";
import { EmployeeWishesDrawer } from "./components/EmployeeWishesDrawer";
import { ModalElement } from "../../../../components/dialogs/modal-element";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = ["#F28B82", "#FBBC04", "#34A853", "#4ECDE6", "#A8C7FA"];
function avatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** API returns employeeProfilePic; fall back through legacy fields too */
function getProfilePic(emp: BirthdayPerson): string | undefined {
  return (
    (emp as any).employeeProfilePic ??
    emp.profileUrl ??
    emp.contact?.profileUrl ??
    undefined
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type OccasionType = "birthday" | "work_anniversary";

// ─── Avatar stack with name tooltips on hover ─────────────────────────────────

interface AvatarStackProps {
  employees: BirthdayPerson[];
  maxVisible?: number;
  size?: number;
  overlap?: number;
  onAvatarClick?: (emp: BirthdayPerson) => void;
}

function AvatarStack({
  employees,
  maxVisible = 3,
  size = 36,
  overlap = 10,
  onAvatarClick,
}: AvatarStackProps) {
  const visible = employees.slice(0, maxVisible);
  const extra = employees.length - visible.length;
  const extraNames = employees.slice(maxVisible).map((e) => e.name).join(", ");

  return (
    <Stack direction="row" sx={{ position: "relative" }}>
      {visible.map((emp, idx) => (
        <Tooltip key={emp.employeeId} title={emp.name} placement="top" arrow>
          <Avatar
            src={getProfilePic(emp)}
            sx={{
              width: size,
              height: size,
              bgcolor: avatarColor(idx),
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              border: "2px solid",
              borderColor: "background.paper",
              ml: idx === 0 ? 0 : `-${overlap}px`,
              zIndex: visible.length - idx,
              cursor: "pointer",
            }}
            onClick={(e) => { e.stopPropagation(); onAvatarClick?.(emp); }}
          >
            {getInitials(emp.name)}
          </Avatar>
        </Tooltip>
      ))}

      {extra > 0 && (
        <Tooltip title={extraNames} placement="top" arrow>
          <Avatar
            sx={{
              width: size,
              height: size,
              bgcolor: "#CBD5E1",
              color: "#475569",
              fontSize: 12,
              fontWeight: 700,
              border: "2px solid",
              borderColor: "background.paper",
              ml: `-${overlap}px`,
              zIndex: 0,
              cursor: "default",
            }}
          >
            +{extra}
          </Avatar>
        </Tooltip>
      )}
    </Stack>
  );
}

// ─── Employee card grid item inside modal ─────────────────────────────────────

interface EmployeeCardProps {
  employee: BirthdayPerson;
  index: number;
  occasionType: OccasionType;
  showDate?: boolean;
  onSelect?: (emp: BirthdayPerson) => void;
}

function EmployeeCard({ employee, index, showDate = false, onSelect }: EmployeeCardProps) {
  return (
    <Tooltip title={employee.name} placement="top" arrow>
      <Stack
        alignItems="center"
        spacing={0.75}
        onClick={() => onSelect?.(employee)}
        sx={{
          cursor: "pointer",
          px: 1,
          py: 1,
          borderRadius: 2,
          transition: "background 0.15s",
          width: 72,
        }}
      >
        <Avatar
          src={getProfilePic(employee)}
          sx={{
            width: 52,
            height: 52,
            bgcolor: avatarColor(index),
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {getInitials(employee.name)}
        </Avatar>
        <Typography
          variant="caption"
          fontWeight={600}
          color="text.primary"
          textAlign="center"
          sx={{
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
        >
          {employee.name}
        </Typography>
        {showDate && (
          <Typography variant="caption" color="text.secondary" textAlign="center">
            {formatDate(employee.date)}
          </Typography>
        )}
      </Stack>
    </Tooltip>
  );
}

// ─── Occasions Modal ──────────────────────────────────────────────────────────

interface OccasionsModalProps {
  open: boolean;
  onClose: () => void;
  tab: OccasionType;
  setTab: Dispatch<SetStateAction<OccasionType>>;
  birthdayToday: BirthdayPerson[];
  birthdayUpcoming: BirthdayPerson[];
  anniversaryToday: BirthdayPerson[];
  anniversaryUpcoming: BirthdayPerson[];
  onSelectEmployee: (emp: BirthdayPerson, occasionType: OccasionType) => void;
}

function OccasionsModal({
  open,
  onClose,
  tab,
  setTab,
  birthdayToday,
  birthdayUpcoming,
  anniversaryToday,
  anniversaryUpcoming,
  onSelectEmployee,
}: OccasionsModalProps) {
  const todayList = tab === "birthday" ? birthdayToday : anniversaryToday;
  const upcomingList = tab === "birthday" ? birthdayUpcoming : anniversaryUpcoming;
  const isEmpty = todayList.length === 0 && upcomingList.length === 0;

  const tabsHeader = (
    <Tabs
      value={tab}
      onChange={(_e, val) => setTab(val)}
      variant="fullWidth"
      sx={{
        minHeight: 36,
        bgcolor: "rgba(0,0,0,0.04)",
        borderRadius: 2,
        p: 0.5,
        "& .MuiTabs-indicator": {
          height: "100%",
          borderRadius: 1.5,
          bgcolor: "background.paper",
          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        },
        "& .MuiTab-root": {
          minHeight: 32,
          fontSize: 13,
          fontWeight: 600,
          zIndex: 1,
          textTransform: "none",
          color: "text.secondary",
          "&.Mui-selected": { color: "text.primary" },
        },
      }}
    >
      <Tab
        value="birthday"
        label={
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <CakeOutlined sx={{ fontSize: 15 }} />
            <span>Birthdays</span>
            {(birthdayToday.length + birthdayUpcoming.length) > 0 && (
              <Chip
                label={birthdayToday.length + birthdayUpcoming.length}
                size="small"
                sx={{
                  height: 16,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: tab === "birthday" ? "#E8EAF6" : "transparent",
                  color: "text.secondary",
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
            )}
          </Stack>
        }
      />
      <Tab
        value="work_anniversary"
        label={
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <WorkOutlineOutlined sx={{ fontSize: 15 }} />
            <span>Anniversaries</span>
            {(anniversaryToday.length + anniversaryUpcoming.length) > 0 && (
              <Chip
                label={anniversaryToday.length + anniversaryUpcoming.length}
                size="small"
                sx={{
                  height: 16,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: tab === "work_anniversary" ? "#E8EAF6" : "transparent",
                  color: "text.secondary",
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
            )}
          </Stack>
        }
      />
    </Tabs>
  );

  return (
    <ModalElement
      open={open}
      onClose={onClose}
      title="Celebrations"
      maxWidth="sm"
      headerActions={tabsHeader}
    >
      <Box sx={{ mt: -1, minHeight: isEmpty ? 180 : 350 }}>
        {isEmpty ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }} spacing={1}>
            {tab === "birthday" ? (
              <CakeOutlined sx={{ fontSize: 40, color: "text.disabled" }} />
            ) : (
              <WorkOutlineOutlined sx={{ fontSize: 40, color: "text.disabled" }} />
            )}
            <Typography variant="body2" color="text.disabled">
              No {tab === "birthday" ? "birthdays" : "anniversaries"} this month
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}
            >
              {tab === "birthday" ? "Birthdays today" : "Anniversaries today"}
            </Typography>
            {/* ── Today section ── */}
            {todayList.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" sx={{ mt: 1.5, gap: 0.5, minHeight: 110 }}>
                {todayList.map((emp, idx) => (
                  <EmployeeCard
                    key={emp.employeeId}
                    employee={emp}
                    index={idx}
                    occasionType={tab}
                    showDate={false}
                    onSelect={(e) => onSelectEmployee(e, tab)}
                  />
                ))}
              </Stack>
            ) :
              <Stack direction="row" flexDirection='column' sx={{ pt: 2, minHeight: 110, alignItems: 'center', gap: 1 }}>
                {tab === "birthday" ?
                  <>
                    <CakeOutlined sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography color="text.disabled">
                      No Birthdays Today
                    </Typography>
                  </>
                  :
                  <>
                    <WorkOutlineOutlined sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography color="text.disabled">
                      No Anniversaries Today
                    </Typography>
                  </>
                }
              </Stack>
            }

            {todayList.length > 0 || upcomingList.length > 0 ? <Divider /> : ""}

            {/* ── Upcoming section ── */}
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}
            >
              Upcoming {tab === "birthday" ? "Birthdays" : "Anniversaries"}
            </Typography>
            {upcomingList.length > 0 ? (
              <Box>
                <Stack direction="row" flexWrap="wrap" sx={{ mt: 1.5, gap: 0.5, minHeight: 110 }}>
                  {upcomingList.map((emp, idx) => (
                    <EmployeeCard
                      key={emp.employeeId}
                      employee={emp}
                      index={idx + todayList.length}
                      occasionType={tab}
                      showDate
                    />
                  ))}
                </Stack>
              </Box>
            ) :
              <Stack direction="row" flexDirection='column' sx={{ pt: 2, minHeight: 110, alignItems: 'center', gap: 1 }}>
                {tab === "birthday" ?
                  <>
                    <CakeOutlined sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography color="text.disabled">
                      No Birthdays
                    </Typography>
                  </>
                  :
                  <>
                    <WorkOutlineOutlined sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography color="text.disabled">
                      No Anniversaries
                    </Typography>
                  </>
                }
              </Stack>
            }
          </Stack>
        )}
      </Box>
    </ModalElement>
  );
}

// ─── Single occasion tile ─────────────────────────────────────────────────────

interface OccasionTileProps {
  label: string;
  employees: BirthdayPerson[];
  onArrowClick: () => void;
  onAvatarClick?: (emp: BirthdayPerson) => void;
}

function OccasionTile({ label, employees, onArrowClick, onAvatarClick }: OccasionTileProps) {
  const hasEmployees = employees.length > 0;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ flex: 1, px: 2, py: 2 }}
    >
      <Stack spacing={0.75}>
        <Typography variant="body2" fontWeight={600} color="text.primary" lineHeight={1.2}>
          {label}
        </Typography>

        {hasEmployees ? (
          <AvatarStack
            employees={employees}
            onAvatarClick={onAvatarClick}
          />
        ) : (
          <Typography variant="caption" color="text.disabled">
            None today
          </Typography>
        )}
      </Stack>

      <Tooltip title={`View all ${label.toLowerCase()}`} placement="top" arrow>
        <IconButton
          size="small"
          onClick={onArrowClick}
          sx={{
            color: "text.secondary",
            ml: 1,
            flexShrink: 0,
            "&:hover": { bgcolor: "rgba(0,0,0,0.08)", color: "text.primary" },
          }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

// ─── Divider between the two tiles ───────────────────────────────────────────

function VerticalDivider() {
  return (
    <Box
      sx={{
        width: "1px",
        alignSelf: "stretch",
        bgcolor: "divider",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

function BirthdaysView() {
  const { data: birthdayData } = useGetBirthdaysQuery();
  const { data: anniversaryData } = useGetWorkAnniversariesQuery();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<BirthdayPerson | null>(null);
  const [selectedOccasionType, setSelectedOccasionType] = useState<OccasionType>("birthday");
  const [modalTab, setModalTab] = useState<OccasionType>("birthday");

  const todayDate = new Date();

  const birthdayToday: BirthdayPerson[] = birthdayData?.data?.today ?? [];
  const birthdayUpcoming: BirthdayPerson[] =
    birthdayData?.data?.thisMonth?.filter((emp: BirthdayPerson) => {
      const d = new Date(emp.date);
      return (
        d.getMonth() === todayDate.getMonth() &&
        d.getDate() > todayDate.getDate()
      );
    }) ?? [];

  const anniversaryToday: BirthdayPerson[] = anniversaryData?.data?.today ?? [];
  const anniversaryUpcoming: BirthdayPerson[] =
    anniversaryData?.data?.thisMonth?.filter(
      (emp: BirthdayPerson) => new Date(emp.date) > new Date(),
    ) ?? [];

  function handleSelectEmployee(emp: BirthdayPerson, occasionType: OccasionType) {
    setSelectedEmployee(emp);
    setSelectedOccasionType(occasionType);
    setModalOpen(false);
  }

  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: 1,
          bgcolor: "#E8EAF6",
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Stack direction="row" divider={<VerticalDivider />}>
          <OccasionTile
            label="Birthday"
            employees={birthdayToday}
            onArrowClick={() => {
              setModalTab("birthday");
              setModalOpen(true);
            }}
            onAvatarClick={(emp) => {
              setSelectedEmployee(emp);
              setSelectedOccasionType("birthday");
            }}
          />
          <OccasionTile
            label="Anniversaries"
            employees={anniversaryToday}
            onArrowClick={() => {
              setModalTab("work_anniversary");
              setModalOpen(true);
            }}
            onAvatarClick={(emp) => {
              setSelectedEmployee(emp);
              setSelectedOccasionType("work_anniversary");
            }}
          />
        </Stack>
      </Card>

      <OccasionsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tab={modalTab}
        setTab={setModalTab}
        birthdayToday={birthdayToday}
        birthdayUpcoming={birthdayUpcoming}
        anniversaryToday={anniversaryToday}
        anniversaryUpcoming={anniversaryUpcoming}
        onSelectEmployee={handleSelectEmployee}
      />

      <EmployeeWishesDrawer
        open={Boolean(selectedEmployee)}
        employee={selectedEmployee}
        occasionType={selectedOccasionType}
        onClose={() => setSelectedEmployee(null)}
      />
    </>
  );
}

export default BirthdaysView;