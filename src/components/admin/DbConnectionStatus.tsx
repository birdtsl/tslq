import { Database } from "lucide-react";

import { dbTypeLabel } from "@/lib/db/config";
import { checkDbHealth } from "@/lib/db/health";

export default async function DbConnectionStatus() {
  const dbHealth = await checkDbHealth();

  if (!dbHealth) {
    return (
      <div
        className="hidden items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 sm:flex"
        title="ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
        <Database className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">ยังไม่เชื่อมต่อ DB</span>
      </div>
    );
  }

  const { type, online } = dbHealth;

  return (
    <div
      className={`hidden items-center gap-2 rounded-full px-3 py-1.5 sm:flex ${
        online ? "bg-emerald-500/10" : "bg-red-500/10"
      }`}
      title={`HosXP ${dbTypeLabel(type)} — ${online ? "เชื่อมต่อแล้ว" : "เชื่อมต่อไม่สำเร็จ"}`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          online ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      <Database
        className={`h-3.5 w-3.5 ${
          online ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        }`}
        strokeWidth={2}
      />
      <span
        className={`text-xs font-medium ${
          online ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
        }`}
      >
        {online ? "เชื่อมต่อ DB" : "DB ไม่พร้อม"}
      </span>
      <span className="text-xs text-muted">({dbTypeLabel(type)})</span>
    </div>
  );
}
