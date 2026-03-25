"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SortOrder = "asc" | "desc" | null;

export interface SortState {
  sortBy: string | null;
  sortOrder: SortOrder;
}

interface SortableHeaderProps {
  label: string;
  field: string;
  sort: SortState;
  onSort: (state: SortState) => void;
  className?: string;
}

export function SortableHeader({
  label,
  field,
  sort,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = sort.sortBy === field;

  function handleClick() {
    if (!isActive) {
      onSort({ sortBy: field, sortOrder: "asc" });
    } else if (sort.sortOrder === "asc") {
      onSort({ sortBy: field, sortOrder: "desc" });
    } else {
      onSort({ sortBy: null, sortOrder: null });
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "-ml-3 h-8 cursor-pointer font-medium text-muted-foreground hover:text-foreground",
        isActive && "text-foreground",
        className,
      )}
    >
      {label}
      {isActive && sort.sortOrder === "asc" ? (
        <ArrowUp className="ml-1 h-3.5 w-3.5" />
      ) : isActive && sort.sortOrder === "desc" ? (
        <ArrowDown className="ml-1 h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
      )}
    </Button>
  );
}
