import { FiChevronDown, FiChevronUp } from "react-icons/fi";

export type SortDirection = "asc" | "desc";

type SortValue = string | number | boolean | Date | null | undefined;

type SortableHeaderProps<T extends string> = {
  label: string;
  columnKey: T;
  sortKey: T;
  sortDirection: SortDirection;
  onSort: (columnKey: T) => void;
  className?: string;
};

function isEmptyValue(value: SortValue) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

function normalizeValue(value: Exclude<SortValue, null | undefined>) {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return value;
}

function compareValues(left: Exclude<SortValue, null | undefined>, right: Exclude<SortValue, null | undefined>) {
  const normalizedLeft = normalizeValue(left);
  const normalizedRight = normalizeValue(right);

  if (
    typeof normalizedLeft === "number" &&
    typeof normalizedRight === "number"
  ) {
    return normalizedLeft - normalizedRight;
  }

  return String(normalizedLeft).localeCompare(String(normalizedRight), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortRows<T>(
  rows: T[],
  getValue: (row: T) => SortValue,
  direction: SortDirection
) {
  return [...rows].sort((left, right) => {
    const leftValue = getValue(left);
    const rightValue = getValue(right);
    const leftEmpty = isEmptyValue(leftValue);
    const rightEmpty = isEmptyValue(rightValue);

    if (leftEmpty && rightEmpty) {
      return 0;
    }

    if (leftEmpty) {
      return 1;
    }

    if (rightEmpty) {
      return -1;
    }

    const result = compareValues(
      leftValue as Exclude<SortValue, null | undefined>,
      rightValue as Exclude<SortValue, null | undefined>
    );

    return direction === "asc" ? result : -result;
  });
}

export function SortableHeader<T extends string>({
  label,
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  className,
}: SortableHeaderProps<T>) {
  const isActive = sortKey === columnKey;

  return (
    <th className={className}>
      <button
        type="button"
        className={`admin-sort-trigger${isActive ? " is-active" : ""}`}
        onClick={() => onSort(columnKey)}
        aria-label={`Sort by ${label}${
          isActive ? ` (${sortDirection === "asc" ? "ascending" : "descending"})` : ""
        }`}
      >
        <span>{label}</span>
        <span className="admin-sort-indicator" aria-hidden="true">
          {isActive ?
            sortDirection === "asc" ? <FiChevronUp /> : <FiChevronDown />
          : <FiChevronDown />}
        </span>
      </button>
    </th>
  );
}