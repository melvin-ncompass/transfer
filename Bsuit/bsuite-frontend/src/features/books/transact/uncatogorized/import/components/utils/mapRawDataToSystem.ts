export function mapRawDataToSystem(
  rawData: Record<string, string>[],
  mapping: Record<string, string>
) {
  return rawData.map(row => {
    const obj: Record<string, string> = {};

    Object.keys(mapping).forEach(systemKey => {
      const csvKey = mapping[systemKey];
      obj[systemKey] = row[csvKey] ?? "";
    });

    return obj;
  });
}
