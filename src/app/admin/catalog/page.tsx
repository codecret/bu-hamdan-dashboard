"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { catalogApi, uploadApi } from "@/lib/admin-api";
import { toast } from "sonner";
import type { Make, Model } from "@/types";

interface CatalogDialog {
  type: "make" | "model";
  mode: "create" | "edit";
  data?: Make | Model;
}

export default function CatalogPage() {
  const qc = useQueryClient();
  const [selectedMakeId, setSelectedMakeId] = useState<string>("");
  const [dialog, setDialog] = useState<CatalogDialog | null>(null);
  const [form, setForm] = useState({ name: "", nameEn: "", logoUrl: "", isPopular: false, sortOrder: 0, makeId: "" });
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Queries ──────────────────────────────────────────────
  const makesQuery = useQuery({
    queryKey: ["catalog", "makes"],
    queryFn: catalogApi.getMakes,
  });

  const modelsQuery = useQuery({
    queryKey: ["catalog", "models", selectedMakeId],
    queryFn: () => catalogApi.getModels(selectedMakeId),
    enabled: !!selectedMakeId,
  });

  useEffect(() => {
    if (makesQuery.isError) toast.error("Failed to load makes");
  }, [makesQuery.isError]);
  useEffect(() => {
    if (modelsQuery.isError) toast.error("Failed to load models");
  }, [modelsQuery.isError]);

  const makes = makesQuery.data ?? [];
  const models = modelsQuery.data ?? [];

  const invalidateMakes = () =>
    qc.invalidateQueries({ queryKey: ["catalog", "makes"] });
  const invalidateModels = () =>
    qc.invalidateQueries({ queryKey: ["catalog", "models", selectedMakeId] });

  // ── Mutations ────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (dialog?.type === "make") {
        const payload = {
          name: form.name,
          nameEn: form.nameEn,
          // Send "" on edit to clear; omit on create when empty.
          logoUrl: dialog.mode === "edit" ? form.logoUrl : (form.logoUrl || undefined),
          isPopular: form.isPopular,
          sortOrder: form.sortOrder,
        };
        return dialog.mode === "create"
          ? catalogApi.createMake(payload)
          : catalogApi.updateMake(dialog.data!.id, payload);
      }
      if (dialog?.type === "model") {
        return dialog.mode === "create"
          ? catalogApi.createModel({
              makeId: form.makeId || selectedMakeId,
              name: form.name,
              nameEn: form.nameEn,
            })
          : catalogApi.updateModel(dialog.data!.id, {
              name: form.name,
              nameEn: form.nameEn,
            });
      }
      throw new Error("Invalid dialog state");
    },
    onSuccess: () => {
      if (dialog?.type === "make") invalidateMakes();
      else invalidateModels();
      toast.success("Saved successfully");
      setDialog(null);
    },
    onError: () => toast.error("Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteDialog) throw new Error("No deletion target");
      return deleteDialog.type === "make"
        ? catalogApi.deleteMake(deleteDialog.id)
        : catalogApi.deleteModel(deleteDialog.id);
    },
    onSuccess: () => {
      if (deleteDialog?.type === "make") invalidateMakes();
      else invalidateModels();
      toast.success("Deleted");
      setDeleteDialog(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  // ── Dialog openers ───────────────────────────────────────
  const openCreateMake = () => {
    setForm({ name: "", nameEn: "", logoUrl: "", isPopular: false, sortOrder: 0, makeId: "" });
    setDialog({ type: "make", mode: "create" });
  };
  const openEditMake = (make: Make) => {
    setForm({ name: make.name, nameEn: make.nameEn, logoUrl: make.logoUrl ?? "", isPopular: make.isPopular, sortOrder: make.sortOrder, makeId: "" });
    setDialog({ type: "make", mode: "edit", data: make });
  };
  const openCreateModel = () => {
    setForm({ name: "", nameEn: "", logoUrl: "", isPopular: false, sortOrder: 0, makeId: selectedMakeId });
    setDialog({ type: "model", mode: "create" });
  };
  const openEditModel = (model: Model) => {
    setForm({ name: model.name, nameEn: model.nameEn, logoUrl: "", isPopular: false, sortOrder: 0, makeId: selectedMakeId });
    setDialog({ type: "model", mode: "edit", data: model });
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadApi.uploadLogo(file);
      setForm((prev) => ({ ...prev, logoUrl: url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Logo upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.nameEn.trim()) {
      toast.error("Both Arabic and English names are required");
      return;
    }
    saveMutation.mutate();
  };

  const makesColumns: ColumnDef<Make>[] = [
    {
      id: "logo",
      header: "Logo",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.logoUrl ? (
          <Image
            src={row.original.logoUrl}
            alt={row.original.nameEn}
            width={32}
            height={32}
            className="h-8 w-8 rounded object-contain bg-muted"
            unoptimized
          />
        ) : (
          <div className="h-8 w-8 rounded bg-muted" aria-hidden />
        ),
    },
    { accessorKey: "name", header: "Name (AR)", cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: "nameEn", header: "Name (EN)" },
    {
      accessorKey: "isPopular", header: "Popular",
      cell: ({ getValue }) => (getValue() as boolean) ? <Badge>Popular</Badge> : <Badge variant="outline">No</Badge>,
    },
    { accessorKey: "sortOrder", header: "Order" },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${row.original.nameEn}`} onClick={() => openEditMake(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label={`Delete ${row.original.nameEn}`} onClick={() => setDeleteDialog({ type: "make", id: row.original.id })}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const modelsColumns: ColumnDef<Model>[] = [
    { accessorKey: "name", header: "Name (AR)", cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: "nameEn", header: "Name (EN)" },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${row.original.nameEn}`} onClick={() => openEditModel(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label={`Delete ${row.original.nameEn}`} onClick={() => setDeleteDialog({ type: "model", id: row.original.id })}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Catalog Management</h1>

      <Tabs defaultValue="makes">
        <TabsList>
          <TabsTrigger value="makes">Makes</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>

        <TabsContent value="makes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateMake}><Plus className="h-4 w-4 mr-2" /> Add Make</Button>
          </div>
          <DataTable columns={makesColumns} data={makes} loading={makesQuery.isLoading} emptyMessage='No makes added yet. Click "Add Make" to get started.' />
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="flex gap-4 justify-between">
            <Select value={selectedMakeId} onValueChange={(v) => setSelectedMakeId(v || "")}>
              <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select a make..." /></SelectTrigger>
              <SelectContent>
                {makes.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.nameEn})</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedMakeId && <Button onClick={openCreateModel}><Plus className="h-4 w-4 mr-2" /> Add Model</Button>}
          </div>
          {selectedMakeId && (
            <DataTable columns={modelsColumns} data={models} loading={modelsQuery.isLoading} emptyMessage="No models for this make" />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "create" ? "Add" : "Edit"} {dialog?.type === "make" ? "Make" : "Model"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name-ar">Name (Arabic)</Label>
              <Input id="name-ar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. تويوتا" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name-en">Name (English)</Label>
              <Input id="name-en" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="e.g. Toyota" maxLength={100} />
            </div>
            {dialog?.type === "make" && (
              <>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                      {form.logoUrl ? (
                        <Image src={form.logoUrl} alt="Logo preview" width={64} height={64} className="h-full w-full object-contain" unoptimized />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleLogoUpload(f);
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? "Uploading..." : form.logoUrl ? "Replace" : "Upload"}
                      </Button>
                      {form.logoUrl && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, logoUrl: "" })}>
                          <X className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG/SVG with transparent background works best.</p>
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-3">
                  <Label htmlFor="popular" className="cursor-pointer">Popular</Label>
                  <Switch id="popular" checked={form.isPopular} onCheckedChange={(v) => setForm({ ...form, isPopular: v })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort-order">Sort Order</Label>
                  <Input id="sort-order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {deleteDialog?.type}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will also delete all associated models and trims.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
