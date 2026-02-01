import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { FinancialProfileGuard } from "@/components/layout/financial-profile-guard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FinancialProfileGuard>
      <div className="flex min-h-screen flex-col md:flex-row bg-[#16110a]">
        <DesktopSidebar />
        <main className="flex-1 pb-24 md:pb-0">
          <div className="max-w-7xl mx-auto px-6 pt-8 md:pt-8 md:px-8">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </FinancialProfileGuard>
  );
}
