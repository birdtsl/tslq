---
name: hosxp-dashboard
description: >-
  Build HosXP hospital admin dashboard with Next.js App Router, Tailwind CSS v4,
  and MySQL/PostgreSQL (HosXP). Use when creating admin pages, dashboard widgets,
  hospital UI, database queries, patient/appointment/reports features, Thai date
  formatting, DB health checks, or any work in this hosxp-admin project.
---

# HosXP Dashboard Skill

## Stack (ห้ามเปลี่ยนโดยไม่จำเป็น)

| Layer | ใช้ |
|-------|-----|
| Framework | Next.js 16 App Router + React 19 |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"`) |
| Font | Sarabun (Thai) via `next/font/google` |
| DB1 | MySQL — `mysql2/promise` → `queryMysql()` |
| DB2 | PostgreSQL — `pg` → `queryPostgres()` |
| Language | UI ภาษาไทย, code ภาษาอังกฤษ |

**Next.js**: อ่าน guide ใน `node_modules/next/dist/docs/` ก่อนเขียนโค้ด — API อาจต่างจาก training data

## โครงสร้างโปรเจ็กต์

```
src/
├── app/(admin)/          # หน้า admin ทั้งหมด (route group)
│   ├── layout.tsx        # Sidebar + Header + main
│   ├── page.tsx          # แดชบอร์ดหลัก /
│   ├── patients/         # /patients
│   ├── appointments/     # /appointments
│   ├── reports/          # /reports
│   └── settings/         # /settings
├── app/api/              # Route Handlers (ถ้าต้อง client fetch)
├── components/admin/     # Sidebar, Header, PlaceholderPage, client UI
└── lib/
    ├── db/
    │   ├── config.ts     # env DB1_* / DB2_*
    │   ├── mysql.ts      # getMysqlPool, queryMysql
    │   ├── postgres.ts   # getPostgresPool, queryPostgres
    │   └── health.ts     # checkDbHealth, checkMysqlHealth
    └── format.ts         # formatPatientName, formatThaiDate, formatSex
```

## Workflow สร้างหน้าใหม่

1. สร้าง `src/app/(admin)/<route>/page.tsx`
2. ถ้าต้อง query DB → Server Component + `queryMysql` / `queryPostgres`
3. Client interaction (search, filter, modal) → แยก `"use client"` ใน `src/components/admin/`
4. Logic ซ้ำหลายหน้า → แยก `src/lib/queries/<name>.ts`
5. เพิ่ม nav item ใน `Sidebar.tsx`
6. Format ข้อมูลด้วย `src/lib/format.ts` — ห้ามเขียน formatter ใหม่

## Naming Conventions

| ประเภท | Pattern | ตัวอย่าง |
|--------|---------|---------|
| Page | `<Feature>Page` | `PatientsPage` |
| Client component | `<Feature><Part>` | `PatientSearch` |
| Query helper | `get<Thing>` / `search<Thing>` | `getTodayAppointments` |
| Type | `<Thing>Row` สำหรับ DB result | `PatientRow` |
| API route | `src/app/api/<resource>/route.ts` | `/api/patients` |

## UI / Tailwind Conventions

### สีและ theme

ใช้ CSS variables ใน `globals.css` เท่านั้น:

- `primary-50` … `primary-900` — สีหลัก (น้ำเงิน)
- `slate-*` — ข้อความรอง, border
- `emerald-*` — สำเร็จ / positive
- `amber-*` — รอดำเนินการ / warning
- `red-*` — ผิดพลาด / negative

### Layout patterns

```tsx
// หน้าปกติ
<div className="space-y-6">{/* content */}</div>

// Page header
<div className="flex flex-wrap items-center justify-between gap-4">
  <h2 className="text-lg font-semibold text-primary-900">หัวข้อ</h2>
  {/* actions */}
</div>

// Stat cards
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">...</div>
</div>

// Panel / card
<div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">...</div>

// Table container
<div className="overflow-hidden rounded-xl border border-primary-100 bg-white shadow-sm">
  <table className="w-full text-sm">...</table>
</div>

// Placeholder
import PlaceholderPage from "@/components/admin/PlaceholderPage";
```

### กฎ UI

- ห้ามติดตั้ง UI library ใหม่ — ใช้ Tailwind ล้วน
- ห้ามเปลี่ยน Sidebar/Header structure โดยไม่จำเป็น
- ข้อความ UI ภาษาไทย, `lang="th"` อยู่แล้ว
- Responsive: mobile-first (`sm:`, `lg:`, `xl:`)
- Icon: emoji ใน nav หรือ inline SVG (ดู Header.tsx)
- ตาราง: `thead bg-primary-50`, row hover `hover:bg-primary-50/50`
- รายละเอียด UI → [ui-patterns.md](ui-patterns.md)

## Database Layer

### เลือก DB

| DB | Env prefix | Function | ใช้เมื่อ |
|----|-----------|----------|---------|
| DB1 MySQL | `DB1_*` | `queryMysql()` | HosXP primary — ผู้ป่วย, visit, นัดหมาย |
| DB2 PostgreSQL | `DB2_*` | `queryPostgres()` | HosXP secondary / analytics |

**Default**: clinical data → MySQL (DB1) ก่อนเสมอ

### Query pattern

```tsx
import { queryMysql } from "@/lib/db/mysql";
import { formatPatientName, formatThaiDate } from "@/lib/format";

type PatientRow = { hn: string; pname: string; fname: string; lname: string; birthday: string | null };

export default async function PatientsPage() {
  const patients = await queryMysql<PatientRow>(
    "SELECT hn, pname, fname, lname, birthday FROM patient ORDER BY hn DESC LIMIT 50",
  );
  // formatPatientName(p), formatThaiDate(p.birthday)
}
```

### กฎ DB

- **Parameterized queries เท่านั้น** — MySQL ใช้ `?`, PostgreSQL ใช้ `$1, $2`
- Query ใน Server Component หรือ Route Handler — ห้าม expose credentials ฝั่ง client
- Reuse `src/lib/db/*` — ห้ามสร้าง connection pool ใหม่
- Env: copy จาก `.env.example` → `.env.local`
- HosXP วันที่มักเป็น `YYYY-MM-DD` (ค.ศ.) — แสดงผลด้วย `formatThaiDate()`
- Schema ไม่แน่ใจ → อ่าน [reference.md](reference.md)
- OPD / ผู้ป่วยนอก ละเอียด → [hosxp-opd-tables](../hosxp-opd-tables/SKILL.md)

### Error handling

```tsx
let data: PatientRow[] = [];
let error: string | null = null;

try {
  data = await queryMysql<PatientRow>("SELECT ...", [param]);
} catch {
  error = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้";
}

// UI: error → text-red-600, empty → text-slate-500 "ไม่พบข้อมูล"
```

### DB health (แดชบอร์ด)

```tsx
import { checkDbHealth } from "@/lib/db/health";

const { mysql, postgres } = await checkDbHealth();
// badge: emerald = online, red = offline
```

## Dashboard Widgets

แดชบอร์ดหลัก (`page.tsx`):

1. **Stat cards** — OPD วันนี้, IPD admit, นัดหมาย, เตียงว่าง
2. **Chart** — CSS bar chart หรือ query รายสัปดาห์จาก `ovst`
3. **DB status** — `checkDbHealth()` แทน hardcode
4. **Activity feed** — ovst/oapp ล่าสุด

Query stat มาตรฐาน → ดู [reference.md](reference.md#dashboard-queries)

## Search & Filter

| วิธี | เมื่อไหร่ |
|------|----------|
| Server + URL params | filter ง่าย, SEO, refresh ได้ |
| Client + `/api/*` | live search, debounce |

```tsx
// Server: /patients?q=680001234
const q = searchParams.q ?? "";
await queryMysql("... WHERE hn LIKE ? OR fname LIKE ?", [`%${q}%`, `%${q}%`]);
```

## Prompt Templates (สำหรับ user)

ใช้ prompt แบบนี้เพื่อให้ agent ทำงานสอดคล้องกัน:

```
ทำหน้า [ชื่อ] ตาม hosxp-dashboard skill
- ดึงข้อมูลจาก [ตาราง HosXP]
- แสดงเป็น [table/card/chart]
- มี [search/filter/export]
```

## Checklist ก่อนส่งงาน

- [ ] ใช้ `@/` import
- [ ] UI ตรง convention (rounded-xl, primary-*, shadow-sm)
- [ ] ใช้ `format.ts` สำหรับชื่อ/วันที่/เพศ
- [ ] SQL parameterized, ไม่มี secret ใน code
- [ ] Server/Client boundary ถูกต้อง
- [ ] Error + empty state ครบ
- [ ] ข้อความ UI ภาษาไทย

## เอกสารเพิ่มเติม

- HosXP tables & dashboard queries → [reference.md](reference.md)
- HosXP OPD tables (ovst, ovstdiag, opitemrece ฯลฯ) → [hosxp-opd-tables](../hosxp-opd-tables/SKILL.md)
- UI components ละเอียด → [ui-patterns.md](ui-patterns.md)
- ตัวอย่างหน้าเต็ม → [examples.md](examples.md)
