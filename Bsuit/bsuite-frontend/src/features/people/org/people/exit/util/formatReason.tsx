/* Format the reason for exit */
export const formatReason = (reason: string) =>
    reason
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());