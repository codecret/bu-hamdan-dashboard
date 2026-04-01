"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
  SidebarGroupLabel,
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
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#002B70] border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
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

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-white/10 px-4 py-5" style={{ backgroundColor: "#002B70" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 font-bold text-white text-sm">
              BH
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Bu Hamdan</span>
              <span className="text-xs text-white/60">Admin Panel</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent style={{ backgroundColor: "#002B70" }}>
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/50 text-xs uppercase tracking-wider px-4">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "mx-2 text-white/70 hover:bg-white/10 hover:text-white",
                          isActive && "bg-white/15 text-white font-medium"
                        )}
                        render={<Link href={item.href} />}
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-white/10 p-3" style={{ backgroundColor: "#002B70" }}>
          <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <Avatar className="h-8 w-8">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="bg-white/20 text-xs text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-medium text-white">{user?.name}</span>
              <span className="truncate text-[10px] text-white/50">{user?.role}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-white px-4">
          <SidebarTrigger className="-ml-1" />

          <div className="h-5 w-px bg-border" />

          <h1 className="text-sm font-semibold text-[#002B70]">Bu Hamdan Admin</h1>

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent transition-colors"
              >
                <Avatar className="h-8 w-8">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                  <AvatarFallback className="bg-[#002B70] text-xs text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block">{user?.name}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.name}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onSelect={handleLogout}
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50/50 p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
