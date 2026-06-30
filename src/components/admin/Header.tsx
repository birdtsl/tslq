import { Bell, Search } from "lucide-react";

import DbConnectionStatus from "@/components/admin/DbConnectionStatus";
import ThemeToggle from "@/components/admin/ThemeToggle";

export default function Header() {
  return (
    <header className="glass-header flex h-[61px] w-full items-center justify-between gap-3 px-3 sm:gap-4 sm:px-4">
      <div className="relative hidden min-w-0 flex-1 md:block">
        <Search
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          strokeWidth={2}
        />
        <input
          type="search"
          placeholder="ค้นหา HN, ชื่อผู้ป่วย..."
          className="glass-input w-full max-w-md py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <DbConnectionStatus />

        <ThemeToggle />

        <button
          type="button"
          className="relative rounded-full p-2.5 text-muted transition-colors hover:bg-white/30 hover:text-primary-500 dark:hover:bg-white/10"
          aria-label="การแจ้งเตือน"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-bold text-white">
          ผอ
        </div>
      </div>
    </header>
  );
}
