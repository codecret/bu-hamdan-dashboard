/**
 * Shared bits for the legal pages.
 *
 * SUPPORT_EMAIL must be a real, monitored mailbox: Apple checks that the
 * support and privacy contacts on an App Store listing actually reach someone,
 * and a bounce here is a rejection.
 */
export const SUPPORT_EMAIL = "support@bohamdan.cloud";

/** Update when the text materially changes — users are told to check it. */
export const LAST_UPDATED = "٨ أغسطس ٢٠٢٦";

export function PageTitle({ title }: { title: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-[#002B70]">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">آخر تحديث: {LAST_UPDATED}</p>
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold text-neutral-900">{heading}</h2>
      <div className="space-y-3 leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-2 text-neutral-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
