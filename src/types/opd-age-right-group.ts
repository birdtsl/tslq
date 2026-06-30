export type { OpdAgeGroupKey } from "@/lib/opdAgeGroup";
export { OPD_AGE_GROUP_LABELS, OPD_AGE_GROUP_KEYS_ORDER } from "@/lib/opdAgeGroup";

export type OpdAgeRightGroupRow = {
  ageGroup: string;
  ucHn: number;
  ucVisit: number;
  govHn: number;
  govVisit: number;
  sssHn: number;
  sssVisit: number;
};

export type OpdAgeRightGroupPayload = {
  start: string;
  end: string;
  rows: OpdAgeRightGroupRow[];
  error: string | null;
};
