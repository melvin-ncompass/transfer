export const getAddressFromCoordinates = async (
    lat: number,
    lng: number
): Promise<string> => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );

        const data = await response.json();

        return data.display_name ?? "Unknown location";
    } catch {
        return "Location unavailable";
    }
};