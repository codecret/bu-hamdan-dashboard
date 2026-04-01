"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, User as UserIcon, Car, MapPin, Star } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { usersApi } from "@/lib/admin-api";
import { toast } from "sonner";
import type { User, UserDetail, Listing } from "@/types";
import { PAGE_LIMIT } from "@/types";

const ACCOUNT_TYPES = ["all", "regular", "showroom", "dealer"] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accountType, setAccountType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewDialog, setViewDialog] = useState<UserDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      if (accountType !== "all") params.accountType = accountType;
      const res = await usersApi.list(params);
      if (controller.signal.aborted) return;
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      toast.error("Failed to load users");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, debouncedSearch, accountType]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (id: string, field: "isActive" | "isVerified", value: boolean) => {
    try {
      await usersApi.update(id, { [field]: value });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
      toast.success(`User ${field === "isActive" ? (value ? "activated" : "deactivated") : (value ? "verified" : "unverified")}`);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleViewUser = async (id: string) => {
    setViewLoading(true);
    setViewDialog(null);
    try {
      const data = await usersApi.get(id);
      setViewDialog(data);
    } catch {
      toast.error("Failed to load user details");
    } finally {
      setViewLoading(false);
    }
  };

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
    { accessorKey: "email", header: "Email", cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span> },
    { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span> },
    { accessorKey: "accountType", header: "Type", cell: ({ getValue }) => <Badge variant="outline">{getValue() as string}</Badge> },
    { accessorKey: "role", header: "Role", cell: ({ getValue }) => <Badge variant={(getValue() as string) === "admin" ? "default" : "secondary"}>{getValue() as string}</Badge> },
    {
      accessorKey: "isActive", header: "Active", enableSorting: false,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch checked={row.original.isActive} onCheckedChange={(v) => handleToggle(row.original.id, "isActive", v)} aria-label={`Toggle active for ${row.original.name}`} />
        </div>
      ),
    },
    {
      accessorKey: "isVerified", header: "Verified", enableSorting: false,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch checked={row.original.isVerified} onCheckedChange={(v) => handleToggle(row.original.id, "isVerified", v)} aria-label={`Toggle verified for ${row.original.name}`} />
        </div>
      ),
    },
    { accessorKey: "createdAt", header: "Joined", cell: ({ getValue }) => <span className="text-xs">{new Date(getValue() as string).toLocaleDateString()}</span> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`View ${row.original.name} details`} onClick={() => handleViewUser(row.original.id)}>
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

      <DataTable columns={columns} data={users} loading={loading} page={page} totalPages={totalPages} total={total} onPageChange={setPage} onRowClick={(row) => handleViewUser(row.id)} emptyMessage="No users found" />

      <Dialog open={!!viewDialog || viewLoading} onOpenChange={() => setViewDialog(null)}>
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
                <div>
                  <h3 className="text-lg font-semibold">{viewDialog.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewDialog.email}</p>
                  <p className="text-sm text-muted-foreground">{viewDialog.phone}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{viewDialog.accountType}</Badge>
                <Badge variant={viewDialog.role === "admin" ? "default" : "secondary"}>{viewDialog.role}</Badge>
                {viewDialog.isVerified && <Badge className="bg-blue-100 text-blue-800">Verified</Badge>}
                <Badge className={viewDialog.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{viewDialog.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              {viewDialog.profile && (
                <div className="space-y-3 border-t pt-3">
                  {viewDialog.profile.bio && <div><h4 className="text-xs text-muted-foreground">Bio</h4><p className="text-sm">{viewDialog.profile.bio}</p></div>}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {(viewDialog.profile.governorate || viewDialog.profile.city) && (
                      <div className="flex items-start gap-1.5"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-xs text-muted-foreground">Location</div><div className="font-medium">{[viewDialog.profile.governorate, viewDialog.profile.city].filter(Boolean).join(", ")}</div></div></div>
                    )}
                    {viewDialog.profile.whatsappNumber && <div><div className="text-xs text-muted-foreground">WhatsApp</div><div className="font-medium">{viewDialog.profile.whatsappNumber}</div></div>}
                    <div className="flex items-start gap-1.5"><Star className="h-4 w-4 text-yellow-500 mt-0.5" /><div><div className="text-xs text-muted-foreground">Rating</div><div className="font-medium">{viewDialog.profile.rating} ({viewDialog.profile.reviewsCount} reviews)</div></div></div>
                    <div className="flex items-start gap-1.5"><Car className="h-4 w-4 text-muted-foreground mt-0.5" /><div><div className="text-xs text-muted-foreground">Listings</div><div className="font-medium">{viewDialog.profile.listingsCount}</div></div></div>
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
