/** รวมชื่อผู้ป่วย HosXP: pname + fname + lname */
export function formatPatientName(p: {
  pname?: string | null;
  fname?: string | null;
  lname?: string | null;
}): string {
  return `${p.pname ?? ""}${p.fname ?? ""} ${p.lname ?? ""}`.trim();
}

/** เพศ HosXP: 1=ชาย, 2=หญิง */
export function formatSex(sex: string | number | null | undefined): string {
  if (sex === "1" || sex === 1) return "ชาย";
  if (sex === "2" || sex === 2) return "หญิง";
  return "-";
}

/** วันที่แบบไทย (พ.ศ.) — รับ string YYYY-MM-DD หรือ Date */
export function formatThaiDate(
  value: string | Date | null | undefined,
): string {
  if (!value) return "-";

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** เวลา HH:mm */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "-";
  return value.slice(0, 5);
}
