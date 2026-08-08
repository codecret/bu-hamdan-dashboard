"use client";

import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  skeletonRows?: number;
  /** Server-side pagination */
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  /**
   * Client-side pagination — rows per page for tables that already hold the
   * full dataset (the catalog, for instance, fetches every make at once so it
   * can search across all of them). Ignored when the server-side `page` /
   * `totalPages` / `onPageChange` trio is supplied.
   *
   * Pass a memoised `data` array: react-table resets to page 1 whenever the
   * reference changes, so a fresh `.filter()` on every render would pin the
   * table to the first page.
   */
  pageSize?: number;
  pageSizeOptions?: number[];
  /** Row click handler */
  onRowClick?: (row: TData) => void;
  /** Empty state */
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  skeletonRows = 5,
  page,
  totalPages,
  total,
  onPageChange,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  emptyIcon,
  emptyMessage = "No results found",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize ?? 25,
  });

  const hasPagination = page != null && totalPages != null && onPageChange;
  const clientPaginated = !hasPagination && pageSize != null;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Server-paginated tables get their page from props and never build a
    // pagination row model, so none of this is wired up for them.
    ...(clientPaginated && {
      getPaginationRowModel: getPaginationRowModel(),
      onPaginationChange: setPagination,
    }),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters, ...(clientPaginated && { pagination }) },
  });

  const rowCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const firstRow = rowCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastRow = Math.min(rowCount, (pagination.pageIndex + 1) * pagination.pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={`Sort by ${typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : header.column.id}`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ArrowUp className="size-3.5" />,
                          desc: <ArrowDown className="size-3.5" />,
                        }[header.column.getIsSorted() as string] ?? (
                          <ArrowUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {emptyIcon}
                    <p>{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {hasPagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total != null ? `${total.toLocaleString()} total` : `Page ${page} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {clientPaginated && !loading && rowCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground tabular-nums">
              Showing {firstRow.toLocaleString()}–{lastRow.toLocaleString()} of{" "}
              {rowCount.toLocaleString()}
            </p>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger size="sm" className="w-27.5" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="First page"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm tabular-nums">
              {pagination.pageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Last page"
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(pageCount - 1)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Helper to create a sortable column header label */
export function SortableHeader({ label }: { label: string }) {
  return <span>{label}</span>;
}
