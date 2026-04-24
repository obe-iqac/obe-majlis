// app/super_admin/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    redirect("/");
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/verify-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      cache: "no-store",
    },
  ).catch(() => null);

  if (!res?.ok) {
    redirect("/");
  }

  const data = await res.json().catch(() => null);

  if (!data || data.role !== "COLLEGE_ADMIN") {
    redirect("/");
  }

  return <>{children}</>;
}
