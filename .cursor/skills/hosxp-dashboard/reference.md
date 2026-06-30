# HosXP Database Reference

## Environment Variables

Copy `.env.example` → `.env.local` แล้วกรอกค่า:

```env
DB1_HOST=localhost
DB1_PORT=3306
DB1_NAME=hosxp
DB1_USER=
DB1_PASS=

DB2_HOST=localhost
DB2_PORT=5432
DB2_NAME=hosxp
DB2_USER=
DB2_PASS=
```

## HosXP Core Tables (MySQL)

ชื่อ field อาจต่างตาม version/site — ใช้ `DESCRIBE <table>` ยืนยันก่อน

### patient — ทะเบียนผู้ป่วย

| Column | ความหมาย |
|--------|----------|
| hn | Hospital Number |
| pname | คำนำหน้า |
| fname | ชื่อ |
| lname | นามสกุล |
| birthday | วันเกิด |
| cid | เลขบัตรประชาชน |
| sex | เพศ (1=ช, 2=หญ) |
| addrpart | ที่อยู่ |
| bloodgrp | หมู่เลือด |

```sql
SELECT hn, pname, fname, lname, birthday, cid, sex
FROM patient
WHERE hn = ?
LIMIT 1
```

```sql
-- ค้นหา
SELECT hn, pname, fname, lname, birthday
FROM patient
WHERE hn LIKE ? OR fname LIKE ? OR lname LIKE ?
ORDER BY hn DESC
LIMIT 50
```

### ovst — การมารับบริการ (OPD)

> รายละเอียด OPD ครบ (vn_stat, ovstdiag, opdscreen, opitemrece ฯลฯ) → [hosxp-opd-tables](../hosxp-opd-tables/SKILL.md)

| Column | ความหมาย |
|--------|----------|
| vn | Visit Number |
| hn | HN ผู้ป่วย |
| vstdate | วันที่มา |
| vsttime | เวลา |
| spclty | รหัสแผนก |
| pttype | สิทธิการรักษา |
| ovstost | สถานะการส่งตรวจ |
| pdx | วินิจฉัยหลัก (ใน vn_stat) |

```sql
SELECT o.vn, o.hn, o.vstdate, o.vsttime, o.spclty, p.fname, p.lname
FROM ovst o
JOIN patient p ON p.hn = o.hn
WHERE o.vstdate = CURDATE()
ORDER BY o.vsttime DESC
LIMIT 100
```

### oapp — นัดหมาย

| Column | ความหมาย |
|--------|----------|
| hn | HN |
| nextdate | วันนัด |
| nexttime | เวลานัด |
| clinic | คลินิก |
| doctor | รหัสแพทย์ |
| note | หมายเหตุ |

```sql
SELECT a.hn, a.nextdate, a.nexttime, a.clinic, p.fname, p.lname
FROM oapp a
JOIN patient p ON p.hn = a.hn
WHERE a.nextdate = CURDATE()
ORDER BY a.nexttime
```

### ipt — ผู้ป่วยใน (IPD)

| Column | ความหมาย |
|--------|----------|
| an | Admission Number |
| hn | HN |
| regdate | วันที่ admit |
| ward | รหัสวอร์ด |
| bedno | เลขเตียง |
| dchdate | วันที่ discharge (NULL = ยัง admit) |

```sql
SELECT COUNT(*) AS admitted FROM ipt WHERE dchdate IS NULL
```

```sql
SELECT i.an, i.hn, i.regdate, i.ward, i.bedno, p.fname, p.lname
FROM ipt i
JOIN patient p ON p.hn = i.hn
WHERE i.dchdate IS NULL
ORDER BY i.regdate DESC
```

### doctor — แพทย์

| Column | ความหมาย |
|--------|----------|
| code | รหัสแพทย์ |
| name | ชื่อแพทย์ |
| spclty | แผนก |

```sql
SELECT code, name FROM doctor WHERE active = 'Y' ORDER BY name
```

### spclty — แผนก/สาขาเฉพาะทาง

| Column | ความหมาย |
|--------|----------|
| spclty | รหัส |
| name | ชื่อแผนก |

```sql
SELECT spclty, name FROM spclty ORDER BY name
```

### ward — วอร์ด

| Column | ความหมาย |
|--------|----------|
| ward | รหัสวอร์ด |
| name | ชื่อวอร์ด |
| bedcount | จำนวนเตียง |

### opitemrece — รายการยา/หัตถการ (OPD billing)

| Column | ความหมาย |
|--------|----------|
| vn | Visit Number |
| hn | HN |
| icode | รหัสยา/หัตถการ |
| qty | จำนวน |
| unitprice | ราคา |

### lab_head / lab_order — แล็บ

```sql
-- แล็บวันนี้ (โครงสร้างอาจต่างตาม site)
SELECT COUNT(*) AS lab_today
FROM lab_head
WHERE order_date = CURDATE()
```

## Dashboard Queries

Query มาตรฐานสำหรับ stat cards:

```sql
-- ผู้ป่วยนอกวันนี้
SELECT COUNT(*) AS count FROM ovst WHERE vstdate = CURDATE()

-- ผู้ป่วยใน (ยัง admit)
SELECT COUNT(*) AS count FROM ipt WHERE dchdate IS NULL

-- นัดหมายวันนี้
SELECT COUNT(*) AS count FROM oapp WHERE nextdate = CURDATE()

-- OPD รายสัปดาห์ (chart)
SELECT DATE(vstdate) AS day, COUNT(*) AS count
FROM ovst
WHERE vstdate >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
GROUP BY DATE(vstdate)
ORDER BY day

-- กิจกรรมล่าสุด
SELECT o.vsttime AS time, CONCAT('OPD HN ', o.hn, ' — ', p.fname, ' ', p.lname) AS text
FROM ovst o
JOIN patient p ON p.hn = o.hn
WHERE o.vstdate = CURDATE()
ORDER BY o.vsttime DESC
LIMIT 10
```

## PostgreSQL (DB2)

- ใช้ `$1, $2` แทน `?`
- ใช้ `queryPostgres()` จาก `src/lib/db/postgres.ts`
- วันที่: `CURRENT_DATE`, `NOW() - INTERVAL '6 days'`

```tsx
await queryPostgres(
  "SELECT hn, fname, lname FROM patient WHERE hn = $1",
  [hn],
);
```

## Reusable Helpers

| File | ใช้เมื่อ |
|------|---------|
| `src/lib/format.ts` | ชื่อผู้ป่วย, วันที่ไทย, เพศ, เวลา |
| `src/lib/db/health.ts` | ตรวจ DB connection บนแดชบอร์ด |
| `src/lib/db/mysql.ts` | query HosXP primary |
| `src/lib/db/postgres.ts` | query secondary |

## การตรวจ schema จริง

```sql
-- MySQL
DESCRIBE patient;
SHOW TABLES LIKE '%ovst%';
SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'hosxp';

-- PostgreSQL
\d patient
\dt
```

## หมายเหตุ HosXP

- วันที่ใน DB มักเป็น **ค.ศ.** (`YYYY-MM-DD`) — แสดงผลด้วย `formatThaiDate()` จะได้ พ.ศ.
- HN format ขึ้นกับ รพ. (เช่น `680001234`)
- บาง site ใช้ PostgreSQL เป็น primary — ถาม user ก่อนสลับ default DB
- **Read-only** — dashboard นี้ query อย่างเดียว ห้าม INSERT/UPDATE/DELETE ลง HosXP โดยไม่ได้รับอนุญาต
