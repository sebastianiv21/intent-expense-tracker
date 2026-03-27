import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getAuthenticatedUser(): Promise<{ userId: string; name: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return { userId: session.user.id, name: session.user.name ?? "" };
}
