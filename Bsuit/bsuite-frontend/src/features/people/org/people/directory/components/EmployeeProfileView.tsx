import { useState, useCallback, useMemo } from "react";
import { Avatar, Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { Stack } from "@mui/system";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { Chip } from "../../../../../../components/atom/chips";
import BasicInfoCard from "../../../../me/profile/components/BasicInfoCard";
import PersonalInfoCard from "../../../../me/profile/components/PersonalInfoCard";
import PaymentInfoCard from "../../../../me/profile/components/PaymentInfoCard";
import EducationCard from "../../../../me/profile/components/EducationCard";
import PayrollInfoCard from "../../../../me/profile/components/PayrollInfoCard";
import AttendanceInfoCard from "../../../../me/profile/components/AttendanceInfoCard";
import ExperienceCard from "../../../../me/profile/components/ExperienceCard";
import BasicInfoModal from "../../../../me/profile/components/BasicInfoModal";
import PersonalInfoModal from "../../../../me/profile/components/PersonalInfoModal";
import EducationModal from "../../../../me/profile/components/EducationModal";
import ExperienceModal from "../../../../me/profile/components/ExperienceModal";
import PaymentInfoModal from "../../../../me/profile/components/PaymentInfoModal";
import PayrollInfoModal from "../../../../me/profile/components/PayrollInfoModal";
import AttendanceInfoModal from "../../../../me/profile/components/AttendanceInfoModal";
import { useGetEmployeeProfileQuery } from "../../../../me/profile/api/profile.api";
import { useGetEmployeeQuery } from "../api/directory.api";
import { formatDateShort } from "../../../../../../utils/numberFormatter";

type CardKey =
    | "Basic"
    | "Personal"
    | "Payment"
    | "Education"
    | "Payroll"
    | "Attendance"
    | "Experience";

interface Props {
    /** Numeric DB id as string, e.g. "4" */
    employeeId: string;
}

export default function EmployeeProfileView({ employeeId }: Props) {
    const theme = useTheme();
    const numericId = Number(employeeId);

    const { data: profileResponse, isLoading, isError } = useGetEmployeeProfileQuery(
        employeeId,
        { skip: !employeeId }
    );

    // Fetch full employee record so we can supplement fields the profile endpoint may not return
    const { data: employeeResponse } = useGetEmployeeQuery(numericId, {
        skip: !employeeId || isNaN(numericId),
    });

    const profile = profileResponse?.data;
    const emp = employeeResponse?.data;
    const existsInPayrun = emp?.existsInPayRun;

    // Merge: profile endpoint data takes precedence; fall back to employee record for missing fields
    const supplementedProfile = useMemo(() => {
        if (!profile) return null;
        const pi = profile.personalInformation;
        const c = emp?.contact;
        return {
            ...profile,
            basicInformation: {
                ...profile.basicInformation,
                subDepartment:
                    (profile.basicInformation as any)?.subDepartment ??
                    emp?.subDepartment?.subDepartmentName ??
                    "",
            },
            payrollInformation: {
                ...profile.payrollInformation,
                salaryTemplateId:
                    emp?.template?.initialTemplate?.id ??
                    emp?.template?.id ??
                    (profile.payrollInformation as any)?.salaryTemplateId ??
                    "",
                salaryTemplateName:
                    profile.payrollInformation.salaryTemplateName ??
                    emp?.template?.initialTemplate?.templateName ??
                    emp?.template?.templateName ??
                    "",
                incomeTaxConfig:
                    profile.payrollInformation.incomeTaxConfig ??
                    emp?.incomeTaxConfig?.configName ??
                    "",
                incomeTaxConfigId:
                    emp?.incomeTaxConfig?.id ??
                    (profile.payrollInformation as any)?.incomeTaxConfigId ??
                    "",
                isPayrollEnabled:
                    emp?.isPayrollEnabled ??
                    (profile.payrollInformation as any)?.isPayrollEnabled ??
                    true,
                pfEnabled:
                    profile.payrollInformation.pfEnabled ??
                    emp?.isPfEnabled ??
                    false,
                uanNumber:
                    profile.payrollInformation.uanNumber ??
                    emp?.uanNumber ??
                    "",
                pfNumber:
                    profile.payrollInformation.pfNumber ??
                    emp?.pfNumber ??
                    "",
            },
            attendanceInformation: {
                ...profile.attendanceInformation,
                shiftInfo:
                    profile.attendanceInformation.shiftInfo ??
                    emp?.shift?.shiftName ??
                    "",
                weekoffPolicy:
                    profile.attendanceInformation.weekoffPolicy ??
                    emp?.weekoff?.weekOffName ??
                    "",
                leavePlan:
                    profile.attendanceInformation.leavePlan ??
                    emp?.leavePlan?.name ??
                    "",
                holidayPlan:
                    profile.attendanceInformation.holidayPlan ??
                    emp?.holidayPlan?.planName ??
                    "",
                shiftId:
                    emp?.shift?.id ??
                    (profile.attendanceInformation as any)?.shiftId ??
                    "",
                weekoffId:
                    emp?.weekoff?.id ??
                    (profile.attendanceInformation as any)?.weekoffId ??
                    "",
                leavePlanId:
                    emp?.leavePlan?.id ??
                    (profile.attendanceInformation as any)?.leavePlanId ??
                    "",
                holidayPlanId:
                    emp?.holidayPlan?.id ??
                    (profile.attendanceInformation as any)?.holidayPlanId ??
                    "",
                isAttendanceEnabled:
                    emp?.isAttendanceEnabled ??
                    (profile.attendanceInformation as any)?.isAttendanceEnabled ??
                    true,
            },
            personalInformation: {
                ...pi,
                pan:             c?.pan           || pi.pan           || pi.panNumber    || "",
                panNumber:       c?.pan           || pi.panNumber     || pi.pan          || "",
                aadharNumber:    emp?.aadharNumber || pi.aadharNumber  || pi.aadhar       || "",
                nameAsPerPan:    emp?.nameAsPerPan  || pi.nameAsPerPan  || "",
                nameAsPerAadhar: emp?.nameAsPerAadhar || pi.nameAsPerAadhar || "",
                personalEmail:   emp?.personalEmail  || pi.personalEmail  || "",
                emergencyContact: emp?.emergencyContact || pi.emergencyContact || "",
                dateOfBirth:     formatDateShort(emp?.dateOfBirth)    || formatDateShort(pi.dateOfBirth)    || "",
                bloodGroup:      emp?.bloodGroup     || pi.bloodGroup     || "",
                maritalStatus:   emp?.maritalStatus  || pi.maritalStatus  || "",
                fatherName:      emp?.fatherName     || pi.fatherName     || "",
                phoneNumber:     c?.phoneNumber      || pi.phoneNumber    || pi.mobileNo  || "",
                mobileNo:        c?.phoneNumber      || pi.mobileNo       || pi.phoneNumber || "",
                addressLine1:    c?.addressLine1     || pi.addressLine1   || pi.address   || "",
                address:         c?.addressLine1     || pi.address        || pi.addressLine1 || "",
                addressLine2:    c?.addressLine2     || pi.addressLine2   || "",
                city:            c?.city             || pi.city           || "",
                state:           c?.state            || pi.state          || "",
                pincode:         c?.pincode          || pi.pincode        || "",
                country:         c?.country          || pi.country        || "",
            },
        };
    }, [profile, emp]);

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

    if (isLoading || !supplementedProfile) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
                <Typography color="error">Failed to load employee profile. Please try again.</Typography>
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
            {/* <Box
                display="flex"
                alignItems="center"
                gap={2}
                sx={{ borderRadius: 1, p: 2 }}
                bgcolor={theme.palette.secondary.light}
            >
                <Avatar sx={{ width: 64, height: 64, fontSize: 24 }}>
                    {supplementedProfile.basicInformation.firstName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Stack>
                    <Typography variant="h5">
                        {supplementedProfile.basicInformation.firstName}{" "}
                        {supplementedProfile.basicInformation.lastName}
                    </Typography>
                    <Stack direction="row" gap={1} alignItems="center">
                        <Chip label={supplementedProfile.basicInformation.employeeId} size="small" />
                        <Chip label={supplementedProfile.basicInformation.department} size="small" />
                        <Chip
                            label={
                                supplementedProfile.basicInformation.employeeType
                                    ?.charAt(0)
                                    .toUpperCase() +
                                supplementedProfile.basicInformation.employeeType
                                    ?.slice(1)
                                    .toLowerCase()
                            }
                            size="small"
                        />
                    </Stack>
                </Stack>
            </Box> */}

            {/* Navigation chips */}
            <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
                {chips.map(({ label }) => (
                    <Chip
                        key={label}
                        label={label}
                        size="small"
                        onClick={() => setActiveCard(label)}
                        color={activeCard === label ? "primary" : "secondary"}
                    />
                ))}
            </Stack>

            {/* Conditionally rendered card */}
            {activeCard === "Basic" && (
                <BasicInfoCard
                    data={supplementedProfile.basicInformation}
                    onEdit={() => setBasicModalOpen(true)}
                />
            )}

            {activeCard === "Personal" && (
                <PersonalInfoCard
                    data={supplementedProfile.personalInformation}
                    onEdit={() => setPersonalModalOpen(true)}
                />
            )}

            {activeCard === "Payment" && (
                <PaymentInfoCard
                    data={supplementedProfile.paymentInformation}
                    onEdit={() => setPaymentModalOpen(true)}
                />
            )}

            {activeCard === "Education" && (
                <EducationCard
                    data={supplementedProfile.educationInformation}
                    onEdit={() => setEducationModalOpen(true)}
                />
            )}

            {activeCard === "Payroll" && (
                <PayrollInfoCard
                    data={supplementedProfile.payrollInformation}
                    onEdit={() => setPayrollModalOpen(true)}
                />
            )}

            {activeCard === "Attendance" && (
                <AttendanceInfoCard
                    data={supplementedProfile.attendanceInformation}
                    onEdit={() => setAttendanceModalOpen(true)}
                    employeeId={employeeId}
                    employeeName={(supplementedProfile.basicInformation as any)?.name ?? ""}
                />
            )}

            {activeCard === "Experience" && (
                <ExperienceCard
                    data={supplementedProfile.experienceInformation}
                    onEdit={() => setExperienceModalOpen(true)}
                />
            )}

            {/* Modals */}
            <BasicInfoModal
                open={basicModalOpen}
                onClose={() => setBasicModalOpen(false)}
                data={supplementedProfile.basicInformation}
                employeeId={employeeId}
                existsInPayRun={existsInPayrun}
                showMessage={showMessage}
                isAdmin
            />
            <PersonalInfoModal
                open={personalModalOpen}
                onClose={() => setPersonalModalOpen(false)}
                data={supplementedProfile.personalInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
            <EducationModal
                open={educationModalOpen}
                onClose={() => setEducationModalOpen(false)}
                data={supplementedProfile.educationInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
            <ExperienceModal
                open={experienceModalOpen}
                onClose={() => setExperienceModalOpen(false)}
                data={supplementedProfile.experienceInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
            <PaymentInfoModal
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                data={supplementedProfile.paymentInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
            <PayrollInfoModal
                open={payrollModalOpen}
                onClose={() => setPayrollModalOpen(false)}
                data={supplementedProfile.payrollInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
            <AttendanceInfoModal
                open={attendanceModalOpen}
                onClose={() => setAttendanceModalOpen(false)}
                data={supplementedProfile.attendanceInformation}
                employeeId={employeeId}
                showMessage={showMessage}
            />
        </Box>
    );
}