"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Car, Clock, DollarSign, Building2, MessageSquare } from "lucide-react";
import { analyticsApi } from "@/lib/admin-api";

interface Overview {
  totalUsers: number;
  newUsersThisMonth: number;
  listings: Record<string, number>;
  totalShowrooms: number;
  totalConversations: number;
  totalRevenue: number;
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    analyticsApi.overview()
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Card className="border-destructive">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-destructive">{error || "Failed to load data"}</p>
            <Button variant="outline" onClick={fetchData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalListings = Object.values(data.listings).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={data.totalUsers} sub={`+${data.newUsersThisMonth} this month`} color="text-blue-600" />
        <StatCard icon={Car} label="Total Listings" value={totalListings} sub={`${data.listings.active || 0} active`} color="text-green-600" />
        <StatCard icon={Clock} label="Pending Review" value={data.listings.pending || 0} color="text-amber-600" />
        <StatCard icon={DollarSign} label="Revenue" value={`${data.totalRevenue} KWD`} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Building2} label="Showrooms" value={data.totalShowrooms} color="text-indigo-600" />
        <StatCard icon={MessageSquare} label="Conversations" value={data.totalConversations} color="text-purple-600" />
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Listings by Status</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(data.listings).map(([status, count]) => (
              <Badge key={status} variant={status === "active" ? "default" : status === "pending" ? "secondary" : "outline"}>
                {status}: {count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
