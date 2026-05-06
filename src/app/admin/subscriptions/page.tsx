"use client";

import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Sparkles, AlertCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { subscriptionsApi } from "@/lib/admin-api";
import { toast } from "sonner";
import type { AdminSubscription, PlanTier, SubscriptionStatus } from "@/types";
import { PAGE_LIMIT } from "@/types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "active_valid", label: "Active (live)" },
  { value: "all", label: "All states" },
  { value: "active", label: "Active (any)" },
  { value: "trial", label: "Trial" },
  { value: "past_due", label: "Past due" },
  { value: "canceled", label: "Canceled" },
  { value: "expired", label: "Expired" },
];

const TIER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All plans" },
  { value: "regular_single", label: "Single Listing" },
  { value: "showroom_monthly", label: "Showroom" },
  { value: "dealer_monthly", label: "Dealer" },
];

const STATUS_VARIANT: Record<SubscriptionStatus, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  trial: "secondary",
  past_due: "destructive",
  canceled: "outline",
  expired: "outline",
};

const TIER_LABEL: Record<PlanTier, string> = {
  regular_single: "Single",
  showroom_monthly: "Showroom",
  dealer_monthly: "Dealer",
};

function daysBetween(end: string): number {
  const ms = new Date(end).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("active_valid");
  const [tier, setTier] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ["admin", "subscriptions", { page, status, tier, search: debouncedSearch }],
    queryFn: () => {
      const params: Record<string, string | number> = { page, limit: PAGE_LIMIT };
      if (status && status !== "all") params.status = status;
      if (tier && tier !== "all") params.tier = tier;
      if (debouncedSearch) params.search = debouncedSearch;
      return subscriptionsApi.list(params);
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.isError) toast.error("Failed to load subscriptions");
  }, [query.isError]);

  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = query.data?.totalPages ?? 1;

  const columns: ColumnDef<AdminSubscription>[] = [
    {
      accessorKey: "userName",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.userName ?? "—"}</span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {row.original.userEmail ?? row.original.userPhone ?? ""}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "tier",
      header: "Plan",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Badge variant="outline" className="w-fit">
            {TIER_LABEL[row.original.tier] ?? row.original.tier}
          </Badge>
          <span className="text-xs text-muted-foreground mt-0.5">
            {Number(row.original.planPriceKwd).toFixed(3)} KWD · {row.original.listingQuota} listings
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const live = s === "active" && new Date(row.original.currentPeriodEnd) > new Date();
        return (
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[s] ?? "outline"}>
              {live ? "active" : s}
            </Badge>
            {row.original.cancelAtPeriodEnd && (
              <span className="text-[10px] uppercase tracking-wide text-amber-600">cancels</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "currentPeriodEnd",
      header: "Renews / Ends",
      cell: ({ row }) => {
        const days = daysBetween(row.original.currentPeriodEnd);
        const overdue = days < 0;
        return (
          <div className="flex flex-col">
            <span className="text-sm">{new Date(row.original.currentPeriodEnd).toLocaleDateString()}</span>
            <span className={`text-xs ${overdue ? "text-red-600" : "text-muted-foreground"}`}>
              {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "currentPeriodStart",
      header: "Started",
      cell: ({ getValue }) => (
        <span className="text-xs">{new Date(getValue() as string).toLocaleDateString()}</span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold">Subscriptions</h1>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search user by name, email, phone..."
            className="pl-9"
            maxLength={100}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v || "active_valid"); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tier} onValueChange={(v) => { setTier(v || "all"); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIER_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={query.isLoading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        emptyIcon={<AlertCircle className="h-12 w-12" />}
        emptyMessage="No subscriptions match these filters."
      />
    </div>
  );
}
