"use client";

import { useEffect, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { catalogApi } from "@/lib/admin-api";
import { toast } from "sonner";
import type { Make, Model } from "@/types";

interface CatalogDialog {
  type: "make" | "model";
  mode: "create" | "edit";
  data?: Make | Model;
}

export default function CatalogPage() {
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [makesLoading, setMakesLoading] = useState(true);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedMakeId, setSelectedMakeId] = useState<string>("");
  const [dialog, setDialog] = useState<CatalogDialog | null>(null);
  const [form, setForm] = useState({ name: "", nameEn: "", isPopular: false, sortOrder: 0, makeId: "" });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: string } | null>(null);

  const fetchMakes = async () => {
    setMakesLoading(true);
    try {
      const data = await catalogApi.getMakes();
      setMakes(data);
    } catch {
      toast.error("Failed to load makes");
    } finally {
      setMakesLoading(false);
    }
  };

  const fetchModels = async (makeId: string) => {
    if (!makeId) return;
    setModelsLoading(true);
    try {
      const data = await catalogApi.getModels(makeId);
      setModels(data);
    } catch {
      toast.error("Failed to load models");
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => { fetchMakes(); }, []);
  useEffect(() => { if (selectedMakeId) fetchModels(selectedMakeId); }, [selectedMakeId]);

  const openCreateMake = () => {
    setForm({ name: "", nameEn: "", isPopular: false, sortOrder: 0, makeId: "" });
    setDialog({ type: "make", mode: "create" });
  };

  const openEditMake = (make: Make) => {
    setForm({ name: make.name, nameEn: make.nameEn, isPopular: make.isPopular, sortOrder: make.sortOrder, makeId: "" });
    setDialog({ type: "make", mode: "edit", data: make });
  };

  const openCreateModel = () => {
    setForm({ name: "", nameEn: "", isPopular: false, sortOrder: 0, makeId: selectedMakeId });
    setDialog({ type: "model", mode: "create" });
  };

  const openEditModel = (model: Model) => {
    setForm({ name: model.name, nameEn: model.nameEn, isPopular: false, sortOrder: 0, makeId: selectedMakeId });
    setDialog({ type: "model", mode: "edit", data: model });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.nameEn.trim()) {
      toast.error("Both Arabic and English names are required");
      return;
    }
    setSaving(true);
    try {
      if (dialog?.type === "make") {
        if (dialog.mode === "create") {
          await catalogApi.createMake({ name: form.name, nameEn: form.nameEn, isPopular: form.isPopular, sortOrder: form.sortOrder });
        } else {
          await catalogApi.updateMake(dialog.data!.id, { name: form.name, nameEn: form.nameEn, isPopular: form.isPopular, sortOrder: form.sortOrder });
        }
        fetchMakes();
      } else if (dialog?.type === "model") {
        if (dialog.mode === "create") {
          await catalogApi.createModel({ makeId: form.makeId || selectedMakeId, name: form.name, nameEn: form.nameEn });
        } else {
          await catalogApi.updateModel(dialog.data!.id, { name: form.name, nameEn: form.nameEn });
        }
        fetchModels(selectedMakeId);
      }
      toast.success("Saved successfully");
      setDialog(null);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      if (deleteDialog.type === "make") {
        await catalogApi.deleteMake(deleteDialog.id);
        fetchMakes();
      } else {
        await catalogApi.deleteModel(deleteDialog.id);
        fetchModels(selectedMakeId);
      }
      toast.success("Deleted");
      setDeleteDialog(null);
    } catch {
      toast.error("Delete failed");
    }
  };

  const makesColumns: ColumnDef<Make>[] = [
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
          <DataTable columns={makesColumns} data={makes} loading={makesLoading} emptyMessage='No makes added yet. Click "Add Make" to get started.' />
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
            <DataTable columns={modelsColumns} data={models} loading={modelsLoading} emptyMessage="No models for this make" />
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
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {deleteDialog?.type}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will also delete all associated models and trims.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
