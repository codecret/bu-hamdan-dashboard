"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { catalogApi } from "@/lib/admin-api";
import { toast } from "sonner";

export default function CatalogPage() {
  const [makes, setMakes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedMakeId, setSelectedMakeId] = useState<string>("");
  const [dialog, setDialog] = useState<{ type: "make" | "model"; mode: "create" | "edit"; data?: any } | null>(null);
  const [form, setForm] = useState({ name: "", nameEn: "", isPopular: false, sortOrder: 0, makeId: "" });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: string } | null>(null);

  const fetchMakes = async () => {
    const data = await catalogApi.getMakes();
    setMakes(data);
  };

  const fetchModels = async (makeId: string) => {
    if (!makeId) return;
    const data = await catalogApi.getModels(makeId);
    setModels(data);
  };

  useEffect(() => { fetchMakes(); }, []);
  useEffect(() => { if (selectedMakeId) fetchModels(selectedMakeId); }, [selectedMakeId]);

  const openCreateMake = () => {
    setForm({ name: "", nameEn: "", isPopular: false, sortOrder: 0, makeId: "" });
    setDialog({ type: "make", mode: "create" });
  };

  const openEditMake = (make: any) => {
    setForm({ name: make.name, nameEn: make.nameEn, isPopular: make.isPopular, sortOrder: make.sortOrder, makeId: "" });
    setDialog({ type: "make", mode: "edit", data: make });
  };

  const openCreateModel = () => {
    setForm({ name: "", nameEn: "", isPopular: false, sortOrder: 0, makeId: selectedMakeId });
    setDialog({ type: "model", mode: "create" });
  };

  const openEditModel = (model: any) => {
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
          await catalogApi.updateMake(dialog.data.id, { name: form.name, nameEn: form.nameEn, isPopular: form.isPopular, sortOrder: form.sortOrder });
        }
        fetchMakes();
      } else if (dialog?.type === "model") {
        if (dialog.mode === "create") {
          await catalogApi.createModel({ makeId: form.makeId || selectedMakeId, name: form.name, nameEn: form.nameEn });
        } else {
          await catalogApi.updateModel(dialog.data.id, { name: form.name, nameEn: form.nameEn });
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
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name (AR)</TableHead>
                    <TableHead>Name (EN)</TableHead>
                    <TableHead>Popular</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {makes.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No makes added yet. Click &quot;Add Make&quot; to get started.</TableCell></TableRow>
                ) : makes.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.nameEn}</TableCell>
                      <TableCell>{m.isPopular ? <Badge>Popular</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                      <TableCell>{m.sortOrder}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditMake(m)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ type: "make", id: m.id })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="flex gap-4 justify-between">
            <Select value={selectedMakeId} onValueChange={(v) => setSelectedMakeId(v || "")}>
              <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select a make..." /></SelectTrigger>
              <SelectContent>
                {makes.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name} ({m.nameEn})</SelectItem>))}
              </SelectContent>
            </Select>
            {selectedMakeId && <Button onClick={openCreateModel}><Plus className="h-4 w-4 mr-2" /> Add Model</Button>}
          </div>
          {selectedMakeId && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name (AR)</TableHead>
                      <TableHead>Name (EN)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No models for this make</TableCell></TableRow>
                    ) : models.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>{m.nameEn}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditModel(m)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ type: "model", id: m.id })}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "create" ? "Add" : "Edit"} {dialog?.type === "make" ? "Make" : "Model"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name (Arabic)</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Name (English)</Label><Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></div>
            {dialog?.type === "make" && (
              <>
                <div className="flex items-center gap-2"><Switch checked={form.isPopular} onCheckedChange={(v) => setForm({ ...form, isPopular: v })} /><Label>Popular</Label></div>
                <div><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
