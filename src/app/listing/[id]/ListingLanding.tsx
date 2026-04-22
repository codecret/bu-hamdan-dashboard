"use client";

import { useEffect, useState } from "react";

/**
 * App Store / Play Store URLs.
 *
 *   - IOS_APP_STORE_URL: fill in once the app is live on the App Store.
 *     Format: https://apps.apple.com/app/id<APP_ID>
 *     Until then the iOS fallback shows a waitlist/info screen.
 *   - ANDROID_PLAY_URL: uses the app's package id from app.json.
 */
const IOS_APP_STORE_URL =
  process.env.NEXT_PUBLIC_IOS_APP_STORE_URL ??
  "https://apps.apple.com/app/%D8%A8%D9%88%D8%AD%D9%85%D8%AF%D8%A7%D9%86/id0000000000";
const ANDROID_PLAY_URL =
  process.env.NEXT_PUBLIC_ANDROID_PLAY_URL ??
  "https://play.google.com/store/apps/details?id=com.buhamdan.app";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export default function ListingLanding({
  id,
  title,
  priceLine,
  imageUrl,
}: {
  id: string;
  title: string;
  priceLine: string;
  imageUrl: string | null;
}) {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);

    // If this page loaded on a mobile device, the universal link didn't
    // intercept → the app isn't installed (or isn't set up yet). Try the
    // custom scheme first (catches older app builds or devs without
    // AASA/assetlinks cached yet); if nothing happens in ~1.5s, send them
    // to the store. This is the standard deferred-deep-link pattern.
    if (p === "ios" || p === "android") {
      setRedirecting(true);
      const storeUrl = p === "ios" ? IOS_APP_STORE_URL : ANDROID_PLAY_URL;
      const appScheme = `buhamdan://listing/${id}`;

      // Best-effort app open — harmless if scheme isn't handled.
      const start = Date.now();
      try {
        window.location.href = appScheme;
      } catch {
        /* ignore */
      }

      const timer = window.setTimeout(() => {
        // If we're still on this page after 1500ms, the app didn't open.
        // Guard against the user having manually backgrounded the tab.
        if (document.visibilityState === "visible" && Date.now() - start > 1400) {
          window.location.replace(storeUrl);
        }
      }, 1500);

      return () => window.clearTimeout(timer);
    }
  }, [id]);

  const openApp = () => {
    window.location.href = `buhamdan://listing/${id}`;
  };
  const goToStore = () => {
    window.location.href = platform === "ios" ? IOS_APP_STORE_URL : ANDROID_PLAY_URL;
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F5F5F7] text-[#1C1E2C]">
      <div className="mx-auto flex max-w-md flex-col gap-6 p-6 pt-12">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-extrabold tracking-tight text-[#002B70]">
            بوحمدان
          </span>
          <span className="rounded-full border border-[#002B70]/20 bg-white px-3 py-1 text-xs text-[#52525D]">
            إعلان سيارة
          </span>
        </div>

        {/* Listing card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              className="h-56 w-full object-cover"
            />
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-[#E5E5EA] text-[#52525D]">
              لا توجد صورة
            </div>
          )}
          <div className="flex flex-col gap-1 p-5">
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm text-[#52525D]">{priceLine}</p>
          </div>
        </div>

        {/* Status / CTA */}
        {platform === "desktop" ? (
          <DesktopCTA />
        ) : (
          <MobileCTA
            platform={platform}
            redirecting={redirecting}
            onOpenApp={openApp}
            onGoToStore={goToStore}
          />
        )}

        {/* Footer */}
        <p className="mt-2 text-center text-xs text-[#52525D]">
          © بوحمدان · سوق السيارات الأول في الكويت
        </p>
      </div>
    </main>
  );
}

function MobileCTA({
  platform,
  redirecting,
  onOpenApp,
  onGoToStore,
}: {
  platform: "ios" | "android";
  redirecting: boolean;
  onOpenApp: () => void;
  onGoToStore: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-gradient-to-br from-[#001233] to-[#002B70] p-5 text-white shadow-md">
        <p className="mb-4 text-sm opacity-80">
          {redirecting
            ? "جاري فتح التطبيق أو الانتقال للمتجر…"
            : "شاهد هذا الإعلان داخل تطبيق بوحمدان لتفاصيل أوضح وتواصل أسرع مع البائع."}
        </p>
        <button
          type="button"
          onClick={onOpenApp}
          className="mb-2 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#002B70] active:scale-95"
        >
          فتح في التطبيق
        </button>
        <button
          type="button"
          onClick={onGoToStore}
          className="w-full rounded-xl border border-white/40 bg-white/10 px-4 py-3 text-sm font-bold text-white active:scale-95"
        >
          {platform === "ios"
            ? "تحميل من App Store"
            : "تحميل من Google Play"}
        </button>
      </div>
    </div>
  );
}

function DesktopCTA() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#001233] to-[#002B70] p-6 text-white shadow-md">
      <h2 className="mb-2 text-lg font-bold">افتح على هاتفك</h2>
      <p className="mb-5 text-sm opacity-80">
        الإعلانات الكاملة متاحة على تطبيق بوحمدان للجوال. قم بمسح الرمز أو
        التحميل مباشرة:
      </p>
      <div className="flex flex-col gap-2">
        <a
          href={IOS_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-[#002B70]"
        >
          App Store (iOS)
        </a>
        <a
          href={ANDROID_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-[#002B70]"
        >
          Google Play (Android)
        </a>
      </div>
    </div>
  );
}
