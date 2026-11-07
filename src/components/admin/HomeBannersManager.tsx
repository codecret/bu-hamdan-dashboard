/* eslint-disable @next/next/no-img-element -- uploaded partner artwork has arbitrary approved hosts */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ImagePlus, ArrowUpRight, Clock3, Pencil, Archive, RefreshCw, Megaphone, Loader2, Crop } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BannerCropDialog, type BannerCrop, type CropSource } from './BannerCropDialog';
import { homeBannersApi, uploadApi } from '@/lib/admin-api';
import type { HomeBanner, HomeBannerInput } from '@/types/home-banner';

const blank: HomeBannerInput = {
  titleAr: '', titleEn: null, bodyAr: null, bodyEn: null, imageUrl: null,
  partnerName: null, buttonAr: null, buttonEn: null, actionType: 'none', actionValue: null,
  displayOrder: 0, durationSeconds: 6, isActive: false, startsAt: null, endsAt: null,
};
const actions: { value: HomeBannerInput['actionType']; label: string }[] = [
  { value: 'none', label: 'No link' }, { value: 'external', label: 'Partner website (HTTPS)' },
  { value: 'post', label: 'Post a car' }, { value: 'search', label: 'Browse cars' },
  { value: 'directory', label: 'Showrooms directory' }, { value: 'listing', label: 'A vehicle listing' },
  { value: 'showroom', label: 'A showroom' },
];

function localDate(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
function status(banner: HomeBannerInput) {
  if (!banner.isActive) return 'Draft';
  if (banner.endsAt && Date.parse(banner.endsAt) <= Date.now()) return 'Ended';
  if (banner.startsAt && Date.parse(banner.startsAt) > Date.now()) return 'Scheduled';
  return 'Live';
}
function errorMessage(error: unknown) {
  const err = error as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } }; message?: string };
  return err.response?.data?.errors?.map(item => `${item.field}: ${item.message}`).join(' · ')
    || err.response?.data?.message || err.message || 'Please try again.';
}

export function BannerPreview({ banner }: { banner: HomeBannerInput }) {
  return <div className={`relative flex flex-col justify-center overflow-hidden rounded-2xl bg-[#002B70] text-white ${banner.imageUrl ? 'aspect-[8/3]' : 'min-h-[160px]'}`} dir="rtl">
    {banner.imageUrl ? <img src={banner.imageUrl} alt={banner.titleAr || 'Banner artwork'} className="absolute inset-0 h-full w-full object-cover" />
      : <div className="relative space-y-1 px-5 pb-5 pt-9">
        <p className="line-clamp-2 text-lg font-bold">{banner.titleAr || 'عنوان إعلانك هنا'}</p>
        {banner.bodyAr && <p className="line-clamp-2 text-xs leading-6 text-blue-100">{banner.bodyAr}</p>}
        {banner.actionType !== 'none' && <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#002B70]">{banner.buttonAr || 'عرض التفاصيل'}<ArrowUpRight size={13} /></span>}
      </div>}
  </div>;
}

export function HomeBannersManager({ apiClient = homeBannersApi }: { apiClient?: typeof homeBannersApi }) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'home-banners'], queryFn: apiClient.list });
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<HomeBannerInput>({ ...blank });
  const [saving, setSaving] = useState(false);
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const [artwork, setArtwork] = useState<(BannerCrop & { previewUrl: string }) | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const banners = query.data ?? [];
  const mixedCarousel = banners.some(banner => banner.id !== selected && !banner.imageUrl && status(banner) === 'Live');
  const preview = { ...form, imageUrl: artwork?.previewUrl ?? form.imageUrl };
  const locked = saving || !!busyId || cropSource !== null;
  const patch = <K extends keyof HomeBannerInput>(key: K, value: HomeBannerInput[K]) => setForm(previous => ({ ...previous, [key]: value }));
  useEffect(() => {
    return () => { if (artwork) URL.revokeObjectURL(artwork.previewUrl); };
  }, [artwork]);

  function edit(banner: HomeBanner) {
    // Only writable fields go back to the API; IDs/timestamps are server-owned.
    const data = Object.fromEntries(Object.keys(blank).map(key => [key, banner[key as keyof HomeBannerInput]])) as unknown as HomeBannerInput;
    setSelected(banner.id); setForm(data); setArchiveId(null); setArtwork(null);
  }
  function newBanner() {
    setSelected(null); setArtwork(null); setForm({ ...blank, displayOrder: banners.length ? Math.max(...banners.map(b => b.displayOrder)) + 1 : 0 });
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (locked) return;
    if (form.startsAt && form.endsAt && Date.parse(form.endsAt) <= Date.parse(form.startsAt)) {
      toast.error('End date must be after the start date.'); return;
    }
    setSaving(true);
    try {
      let payload = form;
      if (artwork) {
        const { url } = await uploadApi.uploadBanner(artwork.file);
        payload = { ...form, imageUrl: url };
        patch('imageUrl', url);
        setArtwork(null);
      }
      const saved = selected ? await apiClient.update(selected, payload) : await apiClient.create(payload);
      edit(saved); await qc.invalidateQueries({ queryKey: ['admin', 'home-banners'] });
      toast.success('Banner saved. Active banners appear automatically in the app.');
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setSaving(false); }
  }
  function chooseArtwork(file?: File) {
    if (!file) return;
    if (fileInput.current) fileInput.current.value = '';
    if (file.size > 10 * 1024 * 1024) { toast.error('Choose an image under 10 MB.'); return; }
    setCropSource(file);
  }
  function applyCrop(crop: BannerCrop) {
    setArtwork({ ...crop, previewUrl: URL.createObjectURL(crop.file) });
    patch('imageUrl', null);
    setCropSource(null);
  }
  function setImageUrl(url: string | null) {
    setArtwork(null);
    patch('imageUrl', url);
  }
  async function toggle(banner: HomeBanner, enabled: boolean) {
    setBusyId(banner.id);
    try {
      await apiClient.setActive(banner.id, enabled);
      if (selected === banner.id) patch('isActive', enabled);
      await qc.invalidateQueries({ queryKey: ['admin', 'home-banners'] });
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setBusyId(null); }
  }
  async function archive(id: string) {
    setBusyId(id);
    try {
      await apiClient.remove(id);
      if (selected === id) newBanner();
      setArchiveId(null); await qc.invalidateQueries({ queryKey: ['admin', 'home-banners'] });
      toast.success('Banner archived.');
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setBusyId(null); }
  }

  return <div className="mx-auto max-w-[1440px] space-y-6 p-4 md:p-7">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#51739f]">Home page / Promotions</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#142b48]">Home banners</h1>
        <p className="mt-1 text-sm text-slate-500">Partner ads and announcements, managed in one place.</p></div>
      <Button onClick={newBanner} disabled={locked} className="h-11 bg-[#002B70] px-4"><Plus />New banner</Button>
    </div>
    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-[#24466f]">
      <RefreshCw size={17} className="mt-0.5 shrink-0" /><p>Active banners rotate automatically in display order. Choose 5–30 seconds per banner. Scheduled ads start and end automatically; no app release is needed for later content changes.</p>
    </div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(280px,0.85fr)_minmax(400px,1.15fr)]">
      <section aria-label="Saved banners" className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-semibold text-slate-700">Your banners <span className="ms-1 text-slate-400">{banners.length}</span></h2><span className="text-xs text-slate-400">Lowest order appears first</span></div>
        {query.isError ? <div role="alert" className="rounded-xl border border-red-200 bg-white p-5 text-sm"><p className="text-red-600">Could not load banners. {errorMessage(query.error)}</p><Button variant="outline" onClick={() => query.refetch()} className="mt-3 h-11">Retry</Button></div>
          : query.isLoading ? <div className="animate-pulse rounded-xl border bg-white p-6 text-sm text-slate-500">Loading banners…</div>
          : banners.length === 0 ? <div className="rounded-xl border border-dashed bg-white px-6 py-12 text-center"><Megaphone className="mx-auto mb-3 text-[#7890ae]" size={30} /><h3 className="font-semibold">Your first home banner</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">Create a blue announcement or upload your partner’s artwork. New banners are drafts until enabled.</p></div>
          : banners.map(banner => <article key={banner.id} className={`overflow-hidden rounded-xl border bg-white ${selected === banner.id ? 'border-[#002B70] ring-1 ring-[#002B70]/10' : 'border-slate-200'}`}>
            <button type="button" className="block w-full p-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#002B70]" onClick={() => edit(banner)} disabled={locked} aria-label={`Edit ${banner.titleAr}`}>
              <BannerPreview banner={banner} />
              <div className="mt-3 flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold" dir="auto">{banner.titleAr}</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status(banner) === 'Live' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{status(banner)}</span></div>
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500"><span>Order {banner.displayOrder}</span><span className="flex items-center gap-1"><Clock3 size={12} />{banner.durationSeconds}s</span><span className="truncate">{banner.partnerName || 'Bu Hamdan'}</span></div>
            </button>
            <div className="flex min-h-12 items-center justify-between gap-2 border-t border-slate-100 px-3">
              <div className="flex items-center gap-2"><Switch checked={banner.isActive} disabled={busyId === banner.id || saving} onCheckedChange={value => toggle(banner, value)} aria-label={`Enable ${banner.titleAr}`} /><span className="text-xs text-slate-500">Enabled</span></div>
              <div className="flex"><Button variant="ghost" className="h-11 w-11" aria-label={`Edit ${banner.titleAr} details`} disabled={locked} onClick={() => edit(banner)}><Pencil size={15} /></Button><Button variant="ghost" className="h-11 w-11 text-slate-400" disabled={locked} aria-label={`Archive ${banner.titleAr}`} onClick={() => setArchiveId(archiveId === banner.id ? null : banner.id)}><Archive size={15} /></Button></div>
            </div>
            {archiveId === banner.id && <div className="flex flex-wrap items-center gap-2 border-t bg-amber-50 p-3 text-xs"><span className="flex-1">Remove this banner from the app?</span><Button variant="outline" className="h-11" onClick={() => setArchiveId(null)}>Cancel</Button><Button variant="destructive" className="h-11" disabled={busyId === banner.id} onClick={() => archive(banner.id)}>Archive banner</Button></div>}
          </article>)}
      </section>
      <form onSubmit={save} aria-label="Banner editor" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-semibold text-[#142b48]">{selected ? 'Edit banner' : 'Create banner'}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">{status(form)}</span></div>
        <fieldset disabled={locked} className="space-y-5 p-5 disabled:opacity-70">
          <div><Label htmlFor="banner-title-ar">Arabic title *</Label><Input id="banner-title-ar" required maxLength={100} value={form.titleAr} onChange={e => patch('titleAr', e.target.value)} dir="rtl" placeholder="عنوان الإعلان" className="mt-2 h-11" /><p className="mt-1 text-xs text-slate-400">Also used as the accessible title for image banners.</p></div>
          <div><Label htmlFor="banner-body-ar">Arabic description</Label><Textarea id="banner-body-ar" maxLength={220} value={form.bodyAr || ''} onChange={e => patch('bodyAr', e.target.value || null)} dir="rtl" placeholder="تفاصيل العرض أو الإعلان" className="mt-2" /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="banner-partner">Partner name</Label><Input id="banner-partner" maxLength={80} value={form.partnerName || ''} onChange={e => patch('partnerName', e.target.value || null)} placeholder="e.g. showroom or partner name" className="mt-2 h-11" /></div><div><Label htmlFor="banner-button-ar">Arabic button label</Label><Input id="banner-button-ar" maxLength={40} value={form.buttonAr || ''} onChange={e => patch('buttonAr', e.target.value || null)} placeholder="عرض التفاصيل" dir="rtl" className="mt-2 h-11" /></div></div>
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">Partner artwork</h3><p className="mt-1 text-xs text-slate-500">JPG, PNG or WebP, up to 10 MB.</p></div><Button type="button" variant="outline" className="h-11" onClick={() => fileInput.current?.click()}><ImagePlus />Choose image</Button></div>
            <input ref={fileInput} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" aria-label="Upload banner artwork" onChange={e => chooseArtwork(e.target.files?.[0])} />
            <Label htmlFor="banner-image-url">Or use an HTTPS image URL</Label><Input id="banner-image-url" type="url" pattern="https://.*" value={form.imageUrl || ''} onChange={e => setImageUrl(e.target.value || null)} placeholder="https://…" className="h-11 bg-white" />
            {preview.imageUrl && <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="h-11" onClick={() => setCropSource(artwork?.source ?? form.imageUrl)}><Crop />Crop image</Button>
              <Button type="button" variant="ghost" onClick={() => setImageUrl(null)} className="h-11">Remove image</Button>
            </div>}
            <BannerPreview banner={preview} />
            <p className="text-xs leading-5 text-slate-500">{artwork ? 'Crop ready. Save the banner to upload the new artwork.' : 'Keep important text and logos away from the edges.'}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="banner-action">Tap action</Label><select id="banner-action" value={form.actionType} onChange={e => { patch('actionType', e.target.value as HomeBannerInput['actionType']); patch('actionValue', null); }} className="mt-2 h-11 w-full rounded-lg border bg-white px-3 text-sm">{actions.map(action => <option key={action.value} value={action.value}>{action.label}</option>)}</select></div>
            {['external', 'listing', 'showroom'].includes(form.actionType) && <div><Label htmlFor="banner-target">{form.actionType === 'external' ? 'Partner website URL *' : `${form.actionType === 'listing' ? 'Listing' : 'Showroom'} ID *`}</Label><Input id="banner-target" required type={form.actionType === 'external' ? 'url' : 'text'} pattern={form.actionType === 'external' ? 'https://.*' : undefined} value={form.actionValue || ''} onChange={e => patch('actionValue', e.target.value || null)} placeholder={form.actionType === 'external' ? 'https://partner.example' : 'UUID'} className="mt-2 h-11" /></div>}</div>
          <details className="rounded-xl border px-4 py-3"><summary className="cursor-pointer text-sm font-medium">English copy (optional)</summary><div className="mt-4 space-y-3"><Label htmlFor="banner-title-en">English title</Label><Input id="banner-title-en" maxLength={100} value={form.titleEn || ''} onChange={e => patch('titleEn', e.target.value || null)} className="h-11" /><Label htmlFor="banner-body-en">English description</Label><Textarea id="banner-body-en" maxLength={220} value={form.bodyEn || ''} onChange={e => patch('bodyEn', e.target.value || null)} /><Label htmlFor="banner-button-en">English button label</Label><Input id="banner-button-en" maxLength={40} value={form.buttonEn || ''} onChange={e => patch('buttonEn', e.target.value || null)} className="h-11" /></div></details>
          <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="banner-order">Display order</Label><Input id="banner-order" type="number" required min={0} max={9999} step={1} value={form.displayOrder} onChange={e => patch('displayOrder', Number(e.target.value))} className="mt-2 h-11" /></div><div><Label htmlFor="banner-duration">Seconds before next banner</Label><Input id="banner-duration" type="number" required min={5} max={30} step={1} value={form.durationSeconds} onChange={e => patch('durationSeconds', Number(e.target.value))} className="mt-2 h-11" /></div></div>
          <div className="space-y-3"><h3 className="text-sm font-semibold">Schedule (optional)</h3><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="banner-start">Start</Label><Input id="banner-start" type="datetime-local" value={localDate(form.startsAt)} onChange={e => patch('startsAt', e.target.value ? new Date(e.target.value).toISOString() : null)} className="mt-2 h-11" /></div><div><Label htmlFor="banner-end">End</Label><Input id="banner-end" type="datetime-local" value={localDate(form.endsAt)} onChange={e => patch('endsAt', e.target.value ? new Date(e.target.value).toISOString() : null)} className="mt-2 h-11" /></div></div><p className="text-xs text-slate-400">Times use your device timezone. Leave blank to run without a date limit.</p></div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><Label htmlFor="banner-enabled">Enable banner</Label><p className="mt-1 text-xs text-slate-500">Appears when enabled and within its schedule.</p></div><Switch id="banner-enabled" aria-label="Enable banner" checked={form.isActive} onCheckedChange={value => patch('isActive', value)} /></div>
        </fieldset>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50/70 px-5 py-4"><p className="text-xs text-slate-500">Changes reach open apps within about a minute.</p><Button type="submit" disabled={locked} className="h-11 bg-[#002B70] px-5">{saving && <Loader2 className="animate-spin" />}{saving ? 'Saving…' : 'Save banner'}</Button></div>
      </form>
    </div>
    {cropSource && <BannerCropDialog source={cropSource} initialView={artwork?.source === cropSource ? artwork.view : undefined} mixedCarousel={mixedCarousel} onCancel={() => setCropSource(null)} onApply={applyCrop} />}
  </div>;
}
