export function capitalizeFirst(value: string): string {
  return value
    ? value[0].toLocaleUpperCase() + value.slice(1)
    : value;
}
