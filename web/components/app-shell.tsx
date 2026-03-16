import { BottomNav } from "./bottom-nav";
import { SideNav } from "./side-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SideNav />
      <main className="lg:pl-60">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-24 lg:pb-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
