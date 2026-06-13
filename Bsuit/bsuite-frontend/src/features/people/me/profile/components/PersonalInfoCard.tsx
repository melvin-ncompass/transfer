import CardAtom from "../../../../../components/atom/card/Card";
import { Typography, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { InfoRow } from "./InfoRow";
import type { IPersonalInformation } from "../types/profile.types";
import { Country, State } from "country-state-city";
import { formatDateShort } from "../../../../../utils/numberFormatter";

/** Country as ISO code (e.g. IN) or full name — returns ISO code when possible */
function getCountryIsoCode(country: string): string | undefined {
    if (!country) return undefined;
    const byIso = Country.getCountryByCode(country);
    if (byIso) return byIso.isoCode;
    const byName = Country.getAllCountries().find((c) => c.name === country);
    return byName?.isoCode;
}

// Resolve an isoCode (e.g. "TN") or full state name to the full display name
function resolveStateName(state: string, country: string): string {
    if (!state) return "";
    const iso = getCountryIsoCode(country);
    if (!iso) return state;
    const states = State.getStatesOfCountry(iso);
    const match = states.find((s) => s.isoCode === state || s.name === state);
    return match?.name ?? state;
}

// Resolve an isoCode (e.g. "IN") or full name to the full display name
function resolveCountryName(value: string): string {
    if (!value) return "";
    const byIso = Country.getCountryByCode(value);
    if (byIso) return byIso.name;
    return value;
}

function formatMaritalStatus(value: string): string {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatMobileNumberWithCode(data: IPersonalInformation): string {
    const number = (data.phoneNumber || data.mobileNo || "").trim();
    if (!number) return "";

    const countryIso = getCountryIsoCode(data.country);
    const dialCode = countryIso ? Country.getCountryByCode(countryIso)?.phonecode : undefined;
    return dialCode ? `+${dialCode} ${number}` : number;
}

interface Props {
    data: IPersonalInformation;
    onEdit?: () => void;
}

function buildAddress(data: IPersonalInformation): string {
    const stateDisplay = resolveStateName(data.state, data.country);
    const parts = [
        data.addressLine1 || data.address,
        data.addressLine2,
        data.city && data.state ? `${data.city}, ${stateDisplay}` : data.city || stateDisplay,
        data.pincode,
        resolveCountryName(data.country), // display full name even if stored as ISO code
    ].filter(Boolean);
    return parts.join("\n") || "—";
}

export default function PersonalInfoCard({ data, onEdit }: Props) {
    return (
        <CardAtom elevation={2} sx={{ height: "100%", p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>Personal Information</Typography>
                {onEdit && <PrimaryIconButton icon={<EditIcon />} title="Edit" variant="outlined" onClick={onEdit} />}
            </Box>
                       <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 3,
                }}
            >
                <InfoRow label="Name as per PAN" value={data.nameAsPerPan || ""} />
                <InfoRow label="PAN Number" value={data.panNumber || data.pan || data.panNo || ""} />
                <InfoRow label="Name as per Aadhaar" value={data.nameAsPerAadhar || ""} />
                <InfoRow label="Aadhaar Number" value={data.aadharNumber || data.aadhar || data.aadharNo || ""} />
                <InfoRow label="Personal Email" value={data.personalEmail} />
                <InfoRow label="Mobile No." value={formatMobileNumberWithCode(data)} />
                <InfoRow label="Emergency Contact No." value={data.emergencyContact} />
                <InfoRow label="Date of Birth" value={formatDateShort(data.dateOfBirth)} />
                <InfoRow label="Blood Group" value={data.bloodGroup} />
                <InfoRow label="Marital Status" value={formatMaritalStatus(data.maritalStatus)} />
                <InfoRow label="Father Name" value={data.fatherName} />
                {/* Address spans full width since it's multiline */}
                <Box sx={{ gridColumn: "1 / -1" }}>
                    <InfoRow label="Residential Address" value={buildAddress(data)} multiline />
                </Box>
            </Box>

        </CardAtom>
    );
}
