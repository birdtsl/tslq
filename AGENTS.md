<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## HosXP Admin Dashboard

โปรเจ็กต์นี้เป็น **HosXP Admin Dashboard** — อ่านและปฏิบัติตาม skill `.cursor/skills/hosxp-dashboard/SKILL.md` ก่อนเขียนโค้ดทุกครั้ง

- OPD / schema ผู้ป่วยนอก → `.cursor/skills/hosxp-opd-tables/SKILL.md`

- UI: Tailwind CSS v4, ภาษาไทย, ใช้ `primary-*` theme จาก `globals.css`
- DB: MySQL (DB1) สำหรับ HosXP primary, PostgreSQL (DB2) สำหรับ secondary
- Reuse: `queryMysql`, `queryPostgres`, `formatPatientName`, `checkDbHealth` จาก `src/lib/`
