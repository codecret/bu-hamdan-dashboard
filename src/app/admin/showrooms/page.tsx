"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Building2, Globe, Phone, MapPin } from "lucide-react";
import { showroomsApi } from "@/lib/admin-api";
import { toast } from "sonner";

export default function ShowroomsPage() {
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDialog, setViewDialog] = useState<any | null>(null);

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
                <TableHead className="w-[50px]">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                ))
              ) : showrooms.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No showrooms found</TableCell></TableRow>
              ) : (
                showrooms.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewDialog(s)}>
                    <TableCell>
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt="" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                      {s.nameEn && <div className="text-xs text-muted-foreground">{s.nameEn}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{s.ownerName || "—"}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{s.address}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}><Switch checked={s.isVerified} onCheckedChange={(v) => handleVerify(s.id, v)} /></TableCell>
                    <TableCell className="text-xs">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="View Details" onClick={(e) => { e.stopPropagation(); setViewDialog(s); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Showroom Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-lg">
          {viewDialog && (
            <>
              <DialogHeader>
                <DialogTitle>Showroom Details</DialogTitle>
              </DialogHeader>

              {/* Header */}
              <div className="flex items-center gap-4">
                {viewDialog.logoUrl ? (
                  <img src={viewDialog.logoUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{viewDialog.name}</h3>
                  {viewDialog.nameEn && <p className="text-sm text-muted-foreground">{viewDialog.nameEn}</p>}
                  <div className="flex gap-2 mt-1">
                    {viewDialog.isVerified ? (
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    ) : (
                      <Badge variant="outline">Not Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              {viewDialog.coverUrl && (
                <div className="rounded-lg overflow-hidden">
                  <img src={viewDialog.coverUrl} alt="" className="w-full h-32 object-cover" />
                </div>
              )}

              {/* Description */}
              {viewDialog.description && (
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{viewDialog.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-1.5">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium">{viewDialog.phone}</div>
                  </div>
                </div>
                {viewDialog.whatsappBusiness && (
                  <div>
                    <div className="text-xs text-muted-foreground">WhatsApp Business</div>
                    <div className="font-medium">{viewDialog.whatsappBusiness}</div>
                  </div>
                )}
                {viewDialog.website && (
                  <div className="flex items-start gap-1.5">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Website</div>
                      <div className="font-medium truncate max-w-[180px]">{viewDialog.website}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">Address</div>
                    <div className="font-medium">{viewDialog.address}</div>
                  </div>
                </div>
              </div>

              {/* Owner */}
              <div className="border-t pt-3 text-sm">
                <div className="text-xs text-muted-foreground mb-1">Owner</div>
                <div className="font-medium">{viewDialog.ownerName || "—"}</div>
                {viewDialog.ownerEmail && <div className="text-xs text-muted-foreground">{viewDialog.ownerEmail}</div>}
              </div>

              <div className="text-xs text-muted-foreground border-t pt-3">
                Created {new Date(viewDialog.createdAt).toLocaleDateString()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
