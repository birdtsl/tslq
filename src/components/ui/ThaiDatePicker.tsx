"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker, getDateLib, th } from "react-day-picker/buddhist";

import "react-day-picker/style.css";

function isoToLocalDate(iso: string | undefined): Date {
  if (!iso) return new Date();
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthForPicker(openMonth: "selected" | "today", selected: Date): Date {
  return openMonth === "today" ? startOfMonth(new Date()) : startOfMonth(selected);
}

function localDateToIso(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function isoToDmy(iso: string | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  const be = Number(y) + 543;
  return `${d}/${m}/${be}`;
}

function dmyToIso(text: string): string | null {
  const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (year > 2400) year -= 543;
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return localDateToIso(d);
}

/** แสดงวันที่แบบไทย + พ.ศ. — ปฏิทิน DayPicker ใช้ locale ไทย (ชื่อเดือน/วัน) */
export function formatThaiBuddhistDate(iso: string): string {
  const d = isoToLocalDate(iso);
  const be = d.getFullYear() + 543;
  const dayMonth = format(d, "d MMMM", { locale: th });
  return `${dayMonth} พ.ศ. ${be}`;
}

type ThaiDatePickerProps = {
  id: string;
  label: string;
  value: string;
  onChange: (iso: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: "top" | "bottom";
  align?: "left" | "right";
  triggerClassName?: string;
  allowManualInput?: boolean;
  /** เวลาเปิดปฏิทินให้โชว์เดือนของวันไหนก่อน */
  openMonth?: "selected" | "today";
};

export function ThaiDatePicker({
  id,
  label,
  value,
  onChange,
  isOpen,
  onOpenChange,
  placement = "bottom",
  align = "left",
  triggerClassName,
  allowManualInput = false,
  openMonth = "selected",
}: ThaiDatePickerProps) {
  const selected = useMemo(() => isoToLocalDate(value), [value]);
  const [draft, setDraft] = useState<string>(isoToDmy(value));
  /** เดือนที่ผู้ใช้เลื่อนดูในปฏิทิน (หลังเปิดแล้ว) */
  const [navMonth, setNavMonth] = useState<Date>(() => startOfMonth(isoToLocalDate(value)));
  const prevOpenRef = useRef(false);
  const openingNow = isOpen && !prevOpenRef.current;
  const calendarMonth = openingNow ? monthForPicker(openMonth, selected) : navMonth;
  const [mobilePopover, setMobilePopover] = useState(false);
  const [calendarMountKey, setCalendarMountKey] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setDraft(isoToDmy(value));
  }, [value]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setMobilePopover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    if (openingNow) {
      const month = monthForPicker(openMonth, selected);
      setNavMonth(month);
      setCalendarMountKey((k) => k + 1);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, openingNow, openMonth, selected]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setAnchorRect(null);
      return;
    }
    const updateAnchor = () => {
      const el = triggerRef.current;
      if (!el) return;
      setAnchorRect(el.getBoundingClientRect());
    };
    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [isOpen]);

  const handleToggleOpen = useCallback(() => {
    if (!isOpen) {
      setNavMonth(monthForPicker(openMonth, selected));
    }
    onOpenChange(!isOpen);
  }, [isOpen, onOpenChange, openMonth, selected]);

  const handleSelect = useCallback(
    (d: Date | undefined) => {
      if (!d) return;
      const iso = localDateToIso(d);
      // DayPicker อาจเรียก onSelect ระหว่าง render — หลีกเลี่ยงการอัปเดต state ของ parent ก่อน mount เสร็จ (React 19)
      queueMicrotask(() => {
        onChange(iso);
        onOpenChange(false);
      });
    },
    [onChange, onOpenChange],
  );

  const calendarPanel = (
    <div
      className={
        mobilePopover
          ? "fixed left-1/2 top-1/2 z-[100001] max-h-[min(90dvh,28rem)] w-[min(calc(100vw-1.5rem),20rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#E8ECF8] bg-white p-2 shadow-[0_12px_40px_rgba(0,0,0,.12)]"
          : "fixed z-[100001] max-w-[min(calc(100vw-1.5rem),20rem)] rounded-2xl border border-[#E8ECF8] bg-white p-2 shadow-[0_12px_40px_rgba(0,0,0,.08)]"
      }
      style={
        mobilePopover || !anchorRect
          ? undefined
          : {
              top: placement === "bottom" ? anchorRect.bottom + 8 : undefined,
              bottom: placement === "top" ? window.innerHeight - anchorRect.top + 8 : undefined,
              left: align === "right" ? anchorRect.right : anchorRect.left,
              transform: align === "right" ? "translateX(-100%)" : undefined,
            }
      }
      onClick={(e) => e.stopPropagation()}
    >
      <DayPicker
        key={calendarMountKey}
        mode="single"
        required
        today={new Date()}
        month={calendarMonth}
        defaultMonth={calendarMonth}
        onMonthChange={setNavMonth}
        selected={selected}
        onSelect={handleSelect}
        locale={th}
        numerals="latn"
        weekStartsOn={0}
        className="thai-rdp"
        captionLayout="dropdown"
        reverseYears
        startMonth={new Date(new Date().getFullYear() - 10, 0, 1)}
        endMonth={new Date(new Date().getFullYear() + 1, 11, 31)}
        formatters={{
          formatCaption: (month, options, dateLib) => {
            const lib = dateLib ?? getDateLib(options);
            return `${format(month, "MMMM", { locale: th })} พ.ศ. ${lib.format(month, "yyyy")}`;
          },
        }}
      />
    </div>
  );

  const calendarPortal =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[100000] cursor-default bg-black/25"
              aria-label="ปิดปฏิทิน"
              onClick={() => onOpenChange(false)}
            />
            {mobilePopover || anchorRect ? calendarPanel : null}
          </>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <label htmlFor={`${id}-trigger`} className="mb-1 block text-xs font-medium text-[#A3AED0]">
        {label}
      </label>
      {allowManualInput ? (
        <div
          className={[
            "flex min-w-0 items-center gap-2 rounded-2xl border border-[#E8ECF8] bg-white px-2.5 py-1.5 text-sm font-medium text-[#1B2559] shadow-[0_2px_12px_rgba(0,0,0,.04)] transition hover:border-[#4D5EFE]/40 focus-within:ring-2 focus-within:ring-[#4D5EFE]/20",
            triggerClassName ?? "",
          ].join(" ")}
        >
          <input
            id={`${id}-trigger`}
            type="text"
            inputMode="numeric"
            placeholder="วว/ดด/ปปปป (พ.ศ.)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const iso = dmyToIso(draft);
              if (iso) onChange(iso);
              else setDraft(isoToDmy(value));
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const iso = dmyToIso(draft);
              if (iso) onChange(iso);
              else setDraft(isoToDmy(value));
            }}
            className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#1B2559] outline-none placeholder:text-[#A3AED0]"
            aria-label={`${label} (วว/ดด/ปปปป พ.ศ.)`}
          />
          <button
            ref={triggerRef}
            type="button"
            onClick={handleToggleOpen}
            className="grid h-7 w-7 place-items-center rounded-lg text-[#A3AED0] transition hover:bg-[#EEF2FF] hover:text-[#4D5EFE]"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-label={`เปิดปฏิทิน${label}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0"
              aria-hidden
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          ref={triggerRef}
          id={`${id}-trigger`}
          type="button"
          onClick={handleToggleOpen}
          className={[
            "flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-[#E8ECF8] bg-white px-3 py-2 text-left text-sm font-medium text-[#1B2559] shadow-[0_2px_12px_rgba(0,0,0,.04)] transition hover:border-[#4D5EFE]/40 focus:outline-none focus:ring-2 focus:ring-[#4D5EFE]/20",
            triggerClassName ?? "",
          ].join(" ")}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <span className="min-w-0 truncate">{formatThaiBuddhistDate(value)}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-[#A3AED0]"
            aria-hidden
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>
      )}

      {calendarPortal}
    </div>
  );
}
