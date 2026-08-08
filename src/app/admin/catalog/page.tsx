"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Car, ChevronRight, Layers, Pencil, Plus, Search, Star, Trash2, Upload, X } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { catalogApi, uploadApi } from "@/lib/admin-api";
import { toast } from "sonner";
import type { Make, Model, Trim } from "@/types";

/**
 * The catalog is a three-level tree — make › model › trim — so the page is a
 * drill-down rather than a set of tabs: picking a make from a 130-entry
 * dropdown was the old models tab's whole navigation, and trims had no UI at
 * all even though listings reference them.
 */
type Level = "make" | "model" | "trim";

const LEVEL = {
  make: { one: "Make", many: "makes" },
  model: { one: "Model", many: "models" },
  trim: { one: "Trim", many: "trims" },
} as const satisfies Record<Level, { one: string; many: string }>;

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

type ApiError = { response?: { data?: { message?: string } } };
const errorMessage = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? fallback;

interface CatalogDialog {
  level: Level;
  mode: "create" | "edit";
  data?: Make | Model | Trim;
}

interface DeleteTarget {
  level: Level;
  id: string;
  label: string;
}

const DELETE_WARNING: Record<Level, string> = {
  make: "All of its models and trims are removed with it. Listings that reference them will lose their make/model.",
  model: "All of its trims are removed with it. Listings that reference it will lose their model.",
  trim: "Listings that reference this trim will lose it.",
};

export default function CatalogPage() {
  const qc = useQueryClient();
  // Drill-down position. IDs (not objects) so a rename elsewhere in the tree
  // keeps the breadcrumb in sync with the freshly-fetched rows.
  const [makeId, setMakeId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [popularOnly, setPopularOnly] = useState(false);

  const [dialog, setDialog] = useState<CatalogDialog | null>(null);
  const [form, setForm] = useState({ name: "", nameEn: "", logoUrl: "", isPopular: false, sortOrder: "0" });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const level: Level = modelId ? "trim" : makeId ? "model" : "make";

  // ── Queries ──────────────────────────────────────────────
  const makesQuery = useQuery({
    queryKey: ["catalog", "makes"],
    queryFn: catalogApi.getMakes,
  });

  const modelsQuery = useQuery({
    queryKey: ["catalog", "models", makeId],
    queryFn: () => catalogApi.getModels(makeId as string),
    enabled: !!makeId,
  });

  const trimsQuery = useQuery({
    queryKey: ["catalog", "trims", modelId],
    queryFn: () => catalogApi.getTrims(modelId as string),
    enabled: !!modelId,
  });

  useEffect(() => {
    if (makesQuery.isError) toast.error("Failed to load makes");
  }, [makesQuery.isError]);
  useEffect(() => {
    if (modelsQuery.isError) toast.error("Failed to load models");
  }, [modelsQuery.isError]);
  useEffect(() => {
    if (trimsQuery.isError) toast.error("Failed to load trims");
  }, [trimsQuery.isError]);

  // Held in memo so the `?? []` fallback doesn't hand DataTable a fresh array
  // (and reset its page) on every render while a query is still loading.
  const makes = useMemo(() => makesQuery.data ?? [], [makesQuery.data]);
  const models = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);
  const trims = useMemo(() => trimsQuery.data ?? [], [trimsQuery.data]);

  const activeMake = useMemo(() => makes.find((m) => m.id === makeId) ?? null, [makes, makeId]);
  const activeModel = useMemo(() => models.find((m) => m.id === modelId) ?? null, [models, modelId]);

  // The catalog carries 130+ makes and 1,200+ models, so every level is
  // filterable by either language and paginated below. Search runs over the
  // whole level, not just the current page.
  //
  // Results are memoised: DataTable's client pagination resets to page 1
  // whenever the `data` reference changes, so an unmemoised `.filter()` would
  // make the page buttons look dead.
  const matches = useCallback(
    <T extends { name: string; nameEn: string }>(rows: T[], q: string) => {
      const term = q.trim().toLowerCase();
      if (!term) return rows;
      return rows.filter(
        (r) => r.name.toLowerCase().includes(term) || r.nameEn.toLowerCase().includes(term),
      );
    },
    [],
  );
  const visibleMakes = useMemo(() => {
    const rows = matches(makes, search);
    return popularOnly ? rows.filter((m) => m.isPopular) : rows;
  }, [matches, makes, search, popularOnly]);
  const visibleModels = useMemo(() => matches(models, search), [matches, models, search]);
  const visibleTrims = useMemo(() => matches(trims, search), [matches, trims, search]);

  // ── Navigation ───────────────────────────────────────────
  const goToMakes = () => {
    setMakeId(null);
    setModelId(null);
    setSearch("");
  };
  const openMake = (make: Make) => {
    setMakeId(make.id);
    setModelId(null);
    setSearch("");
    setPopularOnly(false);
  };
  const openModel = (model: Model) => {
    setModelId(model.id);
    setSearch("");
  };
  const backToModels = () => {
    setModelId(null);
    setSearch("");
  };

  const invalidate = (target: Level) => {
    if (target === "make") return qc.invalidateQueries({ queryKey: ["catalog", "makes"] });
    if (target === "model") return qc.invalidateQueries({ queryKey: ["catalog", "models", makeId] });
    return qc.invalidateQueries({ queryKey: ["catalog", "trims", modelId] });
  };

  // ── Mutations ────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!dialog) throw new Error("Invalid dialog state");
      const name = form.name.trim();
      const nameEn = form.nameEn.trim();

      if (dialog.level === "make") {
        const payload = {
          name,
          nameEn,
          // Send "" on edit to clear; omit on create when empty.
          logoUrl: dialog.mode === "edit" ? form.logoUrl : (form.logoUrl || undefined),
          isPopular: form.isPopular,
          sortOrder: Number(form.sortOrder) || 0,
        };
        return dialog.mode === "create"
          ? catalogApi.createMake(payload)
          : catalogApi.updateMake(dialog.data!.id, payload);
      }
      if (dialog.level === "model") {
        return dialog.mode === "create"
          ? catalogApi.createModel({ makeId: makeId as string, name, nameEn })
          : catalogApi.updateModel(dialog.data!.id, { name, nameEn });
      }
      return dialog.mode === "create"
        ? catalogApi.createTrim({ modelId: modelId as string, name, nameEn })
        : catalogApi.updateTrim(dialog.data!.id, { name, nameEn });
    },
    onSuccess: () => {
      const saved = dialog;
      if (saved) invalidate(saved.level);
      toast.success(`${saved ? LEVEL[saved.level].one : "Item"} saved`);
      setDialog(null);
    },
    onError: (err) => toast.error(errorMessage(err, "Save failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) throw new Error("No deletion target");
      if (deleteTarget.level === "make") return catalogApi.deleteMake(deleteTarget.id);
      if (deleteTarget.level === "model") return catalogApi.deleteModel(deleteTarget.id);
      return catalogApi.deleteTrim(deleteTarget.id);
    },
    onSuccess: () => {
      if (deleteTarget) invalidate(deleteTarget.level);
      toast.success(`${deleteTarget ? LEVEL[deleteTarget.level].one : "Item"} deleted`);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(errorMessage(err, "Delete failed")),
  });

  // ── Dialog helpers ───────────────────────────────────────
  const openCreate = () => {
    setForm({ name: "", nameEn: "", logoUrl: "", isPopular: false, sortOrder: "0" });
    setDialog({ level, mode: "create" });
  };
  const openEdit = (target: Level, data: Make | Model | Trim) => {
    const make = target === "make" ? (data as Make) : null;
    setForm({
      name: data.name,
      nameEn: data.nameEn,
      logoUrl: make?.logoUrl ?? "",
      isPopular: make?.isPopular ?? false,
      sortOrder: String(make?.sortOrder ?? 0),
    });
    setDialog({ level: target, mode: "edit", data });
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file (PNG, SVG or WebP)");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadApi.uploadLogo(file);
      setForm((prev) => ({ ...prev, logoUrl: url }));
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(errorMessage(err, "Logo upload failed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.nameEn.trim()) {
      toast.error("Both Arabic and English names are required");
      return;
    }
    saveMutation.mutate();
  };

  // ── Columns ──────────────────────────────────────────────
  const rowActions = (target: Level, row: Make | Model | Trim, drill?: () => void) => (
    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {drill && (
        <Button size="sm" variant="ghost" className="h-8 gap-1 text-muted-foreground" onClick={drill}>
          <Layers className="h-4 w-4" />
          {target === "make" ? "Models" : "Trims"}
        </Button>
      )}
      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${row.nameEn}`} onClick={() => openEdit(target, row)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-destructive"
        aria-label={`Delete ${row.nameEn}`}
        onClick={() => setDeleteTarget({ level: target, id: row.id, label: `${row.name} (${row.nameEn})` })}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

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
          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center" aria-hidden>
            <Car className="h-4 w-4 text-muted-foreground" />
          </div>
        ),
    },
    { accessorKey: "name", header: "Name (AR)", cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: "nameEn", header: "Name (EN)" },
    {
      accessorKey: "isPopular", header: "Popular",
      cell: ({ getValue }) => (getValue() as boolean)
        ? <Badge className="gap-1"><Star className="h-3 w-3 fill-current" />Popular</Badge>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    { accessorKey: "sortOrder", header: "Order", cell: ({ getValue }) => <span className="tabular-nums">{getValue() as number}</span> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => rowActions("make", row.original, () => openMake(row.original)),
    },
  ];

  const modelsColumns: ColumnDef<Model>[] = [
    { accessorKey: "name", header: "Name (AR)", cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: "nameEn", header: "Name (EN)" },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => rowActions("model", row.original, () => openModel(row.original)),
    },
  ];

  const trimsColumns: ColumnDef<Trim>[] = [
    { accessorKey: "name", header: "Name (AR)", cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: "nameEn", header: "Name (EN)" },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => rowActions("trim", row.original),
    },
  ];

  // ── Level-dependent chrome ───────────────────────────────
  const totalAtLevel = level === "trim" ? trims.length : level === "model" ? models.length : makes.length;
  const shownAtLevel = level === "trim" ? visibleTrims.length : level === "model" ? visibleModels.length : visibleMakes.length;
  const loadingAtLevel =
    level === "trim" ? trimsQuery.isLoading : level === "model" ? modelsQuery.isLoading : makesQuery.isLoading;
  const filtered = shownAtLevel !== totalAtLevel;

  const emptyMessage = search
    ? `No ${LEVEL[level].many} match "${search}".`
    : level === "make"
      ? popularOnly
        ? "No makes are marked popular yet."
        : 'No makes yet — click "Add Make" to get started.'
      : `No ${LEVEL[level].many} here yet — click "Add ${LEVEL[level].one}" to add the first one.`;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Catalog Management</h1>
        <p className="text-sm text-muted-foreground">
          Makes, their models, and each model&apos;s trims — the options buyers pick from when browsing and listing cars.
        </p>
      </div>

      {/* Breadcrumb: the whole navigation model for the make › model › trim tree */}
      <nav aria-label="Catalog location" className="flex flex-wrap items-center gap-1 text-sm">
        <button
          onClick={goToMakes}
          disabled={level === "make"}
          className="rounded px-2 py-1 font-medium transition-colors enabled:hover:bg-muted disabled:text-foreground text-muted-foreground"
        >
          All makes
        </button>
        {activeMake && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            <button
              onClick={backToModels}
              disabled={level === "model"}
              className="flex items-center gap-2 rounded px-2 py-1 font-medium transition-colors enabled:hover:bg-muted disabled:text-foreground text-muted-foreground"
            >
              {activeMake.logoUrl && (
                <Image src={activeMake.logoUrl} alt="" width={20} height={20} className="h-5 w-5 rounded object-contain" unoptimized />
              )}
              {activeMake.nameEn}
              <span className="text-muted-foreground">{activeMake.name}</span>
            </button>
          </>
        )}
        {activeModel && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            <span className="px-2 py-1 font-medium">
              {activeModel.nameEn} <span className="text-muted-foreground">{activeModel.name}</span>
            </span>
          </>
        )}
      </nav>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 pr-9"
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${LEVEL[level].many} (Arabic or English)...`}
              aria-label={`Search ${LEVEL[level].many}`}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {level === "make" && (
            <Button
              variant={popularOnly ? "default" : "outline"}
              onClick={() => setPopularOnly((v) => !v)}
              aria-pressed={popularOnly}
              className="gap-1.5"
            >
              <Star className={popularOnly ? "h-4 w-4 fill-current" : "h-4 w-4"} />
              Popular only
            </Button>
          )}
          {!loadingAtLevel && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {filtered
                ? `${shownAtLevel.toLocaleString()} of ${totalAtLevel.toLocaleString()} ${LEVEL[level].many}`
                : `${totalAtLevel.toLocaleString()} ${LEVEL[level].many}`}
            </span>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add {LEVEL[level].one}
        </Button>
      </div>

      {level === "make" && (
        <DataTable
          columns={makesColumns}
          data={visibleMakes}
          loading={makesQuery.isLoading}
          pageSize={25}
          onRowClick={openMake}
          emptyIcon={<Car className="h-8 w-8" />}
          emptyMessage={emptyMessage}
        />
      )}
      {level === "model" && (
        <DataTable
          columns={modelsColumns}
          data={visibleModels}
          loading={modelsQuery.isLoading}
          pageSize={25}
          onRowClick={openModel}
          emptyIcon={<Layers className="h-8 w-8" />}
          emptyMessage={emptyMessage}
        />
      )}
      {level === "trim" && (
        <DataTable
          columns={trimsColumns}
          data={visibleTrims}
          loading={trimsQuery.isLoading}
          pageSize={25}
          emptyIcon={<Layers className="h-8 w-8" />}
          emptyMessage={emptyMessage}
        />
      )}

      <Dialog open={!!dialog} onOpenChange={(open) => { if (!open && !saveMutation.isPending) setDialog(null); }}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {dialog?.mode === "create" ? "Add" : "Edit"} {dialog ? LEVEL[dialog.level].one : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {dialog?.mode === "create" && dialog.level !== "make" && (
                <p className="text-sm text-muted-foreground">
                  Adding to{" "}
                  <span className="font-medium text-foreground">
                    {dialog.level === "model" ? activeMake?.nameEn : `${activeMake?.nameEn} ${activeModel?.nameEn}`}
                  </span>
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="name-ar">Name (Arabic)</Label>
                <Input id="name-ar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. تويوتا" maxLength={100} autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name-en">Name (English)</Label>
                <Input id="name-en" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="e.g. Toyota" maxLength={100} dir="ltr" />
              </div>
              {dialog?.level === "make" && (
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
                    <p className="text-xs text-muted-foreground">PNG/SVG with a transparent background works best. Max 2 MB.</p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border px-3 py-3">
                    <div>
                      <Label htmlFor="popular" className="cursor-pointer">Popular</Label>
                      <p className="text-xs text-muted-foreground">Surfaced first in the app&apos;s make picker.</p>
                    </div>
                    <Switch id="popular" checked={form.isPopular} onCheckedChange={(v) => setForm({ ...form, isPopular: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sort-order">Sort Order</Label>
                    <Input
                      id="sort-order"
                      type="number"
                      inputMode="numeric"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Lower numbers list first; ties fall back to name.</p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(null)} disabled={saveMutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget ? LEVEL[deleteTarget.level].one.toLowerCase() : ""}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium">{deleteTarget?.label}</p>
            <p className="text-sm text-muted-foreground">
              {deleteTarget ? DELETE_WARNING[deleteTarget.level] : ""} This can&apos;t be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
