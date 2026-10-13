import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft, CarFront, Mail, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { BUSINESS_LEGAL_NAME, PUBLIC_WEBSITE_URL, SUPPORT_EMAIL } from "@/lib/business-info";
import styles from "./home.module.css";

const title = "بوحمدان | سوق السيارات في الكويت والخليج";
const description = "تعرّف على بوحمدان، تطبيق إعلانات السيارات الجديدة والمستعملة والمعارض في الكويت والخليج. النشر مجاني حالياً. معلومات الشركة والدعم وسياسة الخصوصية.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  alternates: { canonical: PUBLIC_WEBSITE_URL },
  openGraph: {
    type: "website", title, description, url: PUBLIC_WEBSITE_URL,
    siteName: "بوحمدان — Bu Hamdan", locale: "ar_KW",
    images: [{ url: `${PUBLIC_WEBSITE_URL}/cars-kuwait.png`, width: 1536, height: 1024, alt: "بوحمدان — سيارات والكويت" }],
  },
};

const features = [
  { number: "01", icon: Search, title: "سيارة على مقاسك", body: "ابحث حسب الماركة والموديل والسعر وسنة الصنع. واحفظ السيارات التي تعجبك في المفضّلة." },
  { number: "02", icon: CarFront, title: "إعلانك بكل تفاصيله", body: "اعرض سيارتك بالصور والفيديو، سواء كنت فرداً أو معرضاً أو وكيلاً. نشر الإعلانات مجاني حالياً." },
  { number: "03", icon: MessageCircle, title: "تواصل مباشر وواضح", body: "تحدّث مع البائع عبر رسائل التطبيق، واستفسر عن التفاصيل قبل المعاينة والاتفاق." },
];

export default function HomePage() {
  return (
    <div className={styles.site} dir="rtl" lang="ar">
      <a href="#main" className={styles.skip}>انتقل إلى المحتوى</a>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <Link href="/" className={styles.brand} aria-label="بوحمدان — الرئيسية">
            <Image src="/logo-transparent.png" alt="" width={64} height={64} priority />
            <span>بوحمدان<small lang="en" dir="ltr">BU HAMDAN</small></span>
          </Link>
          <nav className={styles.navigation} aria-label="القائمة الرئيسية">
            <a href="#about">عن التطبيق</a><a href="#business">معلومات الشركة</a>
            <a href="#contact" className={styles.navContact}>تواصل معنا <ArrowUpLeft size={16} aria-hidden="true" /></a>
          </nav>
        </div>
      </header>
      <main id="main">
        <section className={`${styles.container} ${styles.hero}`} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}><span /> من الكويت، إلى الخليج</span>
            <h1 id="hero-title">سيارتك القادمة،<br /><span>تبدأ من هنا.</span></h1>
            <p className={styles.intro}>الجديدة، المستعملة، والمعارض. بوحمدان يجمع عالم السيارات في مكان واحد، لتبحث وتعرض وتتواصل بسهولة.</p>
            <div className={styles.heroActions}>
              <a href="#about" className={styles.primaryButton}>تعرّف على بوحمدان <ArrowUpLeft size={20} aria-hidden="true" /></a>
              <span className={styles.launchNote}>التطبيق قيد التجهيز للإطلاق<br /><small>على iOS وAndroid</small></span>
            </div>
            <p className={styles.freeNote}><ShieldCheck size={18} aria-hidden="true" /> نشر مجاني حالياً للأفراد والمعارض والوكلاء</p>
          </div>
          <div className={styles.heroVisual}>
            <Image src="/cars-kuwait.png" alt="رسم توضيحي لسيارات أمام معالم الكويت والخليج" width={1536} height={1024} sizes="(max-width: 767px) 100vw, 60vw" priority />
            <span className={styles.visualCaption}>عالم السيارات. أقرب إليك.</span>
          </div>
        </section>
        <div className={styles.regionStrip}><div className={`${styles.container} ${styles.regions}`}>
          <span className={styles.regionLabel}>وجهتنا الخليج</span><span>الكويت</span><span>السعودية</span><span>الإمارات</span><span>قطر</span><span>البحرين</span><span>عُمان</span>
        </div></div>
        <section id="about" className={`${styles.container} ${styles.about}`} aria-labelledby="about-title">
          <div className={styles.sectionHeading}>
            <div><span className={styles.kicker}>تطبيق بوحمدان</span><h2 id="about-title">كل ما تحتاجه،<br />من أول بحث إلى أول رسالة.</h2></div>
            <p>منصة إعلانات سيارات تربط أصحاب السيارات والمعارض بالمشترين. استكشف الخيارات، قارن التفاصيل، ورتّب المعاينة مباشرة مع البائع.</p>
          </div>
          <div className={styles.features}>{features.map(({ number, icon: Icon, title: featureTitle, body }) => (
            <article key={number} className={styles.feature}>
              <div className={styles.featureTop}><span dir="ltr">{number}</span><Icon size={26} strokeWidth={1.5} aria-hidden="true" /></div>
              <h3>{featureTitle}</h3><p>{body}</p>
            </article>
          ))}</div>
        </section>
        <section className={styles.launchSection} aria-labelledby="launch-title">
          <div className={`${styles.container} ${styles.launchInner}`}>
            <div><span className={styles.kicker}>نستعد للانطلاق</span><h2 id="launch-title">مساحة جديدة<br />لسوق السيارات.</h2></div>
            <div className={styles.launchDetails}>
              <p>نعمل على تجهيز بوحمدان للإطلاق في متاجر التطبيقات. ستجد هنا روابط التحميل الرسمية عند توفرها.</p>
              <p>للاستفسارات عن التطبيق أو تسجيل المعارض، يسعدنا تواصلك مع فريق الدعم.</p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.lightButton}>راسل فريق بوحمدان <Mail size={18} aria-hidden="true" /></a>
            </div>
          </div>
        </section>
        <section id="business" className={`${styles.container} ${styles.business}`} aria-labelledby="business-title">
          <div className={styles.businessIntro}><span className={styles.kicker}>من نحن</span><h2 id="business-title">بوحمدان.<br />فكرة كويتية للسيارات.</h2><p>بوحمدان منصة للإعلانات والتواصل. تتم المعاينة والاتفاق والدفع بين البائع والمشتري مباشرة.</p></div>
          <div className={styles.businessDetails}>
            <dl>
              <div><dt>الجهة المشغّلة للتطبيق والموقع</dt><dd>{BUSINESS_LEGAL_NAME}</dd></div>
              <div><dt>بلد النشاط</dt><dd>دولة الكويت</dd></div>
              <div><dt>البريد الإلكتروني للتواصل</dt><dd><a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr">{SUPPORT_EMAIL}</a></dd></div>
            </dl>
            <div className={styles.englishInfo} lang="en" dir="ltr">
              <h3>Business information</h3>
              <p>Bu Hamdan is a vehicle marketplace operated by <bdi lang="ar">{BUSINESS_LEGAL_NAME}</bdi> in Kuwait. This is the public website for the Bu Hamdan app.</p>
              <p><strong>Phone verification:</strong> users request SMS one-time codes in the app to verify their phone number during registration or recover their account. These are service messages, not marketing messages.</p>
            </div>
          </div>
        </section>
        <section id="contact" className={`${styles.container} ${styles.contact}`} aria-labelledby="contact-title">
          <div><span className={styles.kicker}>نحن قريبون</span><h2 id="contact-title">عندك سؤال؟<br />خلّنا نتواصل.</h2><a className={styles.emailLink} href={`mailto:${SUPPORT_EMAIL}`} dir="ltr">{SUPPORT_EMAIL} <ArrowUpLeft size={26} aria-hidden="true" /></a><p>دعم التطبيق، استفسارات المعارض، وطلبات الخصوصية.</p></div>
          <div className={styles.questions}>
            <details><summary>هل نشر الإعلانات مجاني؟</summary><p>نعم، النشر مجاني حالياً للأفراد والمعارض والوكلاء. تخضع الإعلانات للمراجعة قبل ظهورها للعامة.</p></details>
            <details><summary>متى أستطيع تحميل التطبيق؟</summary><p>التطبيق قيد التجهيز للإطلاق. سنضيف روابط iOS وAndroid الرسمية إلى هذا الموقع عند توفر التطبيق في المتاجر.</p></details>
            <details><summary>كيف تُستخدم رسائل التحقق؟</summary><p>تُرسل رموز التحقق عند طلبها داخل التطبيق للتحقق من رقم الهاتف أو استعادة الحساب. لا نستخدمها لإرسال رسائل تسويقية.</p></details>
            <Link href="/help" className={styles.helpLink}>المزيد في مركز المساعدة <ArrowUpLeft size={18} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <footer className={styles.footer}><div className={styles.container}>
        <div className={styles.footerTop}><Link href="/" className={styles.footerBrand}>بوحمدان <span lang="en">Bu Hamdan</span></Link><nav aria-label="روابط السياسات"><Link href="/privacy">سياسة الخصوصية</Link><Link href="/terms">الشروط والأحكام</Link><Link href="/help">المساعدة</Link><Link href="/delete-account">حذف الحساب</Link></nav></div>
        <div className={styles.footerBottom}><p>© {new Date().getFullYear()} بوحمدان · {BUSINESS_LEGAL_NAME}</p><Link href="/auth/login">دخول الإدارة</Link></div>
      </div></footer>
    </div>
  );
}
