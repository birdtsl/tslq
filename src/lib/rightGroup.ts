/** คีย์ ASCII ใน SQL — แปลเป็นชื่อไทยใน Node เพื่อหลีกเลี่ยง mojibake */
export const RIGHT_GROUP_KEYS_ORDER = [
  "uc_card",
  "sss",
  "gov",
  "compulsory",
  "cash",
  "foreign",
  "other",
] as const;

export const RIGHT_GROUP_LABELS: Record<string, string> = {
  uc_card: "บัตรทอง",
  sss: "ประกันสังคม",
  gov: "ข้าราชการ",
  compulsory: "พรบ",
  cash: "ชำระเงินเอง",
  foreign: "ต่างด้าว",
  other: "อื่นๆ",
};

export function rightGroupLabel(key: unknown): string {
  const k = String(key ?? "other").trim().toLowerCase();
  return RIGHT_GROUP_LABELS[k] ?? RIGHT_GROUP_LABELS.other;
}

/** CASE สำหรับ hipdata_code → right_group_key */
export const RIGHT_GROUP_CASE_SQL = `
  CASE
    WHEN p.hipdata_code IN ('UCS', 'WEL') THEN 'uc_card'
    WHEN p.hipdata_code IN ('SSS', 'SSI') THEN 'sss'
    WHEN p.hipdata_code IN ('OFC', 'LGO', 'BKK', 'A1', 'BMT', 'PVT', 'SRT') THEN 'gov'
    WHEN p.hipdata_code = 'A9' THEN 'compulsory'
    WHEN p.hipdata_code = 'CSH' THEN 'cash'
    WHEN p.hipdata_code = 'NRD' THEN 'foreign'
    ELSE 'other'
  END
`.trim();

export const RIGHT_GROUP_FIELD_ORDER_SQL = RIGHT_GROUP_KEYS_ORDER.map((k) => `'${k}'`).join(", ");
