export type PaginationItem = number | "ellipsis";

export function buildPaginationItems(
  currentPage: number,
  totalPages: number,
  maxVisiblePages = 10
): PaginationItem[] {
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [];
  const windowSize = Math.max(1, maxVisiblePages - 2);
  const halfWindow = Math.floor(windowSize / 2);

  let start = Math.max(2, currentPage - halfWindow);
  let end = start + windowSize - 1;

  if (end >= totalPages) {
    end = totalPages - 1;
    start = Math.max(2, end - windowSize + 1);
  }

  items.push(1);

  if (start > 2) {
    items.push("ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) {
    items.push("ellipsis");
  }

  items.push(totalPages);

  return items;
}
