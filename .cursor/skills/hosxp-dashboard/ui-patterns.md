# UI Patterns — HosXP Dashboard

## Page Header + Actions

```tsx
<div className="flex flex-wrap items-center justify-between gap-4">
  <div>
    <h2 className="text-lg font-semibold text-primary-900">รายชื่อผู้ป่วย</h2>
    <p className="text-sm text-slate-500">ทั้งหมด {total} ราย</p>
  </div>
  <div className="flex gap-2">
    <button type="button" className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50">
      ส่งออก
    </button>
    <button type="button" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
      เพิ่มใหม่
    </button>
  </div>
</div>
```

## Stat Card

```tsx
<div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <p className="text-sm text-slate-500">{label}</p>
    <div className="h-2 w-2 rounded-full bg-primary-500" />
  </div>
  <p className="mt-2 text-3xl font-bold text-primary-900">{value}</p>
  <p className="mt-1 text-xs text-emerald-600">{change} จากเมื่อวาน</p>
</div>
```

## Data Table

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead className="bg-primary-50 text-left text-primary-900">
      <tr>
        <th className="px-4 py-3 font-medium">HN</th>
        <th className="px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
        <th className="px-4 py-3 font-medium text-right">จัดการ</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.id} className="border-t border-slate-100 hover:bg-primary-50/50">
          <td className="px-4 py-3 font-medium text-primary-700">{row.hn}</td>
          <td className="px-4 py-3 text-slate-700">{row.name}</td>
          <td className="px-4 py-3 text-right">
            <button type="button" className="text-sm text-primary-600 hover:text-primary-800">
              ดูรายละเอียด
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

## Status Badges

```tsx
// online / success
<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">พร้อมใช้งาน</span>

// pending / warning
<span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">รอดำเนินการ</span>

// error / offline
<span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">ไม่พร้อมใช้งาน</span>

// info
<span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">OPD</span>
```

## Form Controls

```tsx
// Text input
<label className="block text-sm font-medium text-slate-700">
  HN
  <input
    type="text"
    className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
  />
</label>

// Select
<select className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200">
  <option value="">-- เลือกแผนก --</option>
</select>

// Search
<input
  type="search"
  placeholder="ค้นหา HN, ชื่อ..."
  className="w-full max-w-xs rounded-lg border border-primary-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
/>
```

## Buttons

```tsx
// Primary
<button type="button" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
  บันทึก
</button>

// Secondary
<button type="button" className="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50">
  ยกเลิก
</button>

// Ghost / link
<button type="button" className="text-sm text-primary-600 hover:text-primary-800">
  ดูทั้งหมด
</button>
```

## Alert / Error Banner

```tsx
<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
  ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า DB1
</div>

<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
  ข้อมูลแสดงจาก cache — อัปเดตล่าสุด 5 นาทีที่แล้ว
</div>
```

## Loading Skeleton

```tsx
<div className="animate-pulse space-y-3">
  <div className="h-4 w-1/3 rounded bg-primary-100" />
  <div className="h-10 rounded-lg bg-primary-50" />
  <div className="h-10 rounded-lg bg-primary-50" />
</div>
```

## Activity Timeline

```tsx
<div className="divide-y divide-slate-100">
  {items.map((item) => (
    <div key={item.id} className="flex gap-4 py-3">
      <span className="shrink-0 text-sm font-medium text-primary-500">{item.time}</span>
      <span className="text-sm text-slate-600">{item.text}</span>
    </div>
  ))}
</div>
```

## Two-Column Layout

```tsx
<div className="grid gap-6 lg:grid-cols-3">
  <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm lg:col-span-2">
    {/* main content */}
  </div>
  <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-sm">
    {/* sidebar panel */}
  </div>
</div>
```

## DB Status Panel

```tsx
<div className="flex items-center justify-between rounded-lg bg-primary-50 px-4 py-3">
  <div>
    <p className="text-sm font-medium text-primary-900">DB1 — MySQL</p>
    <p className="text-xs text-slate-500">HosXP Primary</p>
  </div>
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${online ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
    {online ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน"}
  </span>
</div>
```

## Pagination (simple)

```tsx
<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
  <span>หน้า {page} จาก {totalPages}</span>
  <div className="flex gap-2">
    <button type="button" disabled={page <= 1} className="rounded-lg border border-primary-200 px-3 py-1 disabled:opacity-40">
      ก่อนหน้า
    </button>
    <button type="button" disabled={page >= totalPages} className="rounded-lg border border-primary-200 px-3 py-1 disabled:opacity-40">
      ถัดไป
    </button>
  </div>
</div>
```
