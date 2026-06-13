import TelemetryReporter from "@vscode/extension-telemetry";

const connectionString =
    "InstrumentationKey=fd5f40ad-cdf9-4a2b-aa0b-0a4a52302287;IngestionEndpoint=https:

export let telemetry: TelemetryReporter;

export function initializeTelemetry(): void {
    telemetry = new TelemetryReporter(connectionString);
}
