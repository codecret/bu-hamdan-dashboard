"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Car,
  Clock,
  DollarSign,
  Building2,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Activity,
} from "lucide-react";
import { analyticsApi } from "@/lib/admin-api";
import { useAuthStore } from "@/stores/auth-store";
import type { AnalyticsOverview } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  sold: { label: "Sold", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  expired: { label: "Expired", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    analyticsApi
      .overview()
      .then(setData)
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load dashboard"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="size-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Failed to load dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {error || "Something went wrong"}
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const totalListings = Object.values(data.listings).reduce(
    (a, b) => a + b,
    0,
  );
  const pendingCount = data.listings.pending || 0;
  const activeCount = data.listings.active || 0;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#002B70]">
            {getGreeting()}, {user?.name?.split(" ")[0] || "Admin"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with Bu Hamdan today.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="gap-2 self-start"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Primary KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          icon={Users}
          label="Total Users"
          value={data.totalUsers.toLocaleString()}
          change={`+${data.newUsersThisMonth} this month`}
          trend="up"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard
          icon={Car}
          label="Total Listings"
          value={totalListings.toLocaleString()}
          change={`${activeCount} active`}
          trend="up"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KPICard
          icon={DollarSign}
          label="Revenue"
          value={`${data.totalRevenue.toLocaleString()} KWD`}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <KPICard
          icon={Building2}
          label="Showrooms"
          value={data.totalShowrooms.toLocaleString()}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Pending review alert */}
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 lg:col-span-1">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <Clock className="size-7 text-amber-600" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-amber-700">
                {pendingCount}
              </p>
              <p className="mt-1 text-sm font-medium text-amber-600">
                Pending Review
              </p>
            </div>
            {pendingCount > 0 && (
              <Link href="/admin/listings?status=pending">
                <Button
                  size="sm"
                  className="mt-2 gap-1.5 bg-amber-600 hover:bg-amber-700"
                >
                  Review now
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Listings breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold">
                Listings Breakdown
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Distribution by status
              </p>
            </div>
            <Activity className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Status bar */}
            <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-gray-100">
              {Object.entries(data.listings).map(([status, count]) => {
                if (count === 0 || totalListings === 0) return null;
                const pct = (count / totalListings) * 100;
                const colors: Record<string, string> = {
                  active: "bg-emerald-500",
                  pending: "bg-amber-400",
                  rejected: "bg-red-400",
                  sold: "bg-blue-500",
                  expired: "bg-gray-400",
                };
                return (
                  <div
                    key={status}
                    className={`${colors[status] || "bg-gray-300"} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>

            {/* Status pills */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {Object.entries(data.listings).map(([status, count]) => {
                const config = STATUS_CONFIG[status] || {
                  label: status,
                  color: "text-gray-700",
                  bg: "bg-gray-50 border-gray-200",
                };
                const pct =
                  totalListings > 0
                    ? ((count / totalListings) * 100).toFixed(0)
                    : "0";
                return (
                  <div
                    key={status}
                    className={`flex flex-col items-center rounded-xl border px-3 py-3 ${config.bg}`}
                  >
                    <span className={`text-2xl font-bold ${config.color}`}>
                      {count}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground capitalize">
                      {config.label}
                    </span>
                    <span className="mt-0.5 text-[10px] text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          href="/admin/users"
          icon={Users}
          label="Manage Users"
          description="View and manage user accounts"
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <QuickLink
          href="/admin/listings"
          icon={Car}
          label="Manage Listings"
          description="Review and moderate listings"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <QuickLink
          href="/admin/showrooms"
          icon={Building2}
          label="Manage Showrooms"
          description="Verify and manage showrooms"
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function KPICard({
  icon: Icon,
  label,
  value,
  change,
  trend,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change && (
              <div className="flex items-center gap-1">
                {trend === "up" && (
                  <TrendingUp className="size-3.5 text-emerald-500" />
                )}
                <span className="text-xs font-medium text-emerald-600">
                  {change}
                </span>
              </div>
            )}
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className={`size-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  description,
  iconColor,
  iconBg,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="transition-all duration-200 hover:shadow-md hover:border-[#002B70]/20">
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} transition-transform duration-200 group-hover:scale-110`}
          >
            <Icon className={`size-5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground truncate">
              {description}
            </p>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary row skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick access skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
