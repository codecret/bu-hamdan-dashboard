"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" onClick={() => window.location.href = "/admin/dashboard"}>Go to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
