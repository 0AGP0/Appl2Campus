import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DilKursuClient } from "./DilKursuClient";

export default async function DilKursuPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const studentId = (session.user as { studentId?: string }).studentId;
  if (!studentId) redirect("/login");

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Dil Kursu</h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
        Dil kursu bilgileriniz, belgeler ve kayıtlı olduğunuz dil kursunun iletişim bilgileri.
      </p>
      <DilKursuClient studentId={studentId} />
    </div>
  );
}
