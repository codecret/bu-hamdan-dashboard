"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { transactionsApi } from "@/lib/admin-api";
import { toast } from "sonner";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transactionsApi.list({ page, limit: 20 });
      setTransactions(res.data);
      setTotal(res.total);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-12 w-12" />
                      <p>No transactions yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id.slice(0, 8)}...</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell className="font-medium">{Number(t.amount).toLocaleString()}</TableCell>
                    <TableCell>{t.currency}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "completed" ? "default" : t.status === "pending" ? "secondary" : "outline"}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.paymentMethod || "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{total} total transactions</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
            <span className="text-sm py-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
