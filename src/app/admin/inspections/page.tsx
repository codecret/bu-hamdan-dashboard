"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardCheck, Eye, Calendar, Phone, Mail, Car } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { inspectionsApi, type AdminInspection } from "@/lib/admin-api";
import { toast } from "sonner";
import { PAGE_LIMIT } from "@/types";

const STATUSES: AdminInspection["status"][] = [
  "pending",
  "scheduled",
  "completed",
  "cancelled",
];

const STATUS_STYLES: Record<AdminInspection["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-700",
};

const TIME_LABELS: Record<string, string> = {
  morning: "صباحًا",
  afternoon: "ظهرًا",
  evening: "مساءً",
};

export default function InspectionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<AdminInspection | null>(null);

  const listQuery = useQuery({
    queryKey: ["admin", "inspections", { page, statusFilter }],
    queryFn: () =>
      inspectionsApi.list({
        page,
        limit: PAGE_LIMIT,
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (listQuery.isError) toast.error("Failed to load inspection requests");
  }, [listQuery.isError]);

  const updateStatus = useMutation({
    mutationFn: (vars: { id: string; status: AdminInspection["status"] }) =>
      inspectionsApi.updateStatus(vars.id, vars.status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["admin", "inspections"] });
      const snapshots = qc.getQueriesData<{ data: AdminInspection[] }>({
        queryKey: ["admin", "inspections"],
      });
      qc.setQueriesData<{ data: AdminInspection[]; total: number; page: number; limit: number; totalPages: number } | undefined>(
        { queryKey: ["admin", "inspections"] },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            data: prev.data.map((row) =>
              row.id === id ? { ...row, status } : row,
            ),
          };
        },
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, value]) => qc.setQueryData(key, value));
      toast.error("Update failed");
    },
    onSuccess: (_data, vars) => {
      toast.success(`Marked as ${vars.status}`);
      // Keep the dialog in sync if the user is viewing the same row
      if (view && view.id === vars.id) setView({ ...view, status: vars.status });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "inspections"] });
    },
  });

  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = listQuery.data?.totalPages ?? 1;

  const carLabel = (r: AdminInspection) =>
    [r.makeNameEn, r.modelNameEn, r.listingYear].filter(Boolean).join(" ") ||
    "—";

  const columns: ColumnDef<AdminInspection>[] = [
    {
      accessorKey: "userName",
      header: "Requester",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.userName ?? "—"}</span>
          <span className="text-xs text-muted-foreground font-mono tabular-nums" dir="ltr">
            {row.original.userPhone ?? ""}
          </span>
        </div>
      ),
    },
    {
      id: "car",
      header: "Car",
      accessorFn: (r) => carLabel(r),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{carLabel(row.original)}</span>
          {row.original.makeNameAr && (
            <span className="text-xs text-muted-foreground">
              {row.original.makeNameAr} {row.original.modelNameAr ?? ""}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "preferredDate",
      header: "Preferred",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span>{row.original.preferredDate ?? "—"}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.preferredTime
              ? TIME_LABELS[row.original.preferredTime] ?? row.original.preferredTime
              : ""}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[row.original.status]}`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ getValue }) => (
        <span className="text-xs">
          {new Date(getValue() as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label="View inspection details"
            onClick={() => setView(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Inspection Requests</h1>

      <div className="flex gap-4 flex-wrap items-center">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || "all"); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={listQuery.isLoading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onRowClick={(row) => setView(row)}
        emptyIcon={<ClipboardCheck className="h-12 w-12" />}
        emptyMessage="No inspection requests yet"
      />

      <Dialog open={!!view} onOpenChange={(open) => !open && setView(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {view && (
            <>
              <DialogHeader>
                <DialogTitle>Inspection Request</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">Car</div>
                    <div className="font-medium">{carLabel(view)}</div>
                    {view.listingPrice && (
                      <div className="text-xs text-muted-foreground">
                        {Number(view.listingPrice).toLocaleString()} KWD
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">Preferred</div>
                    <div className="font-medium">
                      {view.preferredDate ?? "—"}{" "}
                      {view.preferredTime ? `· ${TIME_LABELS[view.preferredTime] ?? view.preferredTime}` : ""}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3 grid grid-cols-1 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Requester</div>
                    <div className="font-medium">{view.userName ?? "—"}</div>
                  </div>
                  {view.userPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <a
                        href={`tel:${view.userPhone}`}
                        dir="ltr"
                        className="font-mono tabular-nums text-blue-700 hover:underline"
                      >
                        {view.userPhone}
                      </a>
                    </div>
                  )}
                  {view.userEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <a
                        href={`mailto:${view.userEmail}`}
                        dir="ltr"
                        className="text-blue-700 hover:underline break-all"
                      >
                        {view.userEmail}
                      </a>
                    </div>
                  )}
                </div>

                {view.notes && (
                  <div className="border-t pt-3">
                    <div className="text-xs text-muted-foreground mb-1">Notes</div>
                    <p className="whitespace-pre-wrap">{view.notes}</p>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="text-xs text-muted-foreground mb-2">Update status</div>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={view.status === s ? "default" : "outline"}
                        onClick={() => updateStatus.mutate({ id: view.id, status: s })}
                        disabled={updateStatus.isPending || view.status === s}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground border-t pt-3">
                  Submitted {new Date(view.createdAt).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

