"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Building2, Globe, Phone, MapPin } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { showroomsApi } from "@/lib/admin-api";
import { toast } from "sonner";
import type { AdminShowroom } from "@/types";

export default function ShowroomsPage() {
  const qc = useQueryClient();
  const [viewDialog, setViewDialog] = useState<AdminShowroom | null>(null);

  const listQuery = useQuery({
    queryKey: ["admin", "showrooms"],
    queryFn: showroomsApi.list,
  });

  useEffect(() => {
    if (listQuery.isError) toast.error("Failed to load showrooms");
  }, [listQuery.isError]);

  const showrooms = listQuery.data ?? [];

  const verifyMutation = useMutation({
    mutationFn: (vars: { id: string; isVerified: boolean }) =>
      showroomsApi.update(vars.id, { isVerified: vars.isVerified }),
    onMutate: async ({ id, isVerified }) => {
      // Optimistic update — flip the toggle instantly, roll back on error
      await qc.cancelQueries({ queryKey: ["admin", "showrooms"] });
      const previous = qc.getQueryData<AdminShowroom[]>(["admin", "showrooms"]);
      qc.setQueryData<AdminShowroom[]>(["admin", "showrooms"], (old) =>
        old?.map((s) => (s.id === id ? { ...s, isVerified } : s)) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["admin", "showrooms"], ctx.previous);
      toast.error("Update failed");
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.isVerified ? "Showroom verified" : "Verification removed");
    },
  });

  const columns: ColumnDef<AdminShowroom>[] = [
    {
      accessorKey: "logoUrl", header: "Logo", enableSorting: false,
      cell: ({ row }) => row.original.logoUrl ? (
        <img src={row.original.logoUrl} alt={`${row.original.name} logo`} className="w-10 h-10 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      ) : (
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Building2 className="h-5 w-5 text-muted-foreground" /></div>
      ),
    },
    {
      accessorKey: "name", header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.nameEn && <div className="text-xs text-muted-foreground">{row.original.nameEn}</div>}
        </div>
      ),
    },
    { accessorKey: "ownerName", header: "Owner", cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || "—"}</span> },
    { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => <span className="font-mono tabular-nums" dir="ltr">{getValue() as string}</span> },
    { accessorKey: "address", header: "Address", cell: ({ getValue }) => <span className="max-w-[200px] truncate block">{getValue() as string}</span> },
    {
      accessorKey: "isVerified", header: "Verified", enableSorting: false,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={row.original.isVerified}
            onCheckedChange={(v) => verifyMutation.mutate({ id: row.original.id, isVerified: v })}
            aria-label={`Toggle verified for ${row.original.name}`}
          />
        </div>
      ),
    },
    { accessorKey: "createdAt", header: "Created", cell: ({ getValue }) => <span className="text-xs">{new Date(getValue() as string).toLocaleDateString()}</span> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`View ${row.original.name} details`} onClick={() => setViewDialog(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Showrooms Management</h1>

      <DataTable columns={columns} data={showrooms} loading={listQuery.isLoading} onRowClick={(row) => setViewDialog(row)} emptyMessage="No showrooms found" />

      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          {viewDialog && (
            <>
              <DialogHeader><DialogTitle>Showroom Details</DialogTitle></DialogHeader>
              <div className="flex items-center gap-4">
                {viewDialog.logoUrl ? (
                  <img src={viewDialog.logoUrl} alt={`${viewDialog.name} logo`} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center"><Building2 className="h-8 w-8 text-muted-foreground" /></div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{viewDialog.name}</h3>
                  {viewDialog.nameEn && <p className="text-sm text-muted-foreground">{viewDialog.nameEn}</p>}
                  <div className="flex gap-2 mt-1">
                    {viewDialog.isVerified ? <Badge className="bg-green-100 text-green-800">Verified</Badge> : <Badge variant="outline">Not Verified</Badge>}
                  </div>
                </div>
              </div>
              {viewDialog.coverUrl && <div className="rounded-lg overflow-hidden"><img src={viewDialog.coverUrl} alt={`${viewDialog.name} cover`} className="w-full h-32 object-cover" /></div>}
              {viewDialog.description && <div><h4 className="text-xs text-muted-foreground mb-1">Description</h4><p className="text-sm">{viewDialog.description}</p></div>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-1.5"><Phone className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-xs text-muted-foreground">Phone</div><div className="font-medium font-mono tabular-nums" dir="ltr">{viewDialog.phone}</div></div></div>
                {viewDialog.whatsappBusiness && <div><div className="text-xs text-muted-foreground">WhatsApp Business</div><div className="font-medium font-mono tabular-nums" dir="ltr">{viewDialog.whatsappBusiness}</div></div>}
                {viewDialog.website && <div className="flex items-start gap-1.5"><Globe className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-xs text-muted-foreground">Website</div><div className="font-medium truncate max-w-[180px]">{viewDialog.website}</div></div></div>}
                <div className="flex items-start gap-1.5"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-xs text-muted-foreground">Address</div><div className="font-medium">{viewDialog.address}</div></div></div>
              </div>
              <div className="border-t pt-3 text-sm">
                <div className="text-xs text-muted-foreground mb-1">Owner</div>
                <div className="font-medium">{viewDialog.ownerName || "—"}</div>
                {viewDialog.ownerEmail && <div className="text-xs text-muted-foreground" dir="ltr">{viewDialog.ownerEmail}</div>}
              </div>
              <div className="text-xs text-muted-foreground border-t pt-3">Created {new Date(viewDialog.createdAt).toLocaleDateString()}</div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
