import Link from "next/link";
import Image from "next/image";

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
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/terms" className="flex items-center gap-3">
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
          <nav className="flex gap-4 text-sm">
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
          © {new Date().getFullYear()} بوحمدان — جميع الحقوق محفوظة
        </div>
      </footer>
    </div>
  );
}
