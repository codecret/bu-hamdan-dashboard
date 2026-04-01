"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Trash2, ChevronLeft, ChevronRight, Star, StarOff } from "lucide-react";
import { listingsApi } from "@/lib/admin-api";
import { toast } from "sonner";

const STATUS_TABS = ["all", "pending", "active", "rejected", "sold"] as const;
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
  sold: "bg-gray-100 text-gray-800",
  expired: "bg-gray-100 text-gray-600",
};

const PROMO_DURATIONS = [
  { value: "7", label: "7 أيام" },
  { value: "14", label: "14 يوم" },
  { value: "30", label: "30 يوم" },
  { value: "60", label: "60 يوم" },
  { value: "90", label: "90 يوم" },
];

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{ id: string; action: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [promoDialog, setPromoDialog] = useState<{ id: string; isFeatured: boolean } | null>(null);
  const [promoDays, setPromoDays] = useState("30");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (status !== "all") params.status = status;
      const res = await listingsApi.list(params);
      setListings(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleAction = async () => {
    if (!actionDialog) return;
    setActionLoading(true);
    try {
      if (actionDialog.action === "delete") {
        await listingsApi.delete(actionDialog.id);
        toast.success("Listing deleted");
      } else {
        await listingsApi.updateStatus(actionDialog.id, actionDialog.action);
        toast.success(`Listing ${actionDialog.action === "active" ? "approved" : "rejected"}`);
      }
      setActionDialog(null);
      fetchListings();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromo = async () => {
    if (!promoDialog) return;
    setActionLoading(true);
    try {
      if (promoDialog.isFeatured) {
        // Remove promotion
        await listingsApi.toggleFeatured(promoDialog.id, false);
        toast.success("تم إلغاء ترويج الإعلان");
      } else {
        // Promote
        await listingsApi.toggleFeatured(promoDialog.id, true, parseInt(promoDays));
        toast.success(`تم ترويج الإعلان لمدة ${promoDays} يوم`);
      }
      setPromoDialog(null);
      setPromoDays("30");
      fetchListings();
    } catch {
      toast.error("فشل تحديث الترويج");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Listings Moderation</h1>

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <Button key={tab} variant={status === tab ? "default" : "outline"} size="sm" onClick={() => { setStatus(tab); setPage(1); }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Promoted</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : listings.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No listings found</TableCell></TableRow>
              ) : (
                listings.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.id.slice(0, 8)}...</TableCell>
                    <TableCell>{l.year}</TableCell>
                    <TableCell>{l.color}</TableCell>
                    <TableCell>{Number(l.price).toLocaleString()} KWD</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[l.status] || ""}`}>
                        {l.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {l.isFeatured ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 fill-yellow-500" />
                          {l.featuredUntil ? `حتى ${new Date(l.featuredUntil).toLocaleDateString('ar-KW')}` : 'مروّج'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{l.viewsCount}</TableCell>
                    <TableCell className="text-xs">{new Date(l.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {l.status === "pending" && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" title="Approve" onClick={() => setActionDialog({ id: l.id, action: "active" })}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" title="Reject" onClick={() => setActionDialog({ id: l.id, action: "rejected" })}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {l.status === "active" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-8 w-8 ${l.isFeatured ? 'text-yellow-600' : 'text-muted-foreground'}`}
                            title={l.isFeatured ? 'إلغاء الترويج' : 'ترويج الإعلان'}
                            onClick={() => setPromoDialog({ id: l.id, isFeatured: l.isFeatured })}
                          >
                            {l.isFeatured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Delete" onClick={() => setActionDialog({ id: l.id, action: "delete" })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} total listings</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm py-2">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Approve/Reject/Delete Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "active" ? "Approve Listing?" : actionDialog?.action === "rejected" ? "Reject Listing?" : "Delete Listing?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be easily undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button variant={actionDialog?.action === "active" ? "default" : "destructive"} onClick={handleAction} disabled={actionLoading}>
              {actionLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote Dialog */}
      <Dialog open={!!promoDialog} onOpenChange={() => setPromoDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {promoDialog?.isFeatured ? 'إلغاء ترويج الإعلان' : 'ترويج الإعلان'}
            </DialogTitle>
          </DialogHeader>

          {promoDialog?.isFeatured ? (
            <p className="text-sm text-muted-foreground">
              سيتم إزالة الإعلان من القسم المميز في الصفحة الرئيسية.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                سيظهر الإعلان في القسم المميز في الصفحة الرئيسية للتطبيق.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">مدة الترويج</label>
                <Select value={promoDays} onValueChange={setPromoDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMO_DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoDialog(null)}>إلغاء</Button>
            <Button
              variant={promoDialog?.isFeatured ? "destructive" : "default"}
              onClick={handlePromo}
              disabled={actionLoading}
              className={!promoDialog?.isFeatured ? "bg-yellow-500 hover:bg-yellow-600" : ""}
            >
              {actionLoading ? "جاري..." : promoDialog?.isFeatured ? 'إلغاء الترويج' : 'ترويج'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
