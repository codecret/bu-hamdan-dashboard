import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="text-lg text-muted-foreground">Page not found</p>
        <Link href="/admin/dashboard" className="inline-block px-6 py-2 bg-[#002B70] text-white rounded-md hover:bg-[#001a45] transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
