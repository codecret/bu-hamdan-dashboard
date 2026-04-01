"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Trash2, ChevronLeft, ChevronRight, Star, StarOff, Eye, Search, Heart, Image as ImageIcon } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { listingsApi } from "@/lib/admin-api";
import { toast } from "sonner";
import type { AdminListing, AdminListingDetail, ListingImage, ListingFeature } from "@/types";
import { PAGE_LIMIT } from "@/types";

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
  new: "New", used: "Used", petrol: "Petrol", diesel: "Diesel", electric: "Electric",
  hybrid: "Hybrid", plugin_hybrid: "Plug-in Hybrid", automatic: "Automatic", manual: "Manual",
  cvt: "CVT", excellent: "Excellent", very_good: "Very Good", good: "Good", fair: "Fair",
};

function ImgWithFallback({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  if (error || !src) return (
    <div className={`bg-muted flex items-center justify-center ${className}`}>
      <ImageIcon className="h-5 w-5 text-muted-foreground" />
    </div>
  );
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
}

export default function ListingsPage() {
  const [listings, setListings] = useState<AdminListing[]>([]);
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
  const [viewDialog, setViewDialog] = useState<AdminListingDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewImageIndex, setViewImageIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchListings = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_LIMIT };
      if (status !== "all") params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await listingsApi.list(params);
      if (controller.signal.aborted) return;
      setListings(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      toast.error("Failed to load listings");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
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

  const columns: ColumnDef<AdminListing>[] = [
    {
      accessorKey: "primaryImage",
      header: "Image",
      enableSorting: false,
      cell: ({ row }) => row.original.primaryImage ? (
        <ImgWithFallback src={row.original.primaryImage} alt={`${row.original.makeNameEn} ${row.original.modelNameEn}`} className="w-12 h-12 rounded object-cover" />
      ) : (
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      ),
    },
    {
      id: "car",
      header: "Car",
      accessorFn: (row) => `${row.makeNameEn} ${row.modelNameEn}`,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.makeNameEn} {row.original.modelNameEn}</div>
          <div className="text-xs text-muted-foreground">{row.original.year} · {row.original.color}</div>
        </div>
      ),
    },
    {
      accessorKey: "userName",
      header: "Seller",
      cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || "—"}</span>,
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ getValue }) => <span className="font-medium">{Number(getValue()).toLocaleString()} KWD</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[getValue() as string] || ""}`}>
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "isFeatured",
      header: "Promoted",
      enableSorting: false,
      cell: ({ row }) => row.original.isFeatured ? (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Star className="h-3 w-3 fill-yellow-500" />
          {row.original.featuredUntil ? `حتى ${new Date(row.original.featuredUntil).toLocaleDateString('ar-KW')}` : 'مروّج'}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    },
    {
      accessorKey: "viewsCount",
      header: "Views",
      cell: ({ getValue }) => <span className="text-center block">{getValue() as number}</span>,
    },
    {
      accessorKey: "favoritesCount",
      header: "Favs",
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3 text-red-400" />{getValue() as number}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ getValue }) => <span className="text-xs">{new Date(getValue() as string).toLocaleDateString()}</span>,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const l = row.original;
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="View listing details" onClick={() => handleViewAd(l.id)}>
              <Eye className="h-4 w-4" />
            </Button>
            {l.status === "pending" && (
              <>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" aria-label="Approve listing" onClick={() => setActionDialog({ id: l.id, action: "active" })}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" aria-label="Reject listing" onClick={() => setActionDialog({ id: l.id, action: "rejected" })}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            {l.status === "active" && (
              <Button size="icon" variant="ghost" className={`h-8 w-8 ${l.isFeatured ? 'text-yellow-600' : 'text-muted-foreground'}`} aria-label={l.isFeatured ? 'Remove promotion' : 'Promote listing'} onClick={() => setPromoDialog({ id: l.id, isFeatured: l.isFeatured })}>
                {l.isFeatured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Delete listing" onClick={() => setActionDialog({ id: l.id, action: "delete" })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

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
          <Input placeholder="Search by make, model, or seller..." className="pl-9" maxLength={100} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={listings}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onRowClick={(row) => handleViewAd(row.id)}
        emptyMessage="No listings found"
      />

      {/* View Ad Dialog */}
      <Dialog open={!!viewDialog || viewLoading} onOpenChange={() => { setViewDialog(null); setViewImageIndex(0); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
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
              {viewDialog.images?.length > 0 ? (
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <ImgWithFallback src={viewDialog.images[viewImageIndex]?.url} alt={`${viewDialog.makeNameEn} ${viewDialog.modelNameEn} photo ${viewImageIndex + 1}`} className="w-full h-full object-cover" />
                    {viewDialog.images.length > 1 && (
                      <>
                        <Button size="icon" variant="secondary" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80" aria-label="Previous image" onClick={() => setViewImageIndex((i) => (i - 1 + viewDialog.images.length) % viewDialog.images.length)}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80" aria-label="Next image" onClick={() => setViewImageIndex((i) => (i + 1) % viewDialog.images.length)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">{viewImageIndex + 1} / {viewDialog.images.length}</span>
                      </>
                    )}
                  </div>
                  {viewDialog.images.length > 1 && (
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {viewDialog.images.map((img: ListingImage, i: number) => (
                        <button key={img.id} onClick={() => setViewImageIndex(i)} aria-label={`View image ${i + 1}`} className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${i === viewImageIndex ? 'border-primary' : 'border-transparent'}`}>
                          <ImgWithFallback src={img.thumbnailUrl} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
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
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold">{Number(viewDialog.price).toLocaleString()} KWD</span>
                  {viewDialog.isNegotiable && <Badge variant="outline" className="ml-2">Negotiable</Badge>}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[viewDialog.status] || ""}`}>{viewDialog.status}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {([
                  { label: "Category", value: LABEL_MAP[viewDialog.category] || viewDialog.category },
                  { label: "Condition", value: LABEL_MAP[viewDialog.condition] || viewDialog.condition },
                  viewDialog.mileage != null ? { label: "Mileage", value: `${Number(viewDialog.mileage).toLocaleString()} km` } : null,
                  { label: "Fuel", value: LABEL_MAP[viewDialog.fuelType] || viewDialog.fuelType },
                  { label: "Transmission", value: LABEL_MAP[viewDialog.transmission] || viewDialog.transmission },
                  { label: "Color", value: viewDialog.color },
                  viewDialog.interiorColor ? { label: "Interior", value: viewDialog.interiorColor } : null,
                  viewDialog.bodyType ? { label: "Body Type", value: viewDialog.bodyType } : null,
                  viewDialog.engineSize ? { label: "Engine", value: `${viewDialog.engineSize}L ${viewDialog.cylinders ? `· ${viewDialog.cylinders} cyl` : ""}` } : null,
                  viewDialog.horsepower ? { label: "Horsepower", value: `${viewDialog.horsepower} HP` } : null,
                ] as ({ label: string; value: string } | null)[]).filter(Boolean).map((spec) => (
                  <div key={spec!.label} className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground text-xs">{spec!.label}</div>
                    <div className="font-medium">{spec!.value}</div>
                  </div>
                ))}
              </div>
              {viewDialog.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewDialog.description}</p>
                </div>
              )}
              {viewDialog.features?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Features</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewDialog.features.map((f: ListingFeature) => <Badge key={f.id} variant="secondary">{f.nameEn || f.name}</Badge>)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Location</h4>
                  <p className="font-medium">{viewDialog.governorate}, {viewDialog.city}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Seller</h4>
                  <div className="flex items-center gap-2">
                    {viewDialog.userAvatarUrl ? <ImgWithFallback src={viewDialog.userAvatarUrl} alt={viewDialog.userName || "Seller"} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-muted" />}
                    <div>
                      <p className="font-medium">{viewDialog.userName}</p>
                      <p className="text-xs text-muted-foreground">{viewDialog.userPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground border-t pt-3">
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {viewDialog.viewsCount} views</span>
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {viewDialog.favoritesCount} favorites</span>
                <span>Listed {new Date(viewDialog.createdAt).toLocaleDateString()}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog?.action === "active" ? "Approve Listing?" : actionDialog?.action === "rejected" ? "Reject Listing?" : "Delete Listing?"}</DialogTitle>
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

      <Dialog open={!!promoDialog} onOpenChange={() => setPromoDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{promoDialog?.isFeatured ? 'إلغاء ترويج الإعلان' : 'ترويج الإعلان'}</DialogTitle>
          </DialogHeader>
          {promoDialog?.isFeatured ? (
            <p className="text-sm text-muted-foreground">سيتم إزالة الإعلان من القسم المميز في الصفحة الرئيسية.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">سيظهر الإعلان في القسم المميز في الصفحة الرئيسية للتطبيق.</p>
              <div className="space-y-2">
                <label className="text-sm font-medium">مدة الترويج</label>
                <Select value={promoDays} onValueChange={(v) => v !== null && setPromoDays(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROMO_DURATIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoDialog(null)}>إلغاء</Button>
            <Button variant={promoDialog?.isFeatured ? "destructive" : "default"} onClick={handlePromo} disabled={actionLoading} className={!promoDialog?.isFeatured ? "bg-yellow-500 hover:bg-yellow-600" : ""}>
              {actionLoading ? "جاري..." : promoDialog?.isFeatured ? 'إلغاء الترويج' : 'ترويج'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
