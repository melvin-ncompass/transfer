import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useState, useRef } from "react";

type NestedKeyOf<T extends object> = {
  [K in keyof T & string]: T[K] extends object
    ? K | `${K}.${NestedKeyOf<T[K]>}`
    : K;
}[keyof T & string];

type SearchBoxAtomProps<T extends object> = {
  data: T[];
  searchKeys?: (keyof T | NestedKeyOf<T>)[];
  onFilteredData: (data: T[]) => void;
  placeholder?: string;
  size?: "small" | "medium";
};

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc, key) => {
    if (acc !== null && acc !== undefined && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function SearchBoxAtom<T extends object>({
  data,
  searchKeys,
  onFilteredData,
  placeholder = "Search...",
  size = "small",
}: SearchBoxAtomProps<T>) {
  const [query, setQuery] = useState("");
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    timeoutRef.current = window.setTimeout(() => {
      const lowerQuery = query.toLowerCase();

      const filtered =
        !query
          ? data
          : data.filter((item) =>
              (searchKeys ?? (Object.keys(item) as (keyof T)[])).some((key) => {
                const value = getNestedValue(item, key as string);
                return (
                  value !== null &&
                  value !== undefined &&
                  String(value).toLowerCase().includes(lowerQuery)
                );
              })
            );

      onFilteredData(filtered);
    }, 300); // 300ms debounce

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [query, data, searchKeys, onFilteredData]);

  return (
    <TextField
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder={placeholder}
      size={size}
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }
      }}
    />
  );
}
