import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, PageTitle, Section, SUPPORT_EMAIL } from "../_shared";

export const metadata: Metadata = {
  title: "حذف حساب بوحمدان | Delete your Bu Hamdan account",
  description: "طلب حذف حساب بوحمدان والبيانات المرتبطة به، من التطبيق أو عبر الدعم.",
  alternates: { canonical: "https://app.bohamdan.cloud/delete-account" },
  robots: { index: true, follow: true },
};

export default function DeleteAccountPage() {
  const requestLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Bu Hamdan account deletion request")}`;
  return (
    <article>
      <PageTitle title="حذف حساب بوحمدان" />
      <Section heading="الحذف من التطبيق">
        <p>افتح بوحمدان ← حسابي ← الإعدادات ← حذف الحساب. أدخل كلمة المرور وأكّد الحذف. هذا الإجراء نهائي ولا يمكن التراجع عنه.</p>
      </Section>
      <Section heading="طلب الحذف بدون التطبيق">
        <p>إذا لم يعد التطبيق متاحاً لديك، أرسل طلباً من البريد الإلكتروني المسجّل في حسابك إلى الدعم. اذكر رغبتك في حذف حساب بوحمدان والبيانات المرتبطة به. سنتحقق من ملكية الحساب قبل تنفيذ الطلب.</p>
        <a href={requestLink} className="inline-flex rounded-xl bg-[#002B70] px-5 py-3 font-semibold text-white">طلب حذف الحساب عبر البريد</a>
        <p><span dir="ltr">{SUPPORT_EMAIL}</span> — لا ترسل كلمة المرور أو رموز التحقق.</p>
      </Section>
      <Section heading="البيانات التي تُحذف">
        <Bullets items={[
          "تُحذف الإعلانات والرسائل والمحادثات والمفضّلات وملف المعرض والبيانات المرتبطة بالحساب.",
          "تُزال بيانات الملف الشخصي وتُخفى هوية سجل الحساب المتبقي.",
          "تُحذف الصور والفيديوهات والملفات المرفوعة من حسابك تلقائياً، مع إعادة المحاولة عند تعذّر الوصول إلى التخزين.",
          "قد تبقى سجلات مالية أو بيانات يجب الاحتفاظ بها وفق المتطلبات القانونية والمحاسبية. راجع سياسة الخصوصية لمزيد من التفاصيل.",
        ]} />
        <Link className="text-[#002B70] underline" href="/privacy">سياسة الخصوصية</Link>
      </Section>
      <Section heading="Delete your Bu Hamdan account">
        <div dir="ltr" lang="en">
          <p>In the app, open Profile → Settings → Delete account, enter your password and confirm. Deletion is permanent.</p>
          <p className="mt-3">Without the app, email <a className="text-[#002B70] underline" href={requestLink}>{SUPPORT_EMAIL}</a> from your registered email address to request account and associated data deletion. We verify account ownership before processing. Never send your password or verification codes.</p>
          <p className="mt-3">Listings, conversations, messages, favorites and business profiles are deleted. Personal account details are anonymized. Uploaded photos, videos and files are removed automatically, with retries during storage outages. Financial records required by law or accounting obligations may be retained.</p>
        </div>
      </Section>
    </article>
  );
}
