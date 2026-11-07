/* eslint-disable @next/next/no-img-element -- crop previews use a browser-local image */
'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Crop, Loader2, Maximize, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const WIDTH = 1200;
const HEIGHT = 450;
const ASPECT = WIDTH / HEIGHT;
const STORAGE_ORIGIN = 'https://pub-d204768d63084c41a5def2df30a568ef.r2.dev';
const CENTER = { zoom: 1, x: 0.5, y: 0.5 };
const clamp = (n: number) => Math.max(0, Math.min(1, n));

type CropView = typeof CENTER;
type Size = { width: number; height: number };
type CropRect = Size & { x: number; y: number };
export type CropSource = File | string;
export type BannerCrop = { file: File; source: CropSource; view: CropView };

function cropRect(size: Size, view: CropView): CropRect {
  const width = Math.min(size.width, size.height * ASPECT) / view.zoom;
  const height = width / ASPECT;
  return {
    width, height,
    x: (size.width - width) * (width > size.width ? 0.5 : view.x),
    y: (size.height - height) * (height > size.height ? 0.5 : view.y),
  };
}

async function loadArtwork(source: CropSource, signal: AbortSignal) {
  if (typeof source !== 'string') return source;
  const url = new URL(source);
  if (url.protocol !== 'https:') throw new Error('Enter an HTTPS image URL.');
  // Use the dashboard's existing image optimizer for our storage, which does
  // not grant cross-origin canvas access. Other hosts can opt in via CORS.
  const stored = url.origin === STORAGE_ORIGIN && url.pathname.startsWith('/images/');
  const requestUrl = stored ? `/_next/image?${new URLSearchParams({ url: url.href, w: '3840', q: '75' })}` : url.href;
  const response = await fetch(requestUrl, { signal, credentials: 'omit' });
  if (!response.ok) throw new Error('Could not load this image.');
  const blob = await response.blob();
  if (!/^image\/(jpeg|png|webp|avif)$/.test(blob.type) || blob.size > 10 * 1024 * 1024) throw new Error('Choose a JPG, PNG or WebP under 10 MB.');
  return blob;
}

function createArtwork(image: HTMLImageElement, crop: CropRect): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject(new Error('Could not prepare the crop.'));
  context.fillStyle = '#002B70';
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.imageSmoothingQuality = 'high';
  if (crop.width > image.naturalWidth || crop.height > image.naturalHeight) {
    const background = cropRect({ width: image.naturalWidth, height: image.naturalHeight }, CENTER);
    context.save();
    context.globalAlpha = 0.75;
    context.filter = 'blur(24px)';
    context.drawImage(image, background.x, background.y, background.width, background.height, -60, -30, WIDTH + 120, HEIGHT + 60);
    context.restore();
  }
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, WIDTH, HEIGHT);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(new File([blob], 'banner-1200x450.jpg', { type: 'image/jpeg' })) : reject(new Error('Could not prepare the crop.')), 'image/jpeg', 0.93);
  });
}

export function BannerCropDialog({ source, initialView = CENTER, mixedCarousel, onCancel, onApply }: {
  source: CropSource;
  initialView?: CropView;
  mixedCarousel: boolean;
  onCancel: () => void;
  onApply: (crop: BannerCrop) => void;
}) {
  const [url, setUrl] = useState('');
  const [size, setSize] = useState<Size>();
  const [view, setView] = useState(initialView);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; view: CropView } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    loadArtwork(source, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => {
      if (!controller.signal.aborted) setError('This image could not be opened. Download the original and choose it from your device.');
    });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  const crop = size ? cropRect(size, view) : undefined;
  const canMoveX = !!(size && crop && size.width - crop.width > 0.01);
  const canMoveY = !!(size && crop && size.height - crop.height > 0.01);
  // On a 392 px phone the carousel is 360 px wide. Text banners in the
  // same rotation set a fixed 148 px height instead of the artwork ratio.
  const phoneAspect = mixedCarousel ? 360 / 148 : ASPECT;
  const phoneWidth = crop ? crop.height * phoneAspect : 0;
  const phoneCrop = crop && { ...crop, width: phoneWidth, x: crop.x + (crop.width - phoneWidth) / 2 };
  const fillsFrame = !!(crop && size && crop.width <= size.width && crop.height <= size.height);
  const safeAspect = mixedCarousel ? 288 / 148 : ASPECT;
  const fitZoom = size ? Math.min(size.width, size.height * ASPECT) / Math.max(size.width * ASPECT / safeAspect, size.height * ASPECT) : 1;

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if ((!canMoveX && !canMoveY) || !event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, view };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !crop || !size || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const scale = crop.width / event.currentTarget.clientWidth;
    setView({
      ...drag.current.view,
      x: canMoveX ? clamp(drag.current.view.x - (event.clientX - drag.current.x) * scale / (size.width - crop.width)) : 0.5,
      y: canMoveY ? clamp(drag.current.view.y - (event.clientY - drag.current.y) * scale / (size.height - crop.height)) : 0.5,
    });
  }

  async function apply() {
    if (!crop || !image.current || applying) return;
    setError('');
    setApplying(true);
    try {
      onApply({ file: await createArtwork(image.current, crop), source, view });
    } catch {
      setError('Could not prepare the crop. Try another image.');
      setApplying(false);
    }
  }

  function imageStyle(rect: CropRect, dimensions: Size) {
    return {
      width: `${dimensions.width / rect.width * 100}%`, height: `${dimensions.height / rect.height * 100}%`,
      left: `${-rect.x / rect.width * 100}%`, top: `${-rect.y / rect.height * 100}%`,
    };
  }

  return <Dialog open onOpenChange={open => { if (!open && !applying) onCancel(); }}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white p-5 text-slate-900 sm:max-w-3xl" showCloseButton={!applying}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-[#142b48]"><Crop size={19} /> Crop banner artwork</DialogTitle>
        <DialogDescription>Drag or use the controls to frame the image. The crop is saved at 1200 × 450 px.</DialogDescription>
      </DialogHeader>

      <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-slate-600">CROP AREA · 8:3</p>
            <Button type="button" variant="outline" className="h-11" disabled={!size || applying} onClick={() => setView({ ...CENTER, zoom: fitZoom })}><Maximize size={15} /> Fit full image</Button>
          </div>
          <div className={`relative isolate aspect-[8/3] overflow-hidden rounded-xl bg-[#002B70] ring-1 ring-slate-200 ${canMoveX || canMoveY ? 'touch-none cursor-grab active:cursor-grabbing' : ''}`}
            onPointerDown={startDrag} onPointerMove={moveDrag} onLostPointerCapture={() => { drag.current = null; }}>
            {size && !fillsFrame && <img src={url} alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full scale-110 object-cover opacity-75 blur-md" />}
            {url && <img ref={image} src={url} alt="" draggable={false} className="pointer-events-none absolute max-w-none select-none"
              style={crop && size ? imageStyle(crop, size) : { visibility: 'hidden' }}
              onLoad={event => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
              onError={() => { setSize(undefined); setError('This image could not be opened. Try a different file.'); }} />}
            {!size && !error && <div className="absolute inset-0 grid place-items-center text-white" role="status"><Loader2 className="animate-spin" /><span className="sr-only">Loading artwork</span></div>}
            {crop && <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 ring-1 ring-inset ring-white/70">{Array.from({ length: 9 }, (_, index) => <span key={index} className="border border-white/20" />)}</div>}
          </div>
          <div className="grid gap-2.5">
            <label className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.8rem] items-center gap-2 text-xs font-medium">
              Zoom <input aria-label="Zoom" className="h-8 w-full accent-[#002B70]" type="range" min={Math.min(0.25, fitZoom)} max="3" step="any" disabled={!size || applying} value={view.zoom} onChange={event => setView({ ...view, zoom: Number(event.target.value) })} />
              <span className="text-right tabular-nums text-slate-500">{Math.round(view.zoom * 100)}%</span>
            </label>
            {(['x', 'y'] as const).map(axis => <label key={axis} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.8rem] items-center gap-2 text-xs font-medium">
              {axis === 'x' ? 'Horizontal' : 'Vertical'} <input aria-label={axis === 'x' ? 'Horizontal position' : 'Vertical position'} className="h-8 w-full accent-[#002B70] disabled:opacity-40" type="range" min="0" max="1" step="0.01" disabled={applying || !(axis === 'x' ? canMoveX : canMoveY)} value={view[axis]} onChange={event => setView({ ...view, [axis]: Number(event.target.value) })} />
            </label>)}
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-600">APP PREVIEW</p>
          <div className="relative overflow-hidden rounded-xl bg-[#002B70]" style={{ aspectRatio: phoneAspect }}>
            {size && !fillsFrame && <img src={url} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-75 blur-md" />}
            {size && phoneCrop && <img src={url} alt="Cropped banner in the app" className="absolute max-w-none" style={imageStyle(phoneCrop, size)} />}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">{mixedCarousel ? 'Text banners make the frame taller on phones. Use Fit full image to keep text and logos inside the visible area.' : 'Preview of the artwork in the home carousel.'}</p>
        </div>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <DialogFooter className="-mx-5 -mb-5 items-stretch gap-2 sm:items-center">
        <Button type="button" variant="ghost" className="h-11 sm:me-auto" disabled={!size || applying} onClick={() => setView(CENTER)}><RotateCcw size={16} /> Reset crop</Button>
        <Button type="button" variant="outline" className="h-11" onClick={onCancel} disabled={applying}>Cancel</Button>
        <Button type="button" className="h-11 bg-[#002B70] text-white" disabled={!crop || applying} onClick={apply}>{applying && <Loader2 className="animate-spin" />}Use crop</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
