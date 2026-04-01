"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/admin-api";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authApi.login(email, password);

      const user = data.user;
      const token = data.token;

      if (!user || !token) {
        setError("Unexpected response from server.");
        return;
      }

      if (!user.role || (user.role !== "admin" && user.role !== "superadmin")) {
        setError("Access denied. Admin privileges required.");
        return;
      }

      login(user, token);
      router.replace("/admin/dashboard");
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message
      ) {
        setError(
          (err as { response: { data: { message: string } } }).response.data
            .message,
        );
      } else {
        setError("Unable to connect. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#002B70] items-center justify-center">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 h-64 w-64 -translate-y-1/2 rounded-full bg-white/[0.03]" />

        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          <Image
            src="/logo-transparent.png"
            alt="Bu Hamdan"
            width={220}
            height={220}
            className="drop-shadow-2xl"
            priority
          />
          <div className="mt-6 space-y-3">
            <p className="text-lg text-white/70 max-w-sm leading-relaxed">
              Vehicle marketplace administration portal
            </p>
          </div>

          {/* Decorative line */}
          <div className="mt-10 flex items-center gap-3">
            <div className="h-px w-12 bg-white/20" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <div className="h-px w-12 bg-white/20" />
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-gradient-to-b from-gray-50 to-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <Image
              src="/logo-transparent.png"
              alt="Bu Hamdan"
              width={100}
              height={100}
              priority
            />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#002B70]">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your admin account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@buhamdan.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11 pl-10 bg-white border-gray-200 focus-visible:ring-[#002B70]/20 focus-visible:border-[#002B70]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 pl-10 pr-10 bg-white border-gray-200 focus-visible:ring-[#002B70]/20 focus-visible:border-[#002B70]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-[#002B70] hover:bg-[#001d4f] text-white font-medium transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Bu Hamdan Admin Panel &middot; Authorized access only
          </p>
        </div>
      </div>
    </div>
  );
}
