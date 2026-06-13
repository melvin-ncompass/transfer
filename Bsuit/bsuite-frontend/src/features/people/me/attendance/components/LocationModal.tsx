import { useEffect, useRef, useState } from "react";
import { Stack, Box } from "@mui/system";
import { Typography, Chip, Alert } from "@mui/material";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { getAddressFromCoordinates } from "../api/location.api";
import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WifiIcon from "@mui/icons-material/Wifi";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import GpsOffIcon from "@mui/icons-material/GpsOff";
import type { AttendanceLocationInfo } from "../api/attendance.api";

type LocationModalProps = {
    open: boolean;
    onClose: () => void;
    clockInLocationInfo?: AttendanceLocationInfo | null;
    clockOutLocationInfo?: AttendanceLocationInfo | null;
};

/** Returns true if two coords are within ~10 metres of each other */
const areCoordsOverlapping = (
    a?: { lat: number; lng: number } | null,
    b?: { lat: number; lng: number } | null,
    thresholdDeg = 0.0001   // ≈ 11 m
): boolean => {
    if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return false;
    return (
        Math.abs(a.lat - b.lat) < thresholdDeg &&
        Math.abs(a.lng - b.lng) < thresholdDeg
    );
};

const AddressRow = ({
    label,
    address,
    ip,
    loading,
    color,
    missing,
}: {
    label: string;
    address: string;
    ip?: string | null;
    loading: boolean;
    color: string;
    missing?: boolean;
}) => (
    <Stack direction="row" alignItems="flex-start" gap={1}>
        <LocationOnIcon
            fontSize="small"
            sx={{ color: missing ? "text.disabled" : color, mt: 0.3, flexShrink: 0 }}
        />
        <Stack spacing={0.75} flex={1}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
                {label}
            </Typography>
            {loading ? (
                <CustomCircularProgress size={16} />
            ) : missing ? (
                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                    No location recorded
                </Typography>
            ) : (
                <Typography variant="body2">{address}</Typography>
            )}
            {ip ? (
                <Chip
                    icon={<WifiIcon fontSize="small" />}
                    label={`IP: ${ip}`}
                    size="small"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start", fontFamily: "monospace", fontSize: 11 }}
                />
            ) : null}
        </Stack>
    </Stack>
);

const LeafletMap = ({
    clockIn,
    clockOut,
    clockInAddress,
    clockOutAddress,
    overlapping,
}: {
    clockIn?: { lat: number; lng: number } | null;
    clockOut?: { lat: number; lng: number } | null;
    clockInAddress: string;
    clockOutAddress: string;
    overlapping: boolean;
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const hasIn = !!(clockIn?.lat && clockIn?.lng);
        const hasOut = !!(clockOut?.lat && clockOut?.lng) && !overlapping;
        if (!hasIn && !hasOut) return;

        import("leaflet").then((L) => {
            if (mapInstanceRef.current) {
                (mapInstanceRef.current as L.Map).remove();
                mapInstanceRef.current = null;
            }

            delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const points: [number, number][] = [];
            if (hasIn) points.push([clockIn!.lat, clockIn!.lng]);
            if (hasOut) points.push([clockOut!.lat, clockOut!.lng]);

            const map = L.map(mapRef.current!);
            mapInstanceRef.current = map;

            if (points.length === 1) {
                // Single pin — center and zoom out a bit more than default
                map.setView(points[0], 18);
            } else {
                // Two pins — fit bounds with generous padding
                map.fitBounds(L.latLngBounds(points).pad(0.4));
            }

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            const makePinHtml = (color: string, label: string) => `
                <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
                    <div style="
                        background:${color};color:#fff;
                        font-size:11px;font-weight:600;font-family:sans-serif;
                        padding:3px 7px;border-radius:4px;
                        white-space:nowrap;max-width:180px;overflow:hidden;
                        text-overflow:ellipsis;box-shadow:0 1px 4px rgba(0,0,0,.3);
                    " title="${label}">${label}</div>
                    <svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${color}"/>
                        <circle cx="12" cy="12" r="5" fill="#fff"/>
                    </svg>
                </div>`;

            // Blue pin — Clock In (always shown if available)
            if (hasIn) {
                const label = overlapping
                    ? `${clockInAddress || "Clock In"} (Clock In & Out)`
                    : clockInAddress || "Clock In";

                L.marker([clockIn!.lat, clockIn!.lng], {
                    title: "",
                    icon: L.divIcon({
                        className: "",
                        html: makePinHtml("#1565c0", label),
                        iconAnchor: [12, 58],
                        popupAnchor: [0, -60],
                    }),
                })
                    .addTo(map)
                    .bindTooltip(
                        overlapping
                            ? `<b>Clock In & Out</b><br/>${clockInAddress}`
                            : `<b>Clock In</b><br/>${clockInAddress}`,
                        {
                            direction: 'auto',
                            offset: [0, -60],
                        }
                    );
            }

            // Red pin — Clock Out (only shown when not overlapping)
            if (hasOut) {
                L.marker([clockOut!.lat, clockOut!.lng], {
                    title: "",
                    icon: L.divIcon({
                        className: "",
                        html: makePinHtml("#b71c1c", clockOutAddress || "Clock Out"),
                        iconAnchor: [12, 58],
                        popupAnchor: [0, 0],
                    }),
                })
                    .addTo(map)
                    .bindTooltip(`<b>Clock Out</b><br/>${clockOutAddress}`,{
                        direction: 'auto',
                        offset: [0, 0],
                    });
            }
        });

        return () => {
            if (mapInstanceRef.current) {
                (mapInstanceRef.current as { remove: () => void }).remove();
                mapInstanceRef.current = null;
            }
        };
    }, [clockIn, clockOut, clockInAddress, clockOutAddress, overlapping]);

    return (
        <>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <style>{`
                .location-tooltip {
                    background: #ffffff !important;
                    opacity: 1 !important;
                }
                .leaflet-tooltip {
                    background: #ffffff !important;
                    white-space: normal;
                    opacity: 1 !important;
                }
            `}</style>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        </>
    );
};

export const LocationModal = ({
    open,
    onClose,
    clockInLocationInfo,
    clockOutLocationInfo,
}: LocationModalProps) => {
    const [loading, setLoading] = useState(false);
    const [clockInAddress, setClockInAddress] = useState("");
    const [clockOutAddress, setClockOutAddress] = useState("");

    const overlapping = areCoordsOverlapping(clockInLocationInfo, clockOutLocationInfo);

    useEffect(() => {
        if (!open) return;

        const loadAddresses = async () => {
            setLoading(true);
            try {
                const [inAddress, outAddress] = await Promise.all([
                    clockInLocationInfo?.lat && clockInLocationInfo?.lng
                        ? getAddressFromCoordinates(clockInLocationInfo.lat, clockInLocationInfo.lng)
                        : Promise.resolve("No clock in location"),

                    clockOutLocationInfo?.lat && clockOutLocationInfo?.lng
                        ? getAddressFromCoordinates(clockOutLocationInfo.lat, clockOutLocationInfo.lng)
                        : Promise.resolve("No clock out location"),
                ]);

                setClockInAddress(inAddress);
                setClockOutAddress(outAddress);
            } finally {
                setLoading(false);
            }
        };

        void loadAddresses();
    }, [open, clockInLocationInfo, clockOutLocationInfo]);

    const hasAnyLocation =
        (clockInLocationInfo?.lat && clockInLocationInfo?.lng) ||
        (clockOutLocationInfo?.lat && clockOutLocationInfo?.lng);

    return (
        <ModalElement
            maxWidth="md"
            open={open}
            height={800}
            title="Location"
            onClose={onClose}
            sx={{
                "& .MuiDialog-paper": {
                    width: { xs: "90vw", sm: 500, md: 800 },
                    margin: 2,
                },
            }}
        >
            <Stack spacing={2} p={2}>
                {/* IP + Addresses */}
                <Stack p={2} border={1} borderColor="divider" borderRadius={2} spacing={1.5}>
                    <AddressRow
                        label="Clock In"
                        address={clockInAddress}
                        ip={clockInLocationInfo?.ip}
                        loading={loading}
                        color="#1565c0"
                        missing={!clockInLocationInfo?.lat || !clockInLocationInfo?.lng}
                    />

                    <AddressRow
                        label="Clock Out"
                        address={clockOutAddress}
                        ip={clockOutLocationInfo?.ip}
                        loading={loading}
                        color="#b71c1c"
                        missing={!clockOutLocationInfo?.lat || !clockOutLocationInfo?.lng}
                    />
                </Stack>

                {/* Overlap notice */}
                {overlapping && (
                    <Alert
                        severity="info"
                        icon={<InfoOutlinedIcon fontSize="small" />}
                        sx={{ py: 0.5 }}
                    >
                        Clock in and clock out locations are the same — map shows a single pin.
                    </Alert>
                )}

                {/* Leaflet map */}
                <Box
                    sx={{
                        width: "100%",
                        height: 420,
                        borderRadius: 2,
                        overflow: "hidden",
                        border: 1,
                        borderColor: "divider",
                    }}
                >
                    {hasAnyLocation ? (
                        <LeafletMap
                            clockIn={clockInLocationInfo}
                            clockOut={clockOutLocationInfo}
                            clockInAddress={clockInAddress}
                            clockOutAddress={clockOutAddress}
                            overlapping={overlapping}
                        />
                    ) : (
                        <Box
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1.5,
                                bgcolor: "grey.50",
                                px: 4,
                                textAlign: "center",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: "50%",
                                    bgcolor: "grey.100",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <GpsOffIcon sx={{ fontSize: 28, color: "text.disabled" }} />
                            </Box>
                            <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                No location data available
                            </Typography>
                            <Typography variant="body2" color="text.secondary" maxWidth={'80%'}>
                                Location could not be retrieved. This may be because the user denied
                                location permission, location services are disabled on their device,
                                or no coordinates were recorded at the time of clocking in or out.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Stack>
        </ModalElement>
    );
};