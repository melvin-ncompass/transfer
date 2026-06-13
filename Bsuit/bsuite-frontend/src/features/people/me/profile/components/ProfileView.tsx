import { useState, useCallback, useMemo } from "react";
import { Avatar, Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { Snackbar } from "../../../../../components/atom/snackbar";
import BasicInfoCard from "./BasicInfoCard";
import PersonalInfoCard from "./PersonalInfoCard";
import PaymentInfoCard from "./PaymentInfoCard";
import EducationCard from "./EducationCard";
import PayrollInfoCard from "./PayrollInfoCard";
import AttendanceInfoCard from "./AttendanceInfoCard";
import ExperienceCard from "./ExperienceCard";
import BasicInfoModal from "./BasicInfoModal";
import PersonalInfoModal from "./PersonalInfoModal";
import EducationModal from "./EducationModal";
import ExperienceModal from "./ExperienceModal";
import PaymentInfoModal from "./PaymentInfoModal";
import PayrollInfoModal from "./PayrollInfoModal";
import AttendanceInfoModal from "./AttendanceInfoModal";
import { useGetEmployeeInfoQuery } from "../../../api/people.api";
import { useGetEmployeeProfileQuery } from "../api/profile.api";
import { normalizeEmployeeProfile } from "../types/profile.types";
import { Stack } from "@mui/system";
import { Chip } from "../../../../../components/atom/chips";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";

type CardKey =
    | "Basic"
    | "Personal"
    | "Payment"
    | "Education"
    | "Payroll"
    | "Attendance"
    | "Experience";

export default function ProfileView() {
    const theme = useTheme();
    const { data: headerData } = useGetHeaderDataQuery();
    const { data: employeeInfo } = useGetEmployeeInfoQuery();
    const employeeId = String(employeeInfo?.data?.employeeId ?? "");

    const { data: profileResponse, isLoading, isError } = useGetEmployeeProfileQuery(
        employeeId,
        { skip: !employeeId }
    );

    const profile = useMemo(
        () =>
            profileResponse?.data
                ? normalizeEmployeeProfile(profileResponse.data)
                : null,
        [profileResponse?.data]
    );

    // ── active card state (default: Basic) ──────────────────────────────────
    const [activeCard, setActiveCard] = useState<CardKey>("Basic");

    const [basicModalOpen, setBasicModalOpen] = useState(false);
    const [personalModalOpen, setPersonalModalOpen] = useState(false);
    const [educationModalOpen, setEducationModalOpen] = useState(false);
    const [experienceModalOpen, setExperienceModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [payrollModalOpen, setPayrollModalOpen] = useState(false);
    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: "success" | "error" | "info" | "warning";
    }>({ open: false, message: "", color: "info" });

    const showMessage = useCallback((message: string, color: "success" | "error" = "success") => {
        setSnackbar({ open: true, message, color });
    }, []);

    const chips: { label: CardKey }[] = [
        { label: "Basic" },
        { label: "Personal" },
        { label: "Payment" },
        { label: "Education" },
        { label: "Payroll" },
        { label: "Attendance" },
        { label: "Experience" },
    ];

    if (isLoading || !profile) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
                <Typography color="error">Failed to load profile. Please try again.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                />
            )}

            {/* Header */}
            <Box
                display="flex"
                alignItems="center"
                gap={2}
                sx={{ borderRadius: 1, p: 2 }}
                bgcolor={theme.palette.secondary.light}
            >
                <Avatar
                    src={headerData?.data?.userProfilePic || undefined}
                    sx={{ width: 64, height: 64, fontSize: 24 }}
                >
                    {!headerData?.data?.userProfilePic &&
                        profile.basicInformation.firstName
                            ?.charAt(0)
                            ?.toUpperCase()}
                </Avatar>
                <Stack>
                    <Typography variant="h5">
                        {profile.basicInformation.firstName}{" "}
                        {profile.basicInformation.lastName}
                    </Typography>
                    <Stack direction="row" gap={1} alignItems="center">
                        <Chip label={profile.basicInformation.employeeId} size="small" />
                        <Chip label={profile.basicInformation.department} size="small" />
                        <Chip
                            label={
                                profile.basicInformation.employeeType
                                    ?.charAt(0)
                                    .toUpperCase() +
                                profile.basicInformation.employeeType
                                    ?.slice(1)
                                    .toLowerCase()
                            }
                            size="small"
                        />
                    </Stack>
                </Stack>
            </Box>

            {/* Navigation chips */}
            <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
                {chips.map(({ label }) => (
                    <Chip
                        key={label}
                        label={label}
                        size="small"
                        onClick={() => setActiveCard(label)}
                        // highlight the active chip — adjust the prop name to match your Chip API
                        color={activeCard === label ? "primary" : "secondary"}

                    />
                ))}
            </Stack>

            {/* Conditionally rendered card */}
            {activeCard === "Basic" && (
                <BasicInfoCard data={profile.basicInformation} />
            )}

            {activeCard === "Personal" && (
                <PersonalInfoCard
                    data={profile.personalInformation}
                    onEdit={() => setPersonalModalOpen(true)}
                />
            )}

            {activeCard === "Payment" && (
                <PaymentInfoCard data={profile.paymentInformation} />
            )}

            {activeCard === "Education" && (
                <EducationCard
                    data={profile.educationInformation}
                    onEdit={() => setEducationModalOpen(true)}
                />
            )}

            {activeCard === "Payroll" && (
                <PayrollInfoCard data={profile.payrollInformation} />
            )}

            {activeCard === "Attendance" && (
                <AttendanceInfoCard data={profile.attendanceInformation} />
            )}

            {activeCard === "Experience" && (
                <ExperienceCard
                    data={profile.experienceInformation}
                    onEdit={() => setExperienceModalOpen(true)}
                />
            )}

            {/* Modals (always mounted so they can open from anywhere) */}
            <PersonalInfoModal
                open={personalModalOpen}
                onClose={() => setPersonalModalOpen(false)}
                data={profile.personalInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
            <EducationModal
                open={educationModalOpen}
                onClose={() => setEducationModalOpen(false)}
                data={profile.educationInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
            <ExperienceModal
                open={experienceModalOpen}
                onClose={() => setExperienceModalOpen(false)}
                data={profile.experienceInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
            <BasicInfoModal
                open={basicModalOpen}
                onClose={() => setBasicModalOpen(false)}
                data={profile.basicInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
            <PaymentInfoModal
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                data={profile.paymentInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
            <PayrollInfoModal
                open={payrollModalOpen}
                onClose={() => setPayrollModalOpen(false)}
                data={profile.payrollInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
            <AttendanceInfoModal
                open={attendanceModalOpen}
                onClose={() => setAttendanceModalOpen(false)}
                data={profile.attendanceInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
        </Box>
    );
}