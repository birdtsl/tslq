"use client";

import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/patients", label: "ผู้ป่วย", icon: Users },
  { href: "/appointments", label: "นัดหมาย", icon: CalendarDays },
  { href: "/reports", label: "รายงาน", icon: FileText },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-sidebar flex h-screen w-64 shrink-0 flex-col">
      <div className="flex h-20 shrink-0 items-center px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-base font-bold text-white shadow-lg shadow-primary-500/30">
            H
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-foreground">HosXP Admin</p>
            <p className="truncate text-xs text-muted">ระบบจัดการโรงพยาบาล</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted">เมนูหลัก</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-[var(--nav-active-bg)] font-semibold text-[var(--nav-active-text)] shadow-md shadow-primary-500/25"
                  : "font-medium text-muted hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] px-4 py-5">
        <div className="rounded-2xl bg-[var(--input-bg)] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
              ผอ
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">ผู้ดูแลระบบ</p>
              <p className="truncate text-xs text-muted">admin@hosxp.local</p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted">เวอร์ชัน 1.0.0</p>
      </div>
    </aside>
  );
}
