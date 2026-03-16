"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Tag } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { FinancialProfileSheet } from "@/components/financial-profile-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FinancialProfile } from "@/types";

type ProfilePageProps = {
  user: { name: string; email: string; image?: string | null; createdAt?: string };
  profile: FinancialProfile;
};

export function ProfilePage({ user, profile }: ProfilePageProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.createdAt && (
              <p className="text-xs text-muted-foreground">
                Member since {format(new Date(user.createdAt), "MMM yyyy")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Financial profile</p>
              <p className="text-xs text-muted-foreground">
                Income target and allocation split
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
              Edit
            </Button>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Monthly income</span>
              <span className="text-foreground">${profile.monthlyIncomeTarget}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Needs</span>
              <span className="text-foreground">{profile.needsPercentage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Wants</span>
              <span className="text-foreground">{profile.wantsPercentage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Future</span>
              <span className="text-foreground">{profile.futurePercentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Settings className="h-4 w-4" />
            Navigation
          </div>
          <Separator />
          <div className="grid gap-3">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => router.push("/categories")}
              aria-label="Go to categories"
            >
              <Tag className="h-4 w-4" />
              Categories
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => router.push("/insights")}
              aria-label="Go to insights"
            >
              <Settings className="h-4 w-4" />
              Insights
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full"
        onClick={() => setLogoutOpen(true)}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </Button>

      <p className="text-center text-xs text-muted-foreground">Intent v1.0</p>

      <FinancialProfileSheet profile={profile} open={sheetOpen} onOpenChange={setSheetOpen} />

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              You will need to sign in again to access your data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
