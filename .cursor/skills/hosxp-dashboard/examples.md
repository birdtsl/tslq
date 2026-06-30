# HosXP Dashboard Examples

## ตัวอย่าง: หน้ารายชื่อผู้ป่วย (Server Component + MySQL)

```tsx
// src/app/(admin)/patients/page.tsx
import { queryMysql } from "@/lib/db/mysql";
import { formatPatientName, formatThaiDate } from "@/lib/format";

type PatientRow = {
  hn: string;
  pname: string;
  fname: string;
  lname: string;
  birthday: string | null;
};

export default async function PatientsPage() {
  let patients: PatientRow[] = [];
  let error: string | null = null;

  try {
    patients = await queryMysql<PatientRow>(
      "SELECT hn, pname, fname, lname, birthday FROM patient ORDER BY hn DESC LIMIT 50",
    );
  } catch {
    error = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary-900">รายชื่อผู้ป่วย</h2>
        <input
          type="search"
          placeholder="ค้นหา HN, ชื่อ..."
          className="w-64 rounded-lg border border-primary-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-primary-100 bg-white shadow-sm">
        {error ? (
          <p className="py-12 text-center text-sm text-red-600">{error}</p>
        ) : patients.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">ไม่พบข้อมูล</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-primary-50 text-left text-primary-900">
              <tr>
                <th className="px-4 py-3 font-medium">HN</th>
                <th className="px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3 font-medium">วันเกิด</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.hn} className="border-t border-slate-100 hover:bg-primary-50/50">
                  <td className="px-4 py-3 font-medium text-primary-700">{p.hn}</td>
                  <td className="px-4 py-3 text-slate-700">{formatPatientName(p)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatThaiDate(p.birthday)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

## ตัวอย่าง: ค้นหาผู้ป่วยด้วย URL params

```tsx
// src/app/(admin)/patients/page.tsx
type Props = { searchParams: Promise<{ q?: string }> };

export default async function PatientsPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const term = `%${q.trim()}%`;

  const patients = q.trim()
    ? await queryMysql<PatientRow>(
        "SELECT hn, pname, fname, lname, birthday FROM patient WHERE hn LIKE ? OR fname LIKE ? OR lname LIKE ? ORDER BY hn DESC LIMIT 50",
        [term, term, term],
      )
    : await queryMysql<PatientRow>(
        "SELECT hn, pname, fname, lname, birthday FROM patient ORDER BY hn DESC LIMIT 50",
      );
  // ...
}
```

## ตัวอย่าง: แดชบอร์ด + DB health จริง

```tsx
// src/app/(admin)/page.tsx
import { queryMysql } from "@/lib/db/mysql";
import { checkDbHealth } from "@/lib/db/health";

async function getStats() {
  try {
    const [opd] = await queryMysql<{ count: number }>(
      "SELECT COUNT(*) AS count FROM ovst WHERE vstdate = CURDATE()",
    );
    const [ipd] = await queryMysql<{ count: number }>(
      "SELECT COUNT(*) AS count FROM ipt WHERE dchdate IS NULL",
    );
    const [appt] = await queryMysql<{ count: number }>(
      "SELECT COUNT(*) AS count FROM oapp WHERE nextdate = CURDATE()",
    );
    return {
      opdToday: opd?.count ?? 0,
      ipdAdmitted: ipd?.count ?? 0,
      appointments: appt?.count ?? 0,
    };
  } catch {
    return null; // fallback mock data
  }
}

export default async function DashboardPage() {
  const [stats, dbHealth] = await Promise.all([getStats(), checkDbHealth()]);

  const cards = stats
    ? [
        { label: "ผู้ป่วยวันนี้", value: String(stats.opdToday) },
        { label: "ผู้ป่วยใน", value: String(stats.ipdAdmitted) },
        { label: "นัดหมาย", value: String(stats.appointments) },
      ]
    : [/* mock fallback */];

  // dbHealth.mysql / dbHealth.postgres → badge สี emerald/red
}
```

## ตัวอย่าง: Query helper แยกไฟล์

```tsx
// src/lib/queries/appointments.ts
import { queryMysql } from "@/lib/db/mysql";

export type AppointmentRow = {
  hn: string;
  nexttime: string;
  fname: string;
  lname: string;
  clinic: string;
};

export async function getTodayAppointments() {
  return queryMysql<AppointmentRow>(
    `SELECT a.hn, a.nexttime, p.fname, p.lname, a.clinic
     FROM oapp a
     JOIN patient p ON p.hn = a.hn
     WHERE a.nextdate = CURDATE()
     ORDER BY a.nexttime`,
  );
}
```

## ตัวอย่าง: นัดหมายวันนี้

```tsx
import { getTodayAppointments } from "@/lib/queries/appointments";
import { formatPatientName, formatTime } from "@/lib/format";

export default async function AppointmentsPage() {
  let appointments = [];
  let error: string | null = null;

  try {
    appointments = await getTodayAppointments();
  } catch {
    error = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้";
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-primary-900">
        นัดหมายวันนี้ ({appointments.length})
      </h2>
      {/* table with formatPatientName, formatTime */}
    </div>
  );
}
```

## ตัวอย่าง: API Route สำหรับ client search

```tsx
// src/app/api/patients/route.ts
import { NextResponse } from "next/server";
import { queryMysql } from "@/lib/db/mysql";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json([]);
  }

  const rows = await queryMysql(
    "SELECT hn, pname, fname, lname FROM patient WHERE hn LIKE ? OR fname LIKE ? LIMIT 20",
    [`%${q}%`, `%${q}%`],
  );

  return NextResponse.json(rows);
}
```

## ตัวอย่าง: PostgreSQL query

```tsx
import { queryPostgres } from "@/lib/db/postgres";

const rows = await queryPostgres<{ hn: string; fname: string }>(
  "SELECT hn, fname FROM patient WHERE hn = $1",
  ["680001234"],
);
```

## ตัวอย่าง: หน้ารายงาน (reports)

```tsx
// src/app/(admin)/reports/page.tsx
import { queryMysql } from "@/lib/db/mysql";

type DailyReport = { day: string; count: number };

export default async function ReportsPage() {
  const weekly = await queryMysql<DailyReport>(
    `SELECT DATE(vstdate) AS day, COUNT(*) AS count
     FROM ovst
     WHERE vstdate >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(vstdate)
     ORDER BY day`,
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-primary-900">รายงานผู้ป่วยนอกรายสัปดาห์</h2>
      <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
        {/* bar chart จาก weekly data */}
      </div>
    </div>
  );
}
```

## ตัวอย่าง: เพิ่ม nav item ใหม่

```tsx
// src/components/admin/Sidebar.tsx — เพิ่มใน navItems
{ href: "/wards", label: "วอร์ด", icon: "🏥" },
```

```tsx
// src/app/(admin)/wards/page.tsx
import PlaceholderPage from "@/components/admin/PlaceholderPage";

export default function WardsPage() {
  return <PlaceholderPage title="วอร์ด" />;
}
```
