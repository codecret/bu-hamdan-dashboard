import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingLanding from "./ListingLanding";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.bohamdan.cloud/api";

type Listing = {
  id: string;
  year: number;
  price: string | number;
  mileage?: number | null;
  governorate?: string;
  make?: { name?: string; nameEn?: string } | null;
  model?: { name?: string; nameEn?: string } | null;
  images?: Array<{ url: string; thumbnailUrl?: string | null; isPrimary?: boolean }>;
  description?: string | null;
};

async function fetchListing(id: string): Promise<Listing | null> {
  try {
    const res = await fetch(`${API_URL}/listings/${id}`, {
      // Revalidate each request so price/status stays fresh, but allow
      // CDN caching for 60s to handle link-preview bots hammering it.
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Listing;
  } catch {
    return null;
  }
}

function fmtPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat("ar-KW", { maximumFractionDigits: 0 }).format(n);
}

function buildTitle(l: Listing): string {
  const parts = [l.make?.name, l.model?.name, l.year].filter(Boolean);
  return parts.length ? parts.join(" ") : "إعلان سيارة";
}

function buildDescription(l: Listing): string {
  const pieces: string[] = [];
  pieces.push(`${fmtPrice(l.price)} د.ك`);
  if (l.mileage != null) pieces.push(`${fmtPrice(l.mileage)} كم`);
  if (l.governorate) pieces.push(l.governorate);
  return pieces.join(" · ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListing(id);
  if (!listing) {
    return { title: "إعلان غير موجود — بوحمدان" };
  }

  const title = `${buildTitle(listing)} — بوحمدان`;
  const description = buildDescription(listing);
  const primaryImage =
    listing.images?.find((i) => i.isPrimary)?.url ?? listing.images?.[0]?.url;

  // The Apple Smart App Banner: iOS Safari reads this meta tag and
  // shows a native banner at the top of the page offering "Open" (if
  // the app is installed and universal links aren't intercepting) or
  // "View" (which routes to the App Store). Replace the id 0000000000
  // with the real App Store ID once the app is published, or set
  // NEXT_PUBLIC_IOS_APP_ID in env to override.
  const iosAppId = process.env.NEXT_PUBLIC_IOS_APP_ID ?? "0000000000";

  return {
    title,
    description,
    // Override the admin panel's global noindex so public listings
    // are indexable and their OpenGraph tags are actually consumed
    // by bots (WhatsApp / Twitter / Google).
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: `https://buhamdan.com/listing/${listing.id}`,
      siteName: "بوحمدان",
      locale: "ar_KW",
      type: "website",
      ...(primaryImage
        ? { images: [{ url: primaryImage, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(primaryImage ? { images: [primaryImage] } : {}),
    },
    other: {
      "apple-itunes-app": `app-id=${iosAppId}, app-argument=https://buhamdan.com/listing/${listing.id}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await fetchListing(id);
  if (!listing) notFound();

  const primaryImage =
    listing.images?.find((i) => i.isPrimary)?.url ?? listing.images?.[0]?.url;

  return (
    <ListingLanding
      id={listing.id}
      title={buildTitle(listing)}
      priceLine={buildDescription(listing)}
      imageUrl={primaryImage ?? null}
    />
  );
}
