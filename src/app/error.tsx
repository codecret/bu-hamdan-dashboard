"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="text-5xl">⚠</div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
