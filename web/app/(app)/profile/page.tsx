import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getFinancialProfile } from "@/lib/queries/financial-profile";
import { ProfilePage } from "@/components/profile-page";

export default async function ProfileRoute() {
  const session = await auth.api.getSession({ headers: await headers() });
  const profile = await getFinancialProfile();

  if (!session?.user || !profile) {
    return null;
  }

  return (
    <ProfilePage
      user={{
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        image: session.user.image,
        createdAt: session.user.createdAt?.toString(),
      }}
      profile={profile}
    />
  );
}
