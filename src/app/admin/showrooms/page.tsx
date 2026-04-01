"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { showroomsApi } from "@/lib/admin-api";
import { toast } from "sonner";

export default function ShowroomsPage() {
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    showroomsApi.list().then(setShowrooms).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id: string, isVerified: boolean) => {
    try {
      await showroomsApi.update(id, { isVerified });
      setShowrooms((prev) => prev.map((s) => (s.id === id ? { ...s, isVerified } : s)));
      toast.success(isVerified ? "Showroom verified" : "Verification removed");
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Showrooms Management</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                ))
              ) : showrooms.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No showrooms found</TableCell></TableRow>
              ) : (
                showrooms.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{s.address}</TableCell>
                    <TableCell><Switch checked={s.isVerified} onCheckedChange={(v) => handleVerify(s.id, v)} /></TableCell>
                    <TableCell className="text-xs">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
