/** Best-effort public IP for attendance clock-in/out payloads. */
export async function getClientIpAddress(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) return "";
    const data = (await response.json()) as { ip?: string };
    return data.ip?.trim() ?? "";
  } catch {
    return "";
  }
}
