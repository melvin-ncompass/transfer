export function sortByStatus<T extends { status: string }>(
  items: T[],
  statusOrder: string[],
): T[] {
  return items.sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
  );
}
