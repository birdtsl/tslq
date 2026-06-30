import {
  BedDouble,
  CalendarDays,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import WeeklyOpdChart from "@/components/admin/WeeklyOpdChart";
import { dbTypeLabel } from "@/lib/db/config";
import { checkDbHealth } from "@/lib/db/health";

const stats: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  iconBg: string;
  iconColor: string;
  icon: LucideIcon;
}[] = [
  {
    label: "ผู้ป่วยวันนี้",
    value: "128",
    change: "+12%",
    positive: true,
    iconBg: "bg-primary-500/15",
    iconColor: "text-primary-500",
    icon: Users,
  },
  {
    label: "นัดหมาย",
    value: "45",
    change: "+5%",
    positive: true,
    iconBg: "bg-red-500/15",
    iconColor: "text-red-600 dark:text-red-400",
    icon: CalendarDays,
  },
  {
    label: "เตียงว่าง",
    value: "23",
    change: "-3%",
    positive: false,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-500",
    icon: BedDouble,
  },
  {
    label: "บุคลากร",
    value: "89",
    change: "0%",
    positive: true,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-500",
    icon: Stethoscope,
  },
];

const recentActivities = [
  { time: "09:30", text: "ลงทะเบียนผู้ป่วยใหม่ HN 680001234" },
  { time: "10:15", text: "นัดหมายตรวจผู้ป่วยนอก 15 ราย" },
  { time: "11:00", text: "รายงานสรุปยอดผู้ป่วยประจำวัน" },
  { time: "13:45", text: "อัปเดตข้อมูลเตียง ICU คงเหลือ 3 เตียง" },
];

/** Mock OPD รายวัน — แทนที่ด้วย query ovst เมื่อเชื่อม DB แล้ว */
const weeklyOpd = [
  { day: "จ", label: "จันทร์", count: 98 },
  { day: "อ", label: "อังคาร", count: 112 },
  { day: "พ", label: "พุธ", count: 105 },
  { day: "พฤ", label: "พฤหัส", count: 128 },
  { day: "ศ", label: "ศุกร์", count: 142 },
  { day: "ส", label: "เสาร์", count: 85 },
  { day: "อา", label: "อาทิตย์", count: 52 },
];

const weeklyTotal = weeklyOpd.reduce((sum, d) => sum + d.count, 0);
const weeklyAvg = Math.round(weeklyTotal / weeklyOpd.length);
const weeklyPeak = weeklyOpd.reduce((max, d) => (d.count > max.count ? d : max));
const weeklyChange = "+8.2%";

export default async function DashboardPage() {
  const dbHealth = await checkDbHealth();

  return (
    <div className="space-y-6">
      <div className="horizon-hero relative mt-4 overflow-hidden px-6 pb-8 pt-5 sm:px-10 sm:pb-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-pink-400/20 blur-3xl" />
        <div className="relative max-w-xl">
          <nav className="text-sm text-white/70">
            <span>หน้าหลัก</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-white">แดชบอร์ด</span>
          </nav>
          <h2 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl">
            ทดสอบ
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
            ติดตามผู้ป่วยนอก นัดหมาย และสถานะระบบ HosXP ได้ในที่เดียว
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.positive ? TrendingUp : TrendingDown;

          return (
            <div key={stat.label} className="glass-card p-5">
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${stat.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} strokeWidth={2} />
                </div>
                <span
                  className={`flex items-center gap-0.5 text-xs font-bold ${stat.positive ? "text-emerald-500" : "text-red-500"}`}
                >
                  <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {stat.change}
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-muted">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">ภาพรวมผู้ป่วยรายสัปดาห์</h2>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <p className="text-3xl font-bold text-foreground">
                  {weeklyTotal.toLocaleString("th-TH")}
                </p>
                <span className="flex items-center gap-1 text-sm font-bold text-emerald-500">
                  <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                  {weeklyChange} จากสัปดาห์ก่อน
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                เฉลี่ย {weeklyAvg.toLocaleString("th-TH")} ราย/วัน · สูงสุด {weeklyPeak.label}{" "}
                {weeklyPeak.count.toLocaleString("th-TH")} ราย
              </p>
            </div>
            <span className="glass-input rounded-full px-4 py-1.5 text-xs font-medium text-muted">
              สัปดาห์นี้
            </span>
          </div>

          <WeeklyOpdChart data={weeklyOpd} />
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-foreground">สถานะฐานข้อมูล</h2>
          <p className="mb-4 text-sm text-muted">การเชื่อมต่อระบบ</p>
          <div className="space-y-3">
            {!dbHealth ? (
              <p className="text-sm text-muted">ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล HosXP</p>
            ) : (
              <div className="flex items-center justify-between rounded-2xl bg-[var(--input-bg)] px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    HosXP — {dbTypeLabel(dbHealth.type)}
                  </p>
                  <p className="text-xs text-muted">ฐานข้อมูลหลัก ({dbHealth.type === "mysql" ? "my" : "pg"})</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    dbHealth.online
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-red-500/15 text-red-500"
                  }`}
                >
                  {dbHealth.online ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-foreground">กิจกรรมล่าสุด</h2>
        <p className="mb-4 text-sm text-muted">เหตุการณ์ในระบบวันนี้</p>
        <div className="divide-y divide-[var(--divider)]">
          {recentActivities.map((activity) => (
            <div key={activity.time} className="flex gap-4 py-3">
              <span className="shrink-0 text-sm font-bold text-primary-500">{activity.time}</span>
              <span className="text-sm text-muted">{activity.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
