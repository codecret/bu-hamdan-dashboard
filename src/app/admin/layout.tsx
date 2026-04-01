"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Car,
  BookOpen,
  Building2,
  CreditCard,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Listings", href: "/admin/listings", icon: Car },
  { title: "Catalog", href: "/admin/catalog", icon: BookOpen },
  { title: "Showrooms", href: "/admin/showrooms", icon: Building2 },
  { title: "Transactions", href: "/admin/transactions", icon: CreditCard },
];

function getPageTitle(pathname: string) {
  const item = navItems.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );
  return item?.title || "Dashboard";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hydrate, logout } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    if (user && user.role !== "admin" && user.role !== "superadmin") {
      router.replace("/auth/login");
    }
  }, [hydrated, isAuthenticated, user, router]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full border-2 border-[#002B70]/20 animate-ping" style={{ animationDuration: "1.5s" }} />
            <svg className="absolute inset-[-8px] animate-spin" style={{ animationDuration: "1.2s" }} viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="#002B70" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="140 80" opacity="0.6" />
            </svg>
            <Image
              src="/logo-transparent.png"
              alt="Bu Hamdan"
              width={56}
              height={56}
              className="rounded-full animate-pulse"
              style={{ animationDuration: "2s" }}
              priority
            />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-sm font-semibold text-[#002B70] tracking-wide">Bu Hamdan</span>
            <div className="flex items-center gap-1">
              <div className="h-1 w-1 rounded-full bg-[#002B70]/40 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1s" }} />
              <div className="h-1 w-1 rounded-full bg-[#002B70]/40 animate-bounce" style={{ animationDelay: "150ms", animationDuration: "1s" }} />
              <div className="h-1 w-1 rounded-full bg-[#002B70]/40 animate-bounce" style={{ animationDelay: "300ms", animationDuration: "1s" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user && user.role !== "admin" && user.role !== "superadmin") {
    return null;
  }

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  const handleLogout = () => {
    logout();
    router.replace("/auth/login");
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <SidebarProvider>
      <Sidebar>
        {/* ── Sidebar Header ── */}
        <SidebarHeader className="!p-0 border-b border-white/10 bg-[#002B70]">
          <div className="flex items-center gap-3 px-5 py-5">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-white/10 blur-sm" />
              <Image
                src="/logo-transparent.png"
                alt="Bu Hamdan"
                width={38}
                height={38}
                className="relative rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-white tracking-tight">
                Bu Hamdan
              </span>
              <span className="text-[11px] text-white/50 font-medium tracking-wider uppercase">
                Admin
              </span>
            </div>
          </div>
        </SidebarHeader>

        {/* ── Nav Items ── */}
        <SidebarContent className="bg-[#002B70] pt-2">
          <SidebarGroup className="!px-3 !py-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.href} className="relative">
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-white z-10" />
                      )}
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "rounded-lg px-3 py-2.5 text-[13px] text-white/60 transition-all duration-150",
                          "hover:bg-white/8 hover:text-white",
                          isActive &&
                            "bg-white/12 text-white font-semibold shadow-sm shadow-black/10",
                        )}
                        render={<Link href={item.href} />}
                      >
                        <item.icon
                          className={cn(
                            "size-[18px] shrink-0 transition-colors",
                            isActive ? "text-white" : "text-white/50",
                          )}
                        />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ── Sidebar Footer ── */}
        <SidebarFooter className="!p-3 border-t border-white/10 bg-[#002B70]">
          <div className="flex items-center gap-3 rounded-lg bg-white/8 px-3 py-2.5">
            <Avatar className="h-9 w-9 ring-2 ring-white/15">
              {user?.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              )}
              <AvatarFallback className="bg-white/20 text-[11px] font-semibold text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-[13px] font-semibold text-white">
                {user?.name}
              </span>
              <span className="truncate text-[11px] text-white/45 capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* ── Main Content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── Top Navbar ── */}
        <header className="flex h-16 shrink-0 items-center border-b bg-white px-6">
          {/* Left: Toggle + Page title */}
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-gray-500 hover:text-[#002B70]" />
            <div className="hidden h-6 w-px bg-gray-200 md:block" />
            <div className="hidden md:flex flex-col">
              <h1 className="text-[15px] font-bold text-gray-900">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100">
                <Avatar className="h-8 w-8 ring-1 ring-gray-200">
                  {user?.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  )}
                  <AvatarFallback className="bg-[#002B70] text-[11px] font-semibold text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-[13px] font-semibold text-gray-900">
                    {user?.name}
                  </span>
                  <span className="text-[11px] text-gray-400 capitalize">
                    {user?.role}
                  </span>
                </div>
                <ChevronDown className="hidden md:block size-3.5 text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3 py-1">
                      <Avatar className="h-10 w-10">
                        {user?.avatarUrl && (
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                        )}
                        <AvatarFallback className="bg-[#002B70] text-xs font-semibold text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{user?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-auto bg-gray-50/80">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
