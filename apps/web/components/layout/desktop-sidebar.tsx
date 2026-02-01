"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/nav";
import { Button } from "@/components/ui/button";
import { LogOut, Leaf } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const mindfulTips = [
  "Small shifts lead to big transformations.",
  "Mindful spending is self-care.",
  "Every dollar has a purpose.",
  "Peace comes from clarity.",
  "Your future self will thank you.",
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Logged out successfully");
            router.push("/login");
          },
        },
      });
    } catch {
      toast.error("Failed to log out");
    }
  };

  const randomTip = mindfulTips[Math.floor(Math.random() * mindfulTips.length)];
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "Guest";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="hidden md:flex w-24 lg:w-64 border-r border-[#2d2420] bg-[#16110a] sticky top-0 h-screen flex-col items-center lg:items-start py-8 px-4 gap-12 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-xl warm-gradient flex items-center justify-center text-white shadow-lg shadow-[#c97a5a33]">
          <Leaf className="h-5 w-5" />
        </div>
        <span className="hidden lg:block font-bold text-xl tracking-tight text-[#f5f2ed]">
          Intent
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group",
                isActive
                  ? "bg-[#1f1815] text-[#c97a5a]"
                  : "text-[#a89580] hover:bg-[#1f1815] hover:text-[#f5f2ed]",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto w-full px-2 space-y-6">
        {/* Mindful Tip */}
        <div className="p-4 rounded-2xl bg-[#1f1815] border border-[#2d2420] text-center hidden lg:block">
          <p className="text-xs text-[#a89580] mb-2 uppercase tracking-wider">Mindful Tip</p>
          <p className="text-sm italic text-[#d4a574]">&ldquo;{randomTip}&rdquo;</p>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#c97a5a]/20 border-2 border-[#2d2420] flex items-center justify-center text-[#c97a5a] font-semibold">
            {userInitial}
          </div>
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#f5f2ed] truncate">{userName}</p>
            <p className="text-xs text-[#a89580]">Zen Level 12</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[#a89580] hover:text-[#c45c4a] hover:bg-[#1f1815] rounded-2xl hidden lg:flex"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
