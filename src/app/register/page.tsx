import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { authDestination } from "@/lib/auth.config";
import { AuthForm } from "@/components/auth-form";

export default async function RegisterPage({ searchParams }: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const returnUrl = authDestination("attendee", params.redirect);
  const session = await auth();
  if (session?.user?.id) redirect(authDestination(session.user.role, params.redirect));
  return <AuthForm mode="register" returnUrl={returnUrl === "/tickets" ? undefined : returnUrl} preview={process.env.VERCEL_ENV === "preview"} />;
}
