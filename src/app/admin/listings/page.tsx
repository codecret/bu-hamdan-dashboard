"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Trash2, ChevronLeft, ChevronRight, Star, StarOff, Eye, Search, Heart, Image as ImageIcon } from "lucide-react";
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

const LABEL_MAP: Record<string, string> = {
  new: "New",
  used: "Used",
  petrol: "Petrol",
  diesel: "Diesel",
  electric: "Electric",
  hybrid: "Hybrid",
  plugin_hybrid: "Plug-in Hybrid",
  automatic: "Automatic",
  manual: "Manual",
  cvt: "CVT",
  excellent: "Excellent",
  very_good: "Very Good",
  good: "Good",
  fair: "Fair",
};

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{ id: string; action: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [promoDialog, setPromoDialog] = useState<{ id: string; isFeatured: boolean } | null>(null);
  const [promoDays, setPromoDays] = useState("30");
  const [viewDialog, setViewDialog] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewImageIndex, setViewImageIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (status !== "all") params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await listingsApi.list(params);
      setListings(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleViewAd = async (id: string) => {
    setViewLoading(true);
    setViewDialog(null);
    setViewImageIndex(0);
    try {
      const data = await listingsApi.get(id);
      setViewDialog(data);
    } catch {
      toast.error("Failed to load listing details");
    } finally {
      setViewLoading(false);
    }
  };

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
        await listingsApi.toggleFeatured(promoDialog.id, false);
        toast.success("تم إلغاء ترويج الإعلان");
      } else {
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

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <Button key={tab} variant={status === tab ? "default" : "outline"} size="sm" onClick={() => { setStatus(tab); setPage(1); }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by make, model, or seller..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Image</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Promoted</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="text-center">Favs</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : listings.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No listings found</TableCell></TableRow>
              ) : (
                listings.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewAd(l.id)}>
                    <TableCell>
                      {l.primaryImage ? (
                        <img src={l.primaryImage} alt="" className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{l.makeNameEn} {l.modelNameEn}</div>
                      <div className="text-xs text-muted-foreground">{l.year} · {l.color}</div>
                    </TableCell>
                    <TableCell className="text-sm">{l.userName || "—"}</TableCell>
                    <TableCell className="font-medium">{Number(l.price).toLocaleString()} KWD</TableCell>
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
                    <TableCell className="text-center">{l.viewsCount}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-400" />
                        {l.favoritesCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(l.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="View Details" onClick={() => handleViewAd(l.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* View Ad Dialog */}
      <Dialog open={!!viewDialog || viewLoading} onOpenChange={() => { setViewDialog(null); setViewImageIndex(0); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {viewLoading ? (
            <div className="space-y-4 py-8">
              <Skeleton className="h-64 w-full rounded" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : viewDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {viewDialog.makeNameEn} {viewDialog.modelNameEn} {viewDialog.trimNameEn || ""} {viewDialog.year}
                </DialogTitle>
              </DialogHeader>

              {/* Image Gallery */}
              {viewDialog.images?.length > 0 ? (
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={viewDialog.images[viewImageIndex]?.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {viewDialog.images.length > 1 && (
                      <>
                        <Button
                          size="icon" variant="secondary"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80"
                          onClick={() => setViewImageIndex((i) => (i - 1 + viewDialog.images.length) % viewDialog.images.length)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon" variant="secondary"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80"
                          onClick={() => setViewImageIndex((i) => (i + 1) % viewDialog.images.length)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {viewImageIndex + 1} / {viewDialog.images.length}
                        </span>
                      </>
                    )}
                  </div>
                  {viewDialog.images.length > 1 && (
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {viewDialog.images.map((img: any, i: number) => (
                        <button
                          key={img.id}
                          onClick={() => setViewImageIndex(i)}
                          className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${i === viewImageIndex ? 'border-primary' : 'border-transparent'}`}
                        >
                          <img src={img.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              {/* Price & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold">{Number(viewDialog.price).toLocaleString()} KWD</span>
                  {viewDialog.isNegotiable && <Badge variant="outline" className="ml-2">Negotiable</Badge>}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[viewDialog.status] || ""}`}>
                  {viewDialog.status}
                </span>
              </div>

              {/* Car Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground text-xs">Category</div>
                  <div className="font-medium">{LABEL_MAP[viewDialog.category] || viewDialog.category}</div>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground text-xs">Condition</div>
                  <div className="font-medium">{LABEL_MAP[viewDialog.condition] || viewDialog.condition}</div>
                </div>
                {viewDialog.mileage != null && (
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground text-xs">Mileage</div>
                    <div className="font-medium">{Number(viewDialog.mileage).toLocaleString()} km</div>
                  </div>
                )}
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground text-xs">Fuel</div>
                  <div className="font-medium">{LABEL_MAP[viewDialog.fuelType] || viewDialog.fuelType}</div>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground text-xs">Transmission</div>
                  <div className="font-medium">{LABEL_MAP[viewDialog.transmission] || viewDialog.transmission}</div>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground text-xs">Color</div>
                  <div className="font-medium">{viewDialog.color}</div>
                </div>
                {viewDialog.interiorColor && (
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground text-xs">Interior</div>
                    <div className="font-medium">{viewDialog.interiorColor}</div>
                  </div>
                )}
                {viewDialog.bodyType && (
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground text-xs">Body Type</div>
                    <div className="font-medium">{viewDialog.bodyType}</div>
                  </div>
                )}
                {viewDialog.engineSize && (
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground text-xs">Engine</div>
                    <div className="font-medium">{viewDialog.engineSize}L {viewDialog.cylinders ? `· ${viewDialog.cylinders} cyl` : ""}</div>
                  </div>
                )}
                {viewDialog.horsepower && (
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground text-xs">Horsepower</div>
                    <div className="font-medium">{viewDialog.horsepower} HP</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {viewDialog.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewDialog.description}</p>
                </div>
              )}

              {/* Features */}
              {viewDialog.features?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Features</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewDialog.features.map((f: any) => (
                      <Badge key={f.id} variant="secondary">{f.nameEn || f.name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Location & Seller */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Location</h4>
                  <p className="font-medium">{viewDialog.governorate}, {viewDialog.city}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Seller</h4>
                  <div className="flex items-center gap-2">
                    {viewDialog.userAvatarUrl ? (
                      <img src={viewDialog.userAvatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted" />
                    )}
                    <div>
                      <p className="font-medium">{viewDialog.userName}</p>
                      <p className="text-xs text-muted-foreground">{viewDialog.userPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm text-muted-foreground border-t pt-3">
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {viewDialog.viewsCount} views</span>
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {viewDialog.favoritesCount} favorites</span>
                <span>Listed {new Date(viewDialog.createdAt).toLocaleDateString()}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                <Select value={promoDays} onValueChange={(v) => v !== null && setPromoDays(v)}>
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
