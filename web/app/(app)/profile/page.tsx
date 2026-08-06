import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getFinancialProfile } from "@/lib/queries/financial-profile";
import { ProfilePage } from "@/components/profile-page";

export default async function ProfileRoute() {
  const [session, profile, t] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getFinancialProfile(),
    getTranslations("profile"),
  ]);

  if (!session?.user || !profile) {
    return null;
  }

  return (
    <ProfilePage
      user={{
        name: session.user.name ?? t("fallbackName"),
        email: session.user.email ?? "",
        image: session.user.image,
        createdAt: session.user.createdAt?.toString(),
      }}
      profile={profile}
    />
  );
}
