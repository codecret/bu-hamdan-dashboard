"use client";

import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { transactionsApi } from "@/lib/admin-api";
import { toast } from "sonner";
import type { AdminTransaction } from "@/types";
import { PAGE_LIMIT } from "@/types";

export default function TransactionsPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin", "transactions", { page }],
    queryFn: () => transactionsApi.list({ page, limit: PAGE_LIMIT }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.isError) toast.error("Failed to load transactions");
  }, [query.isError]);

  const transactions = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const columns: ColumnDef<AdminTransaction>[] = [
    { accessorKey: "id", header: "ID", cell: ({ getValue }) => <span className="font-mono text-xs">{(getValue() as string).slice(0, 8)}...</span> },
    { accessorKey: "userName", header: "User", cell: ({ getValue }) => <span className="font-medium">{(getValue() as string) || "—"}</span> },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "amount", header: "Amount", cell: ({ getValue }) => <span className="font-medium">{Number(getValue()).toLocaleString()}</span> },
    { accessorKey: "currency", header: "Currency" },
    {
      accessorKey: "status", header: "Status",
      cell: ({ getValue }) => {
        const s = getValue() as string;
        return <Badge variant={s === "completed" ? "default" : s === "pending" ? "secondary" : "outline"}>{s}</Badge>;
      },
    },
    { accessorKey: "paymentMethod", header: "Method", cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span> },
    { accessorKey: "paymentRef", header: "Ref", cell: ({ getValue }) => { const r = getValue() as string | null; return <span className="font-mono text-xs max-w-[120px] truncate block" title={r || ""}>{r || "—"}</span>; } },
    { accessorKey: "createdAt", header: "Date", cell: ({ getValue }) => <span className="text-xs">{new Date(getValue() as string).toLocaleDateString()}</span> },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <DataTable columns={columns} data={transactions} loading={query.isLoading} page={page} totalPages={totalPages} total={total} onPageChange={setPage} emptyIcon={<CreditCard className="h-12 w-12" />} emptyMessage="No transactions yet" />
    </div>
  );
}
