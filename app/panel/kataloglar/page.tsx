import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PanelLayout } from "@/components/PanelLayout";
import { KataloglarClient } from "./KataloglarClient";
import { isOperationRole } from "@/lib/roles";

export default async function PanelKataloglarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const role = (session.user as { role?: string })?.role ?? "CONSULTANT";
  if (role === "ADMIN") redirect("/admin/kurumlar");
  if (role === "STUDENT") redirect("/dashboard");
  if (!isOperationRole(role) && role !== "CONSULTANT") redirect("/");

  return (
    <PanelLayout
      title="Dil kursu katalogları"
      subtitle="Dil kursları ile ilgili güncel katalog ve iletişim bilgileri"
    >
      <div className="mt-6 max-w-3xl">
        <KataloglarClient />
      </div>
    </PanelLayout>
  );
}
