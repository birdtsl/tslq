import {
  OPD_AGE_GROUP_CASE_SQL,
  OPD_AGE_GROUP_FIELD_ORDER_SQL,
  OPD_AGE_GROUP_KEYS_ORDER,
  opdAgeGroupLabel,
  type OpdAgeGroupKey,
} from "@/lib/opdAgeGroup";
import { RIGHT_GROUP_CASE_SQL } from "@/lib/rightGroup";
import { queryReadOnly } from "@/lib/db/queryReadOnly";
import type { OpdAgeRightGroupRow } from "@/types/opd-age-right-group";

function mapRow(r: Record<string, unknown>): OpdAgeRightGroupRow {
  const key = String(r.age_group_key ?? "");
  return {
    ageGroup: opdAgeGroupLabel(key),
    ucHn: Math.max(0, Number(r.uc_hn ?? 0)),
    ucVisit: Math.max(0, Number(r.uc_visit ?? 0)),
    govHn: Math.max(0, Number(r.gov_hn ?? 0)),
    govVisit: Math.max(0, Number(r.gov_visit ?? 0)),
    sssHn: Math.max(0, Number(r.sss_hn ?? 0)),
    sssVisit: Math.max(0, Number(r.sss_visit ?? 0)),
  };
}

function mergeRows(a: OpdAgeRightGroupRow, b: OpdAgeRightGroupRow): OpdAgeRightGroupRow {
  return {
    ageGroup: a.ageGroup,
    ucHn: a.ucHn + b.ucHn,
    ucVisit: a.ucVisit + b.ucVisit,
    govHn: a.govHn + b.govHn,
    govVisit: a.govVisit + b.govVisit,
    sssHn: a.sssHn + b.sssHn,
    sssVisit: a.sssVisit + b.sssVisit,
  };
}

export async function loadOpdAgeRightGroupForRange(
  start: string,
  end: string,
): Promise<{ rows: OpdAgeRightGroupRow[]; error: string | null }> {
  const sql = `
    SELECT
      age_group_key,
      COUNT(DISTINCT CASE WHEN right_group_key = 'uc_card' THEN hn END) AS uc_hn,
      COUNT(DISTINCT CASE WHEN right_group_key = 'uc_card' THEN vn END) AS uc_visit,
      COUNT(DISTINCT CASE WHEN right_group_key = 'gov' THEN hn END) AS gov_hn,
      COUNT(DISTINCT CASE WHEN right_group_key = 'gov' THEN vn END) AS gov_visit,
      COUNT(DISTINCT CASE WHEN right_group_key = 'sss' THEN hn END) AS sss_hn,
      COUNT(DISTINCT CASE WHEN right_group_key = 'sss' THEN vn END) AS sss_visit
    FROM (
      SELECT
        o.hn,
        o.vn,
        ${RIGHT_GROUP_CASE_SQL} AS right_group_key,
        ${OPD_AGE_GROUP_CASE_SQL} AS age_group_key
      FROM ovst o
      INNER JOIN patient pt ON pt.hn = o.hn
      LEFT JOIN pttype p ON p.pttype = o.pttype
      WHERE o.vstdate BETWEEN ? AND ?
    ) x
    GROUP BY age_group_key
    ORDER BY FIELD(age_group_key, ${OPD_AGE_GROUP_FIELD_ORDER_SQL})
  `;

  const { rows, error } = await queryReadOnly(sql, [start, end]);
  if (error) {
    return { rows: [], error };
  }

  const byKey = new Map<OpdAgeGroupKey, OpdAgeRightGroupRow>();
  for (const raw of rows ?? []) {
    const mapped = mapRow(raw as Record<string, unknown>);
    const key = String((raw as Record<string, unknown>).age_group_key ?? "") as OpdAgeGroupKey;
    if (OPD_AGE_GROUP_KEYS_ORDER.includes(key)) {
      const existing = byKey.get(key);
      byKey.set(key, existing ? mergeRows(existing, mapped) : mapped);
    }
  }

  const ordered: OpdAgeRightGroupRow[] = OPD_AGE_GROUP_KEYS_ORDER.map(
    (key) =>
      byKey.get(key) ?? {
        ageGroup: opdAgeGroupLabel(key),
        ucHn: 0,
        ucVisit: 0,
        govHn: 0,
        govVisit: 0,
        sssHn: 0,
        sssVisit: 0,
      },
  );

  return { rows: ordered, error: null };
}
