/** คีย์ ASCII ใน SQL — แปลเป็นชื่อไทยใน Node เพื่อหลีกเลี่ยง mojibake */
export const OPD_AGE_GROUP_KEYS_ORDER = [
  "child_0_14",
  "working_15_59",
  "elder_60_plus",
] as const;

export type OpdAgeGroupKey = (typeof OPD_AGE_GROUP_KEYS_ORDER)[number];

export const OPD_AGE_GROUP_LABELS: Record<OpdAgeGroupKey, string> = {
  child_0_14: "วัยเด็ก (0-14)",
  working_15_59: "วัยแรงงาน (15-59)",
  elder_60_plus: "วัยผู้สูงอายุ (60+)",
};

export function opdAgeGroupLabel(key: unknown): string {
  const k = String(key ?? "").trim() as OpdAgeGroupKey;
  return OPD_AGE_GROUP_LABELS[k] ?? String(key ?? "ไม่ระบุ");
}

export const OPD_AGE_GROUP_CASE_SQL = `
  CASE
    WHEN TIMESTAMPDIFF(YEAR, pt.birthday, o.vstdate) BETWEEN 0 AND 14 THEN 'child_0_14'
    WHEN TIMESTAMPDIFF(YEAR, pt.birthday, o.vstdate) BETWEEN 15 AND 59 THEN 'working_15_59'
    ELSE 'elder_60_plus'
  END
`.trim();

export const OPD_AGE_GROUP_FIELD_ORDER_SQL = OPD_AGE_GROUP_KEYS_ORDER.map((k) => `'${k}'`).join(", ");
