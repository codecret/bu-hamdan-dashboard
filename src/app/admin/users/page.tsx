"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { usersApi } from "@/lib/admin-api";
import { toast } from "sonner";

const ACCOUNT_TYPES = ["all", "regular", "showroom", "dealer"] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accountType, setAccountType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (accountType !== "all") params.accountType = accountType;
      const res = await usersApi.list(params);
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={accountType} onValueChange={(v) => { setAccountType(v || "all"); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell className="text-sm">{u.phone}</TableCell>
                    <TableCell><Badge variant="outline">{u.accountType}</Badge></TableCell>
                    <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge></TableCell>
                    <TableCell><Switch checked={u.isActive} onCheckedChange={(v) => handleToggle(u.id, "isActive", v)} /></TableCell>
                    <TableCell><Switch checked={u.isVerified} onCheckedChange={(v) => handleToggle(u.id, "isVerified", v)} /></TableCell>
                    <TableCell className="text-xs">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} total users</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
          <span className="text-sm py-2">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
