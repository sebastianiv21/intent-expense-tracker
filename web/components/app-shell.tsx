import { BottomNav } from "./bottom-nav";
import { SideNav } from "./side-nav";
import { TransactionSheetProvider } from "./transaction-sheet-context";
import { TransactionSheet } from "./transaction-sheet";
import type { Category } from "@/types";

export function AppShell({ children, categories }: { children: React.ReactNode; categories: Category[] }) {
  return (
    <TransactionSheetProvider>
      <div className="min-h-screen bg-background">
        <SideNav />
        <main className="lg:pl-60">
          <div className="max-w-3xl mx-auto px-4 pt-6 pb-24 lg:pb-6 md:max-w-[720px] xl:max-w-[1200px]">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
      <TransactionSheet categories={categories} />
    </TransactionSheetProvider>
  );
}
