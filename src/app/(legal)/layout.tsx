import Link from "next/link";
import Image from "next/image";
import { BUSINESS_LEGAL_NAME, SUPPORT_EMAIL } from "@/lib/business-info";

/**
 * Public legal shell — Terms, Privacy and Help.
 *
 * These are linked directly from inside the iOS/Android app (Settings and
 * Profile), and App Store Connect requires a reachable Privacy Policy URL, so
 * unlike the rest of this admin site these pages are public, indexable and
 * Arabic-first.
 */

const LINKS = [
  { href: "/terms", label: "الشروط والأحكام" },
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/help", label: "المساعدة" },
  { href: "/delete-account", label: "حذف الحساب" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-3" aria-label="بوحمدان — الرئيسية">
            <Image
              src="/logo-transparent.png"
              alt="بوحمدان"
              width={40}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <span className="text-lg font-bold text-[#002B70]">بوحمدان</span>
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-neutral-600 transition-colors hover:text-[#002B70]"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">{children}</main>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto max-w-3xl px-5 py-6 text-sm text-neutral-500">
          <p>© {new Date().getFullYear()} بوحمدان — جميع الحقوق محفوظة</p>
          <p className="mt-2 leading-relaxed">الجهة المشغّلة: {BUSINESS_LEGAL_NAME}</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr" className="mt-2 inline-block text-[#002B70] underline">{SUPPORT_EMAIL}</a>
        </div>
      </footer>
    </div>
  );
}
