"use client";

import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, User as UserIcon, Car, MapPin, Heart } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { usersApi } from "@/lib/admin-api";
import { toast } from "sonner";
import type { User, Listing } from "@/types";
import { PAGE_LIMIT } from "@/types";

const ACCOUNT_TYPES = ["all", "regular", "showroom", "dealer"] as const;

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accountType, setAccountType] = useState<string>("all");
  const [viewId, setViewId] = useState<string | null>(null);

  // Debounce search input to avoid hammering the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── List query ──────────────────────────────────────────────
  const listQuery = useQuery({
    queryKey: ["admin", "users", { page, search: debouncedSearch, accountType }],
    queryFn: () => {
      const params: Record<string, string | number> = { page, limit: PAGE_LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      if (accountType !== "all") params.accountType = accountType;
      console.log(params)
      return usersApi.list(params);
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (listQuery.isError) toast.error("Failed to load users");
  }, [listQuery.isError]);

  const users = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = listQuery.data?.totalPages ?? 1;

  // ── Detail query (enabled only when a row is selected) ──────
  const detailQuery = useQuery({
    queryKey: ["admin", "user", viewId],
    queryFn: () => usersApi.get(viewId as string),
    enabled: !!viewId,
  });

  useEffect(() => {
    if (detailQuery.isError) toast.error("Failed to load user details");
  }, [detailQuery.isError]);

  const viewDialog = detailQuery.data ?? null;
  const viewLoading = !!viewId && detailQuery.isLoading;

  const closeDialog = () => setViewId(null);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.avatarUrl ? (
            <img src={row.original.avatarUrl} alt={row.original.name} className="w-8 h-8 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    { accessorKey: "email", header: "Email", cell: ({ getValue }) => <span className="text-sm" dir="ltr">{getValue() as string}</span> },
    { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => <span className="text-sm font-mono tabular-nums" dir="ltr">{getValue() as string}</span> },
    { accessorKey: "accountType", header: "Type", cell: ({ getValue }) => <Badge variant="outline">{getValue() as string}</Badge> },
    { accessorKey: "role", header: "Role", cell: ({ getValue }) => <Badge variant={(getValue() as string) === "admin" ? "default" : "secondary"}>{getValue() as string}</Badge> },
    { accessorKey: "createdAt", header: "Joined", cell: ({ getValue }) => <span className="text-xs">{new Date(getValue() as string).toLocaleDateString()}</span> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`View ${row.original.name} details`} onClick={() => setViewId(row.original.id)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone..." className="pl-9" maxLength={100} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={accountType} onValueChange={(v) => { setAccountType(v || "all"); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={listQuery.isLoading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onRowClick={(row) => setViewId(row.id)}
        emptyMessage="No users found"
      />

      <Dialog open={!!viewId} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {viewLoading ? (
            <div className="space-y-4 py-8">
              <div className="flex items-center gap-3"><Skeleton className="w-16 h-16 rounded-full" /><div className="space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-48" /></div></div>
              <Skeleton className="h-20 w-full" />
            </div>
          ) : viewDialog && (
            <>
              <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
              <div className="flex items-center gap-4">
                {viewDialog.avatarUrl ? (
                  <img src={viewDialog.avatarUrl} alt={viewDialog.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><UserIcon className="h-8 w-8 text-muted-foreground" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold break-words">{viewDialog.name}</h3>
                  <p className="text-sm text-muted-foreground break-all" dir="ltr">{viewDialog.email}</p>
                  <p className="text-sm text-muted-foreground font-mono tabular-nums" dir="ltr">{viewDialog.phone}</p>
                </div>
              </div>
              {viewDialog.profile && (
                <div className="space-y-3 border-t pt-3">
                  {viewDialog.profile.bio && <div><h4 className="text-xs text-muted-foreground">Bio</h4><p className="text-sm">{viewDialog.profile.bio}</p></div>}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {(viewDialog.profile.governorate || viewDialog.profile.city) && (
                      <div className="flex items-start gap-1.5"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-xs text-muted-foreground">Location</div><div className="font-medium">{[viewDialog.profile.governorate, viewDialog.profile.city].filter(Boolean).join(", ")}</div></div></div>
                    )}
                    {viewDialog.profile.whatsappNumber && <div><div className="text-xs text-muted-foreground">WhatsApp</div><div className="font-medium">{viewDialog.profile.whatsappNumber}</div></div>}
                    <div className="flex items-start gap-1.5"><Car className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-xs text-muted-foreground">Listings</div><div className="font-medium">{viewDialog.profile.listingsCount}</div></div></div>
                    {(viewDialog.profile.favoriteMake || viewDialog.profile.favoriteCar) && (
                      <div className="flex items-start gap-1.5 col-span-2">
                        <Heart className="h-4 w-4 text-red-500 mt-0.5" />
                        <div>
                          <div className="text-xs text-muted-foreground">Favorite Car</div>
                          <div className="font-medium">
                            {[
                              viewDialog.profile.favoriteMake?.name,
                              viewDialog.profile.favoriteModel?.name,
                              viewDialog.profile.favoriteTrim,
                            ]
                              .filter(Boolean)
                              .join(" ") || viewDialog.profile.favoriteCar}
                          </div>
                          {(viewDialog.profile.favoriteMake?.nameEn ||
                            viewDialog.profile.favoriteModel?.nameEn) && (
                            <div className="text-xs text-muted-foreground">
                              {[
                                viewDialog.profile.favoriteMake?.nameEn,
                                viewDialog.profile.favoriteModel?.nameEn,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {viewDialog.listings?.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Listings ({viewDialog.listings.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {viewDialog.listings.map((l: Listing) => (
                      <div key={l.id} className="flex items-center justify-between text-sm bg-muted/50 rounded p-2">
                        <div><span className="font-medium">{l.year} · {l.color}</span><span className="text-muted-foreground ml-2">{Number(l.price).toLocaleString()} KWD</span></div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.status === "active" ? "bg-green-100 text-green-800" : l.status === "pending" ? "bg-amber-100 text-amber-800" : l.status === "rejected" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground border-t pt-3">Joined {new Date(viewDialog.createdAt).toLocaleDateString()}</div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
