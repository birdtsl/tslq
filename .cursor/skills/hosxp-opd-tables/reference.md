# HosXP OPD Tables — Reference

> อ้างอิงจาก HosXP Data Dictionary — field อาจต่างตาม version/site ใช้ `DESCRIBE <table>` ยืนยันก่อน query จริง

## 1. ทะเบียนผู้ป่วย

### patient — ทะเบียนผู้ป่วย

| Column | Type | ความหมาย |
|--------|------|----------|
| hn | varchar(7) | Hospital Number (PK ทาง business) |
| pname | varchar | คำนำหน้า |
| fname | varchar | ชื่อ |
| lname | varchar | นามสกุล |
| birthday | datetime | วันเกิด |
| cid | varchar(13) | เลขบัตรประชาชน |
| sex | varchar(1) | เพศ (1=ช, 2=หญ) |
| addrpart | varchar | ที่อยู่ |
| moopart | varchar | หมู่ที่ |
| chwpart | varchar | รหัสจังหวัด |
| amppart | varchar | รหัสอำเภอ |
| tmbpart | varchar | รหัสตำบล |
| bloodgrp | varchar | หมู่เลือด |
| occupation | varchar | รหัสอาชีพ → `occupation` |
| religion | varchar | รหัสศาสนา → `religion` |

```sql
-- อายุ (ปี)
SELECT hn, YEAR(CURDATE()) - YEAR(birthday) AS age_y
FROM patient WHERE hn = ?
```

### ptcardno — บัตรประชาชน/บัตรอื่น

| Column | ความหมาย |
|--------|----------|
| hn | HN |
| cardtype | ประเภทบัตร |
| cardno | เลขบัตร |

---

## 2. Visit (หัวใจ OPD)

### ovst — เปิด visit / ลงทะเบียนมารับบริการ OPD

Primary key: `hos_guid` — ใช้ `vn` เป็น business key

| Column | Type | ความหมาย |
|--------|------|----------|
| vn | varchar(13) | Visit Number (format: yymmddhhnnss) |
| hn | varchar(7) | HN |
| an | varchar(9) | AN (ถ้า admit จาก OPD) |
| vstdate | datetime | วันที่มา |
| vsttime | datetime | เวลามา |
| doctor | varchar(4) | แพทย์ผู้ตรวจสุดท้าย → `doctor.code` |
| spclty | varchar(2) | แผนก → `spclty` |
| pttype | varchar(2) | สิทธิการรักษา → `pttype` |
| pttypeno | varchar(50) | เลขที่สิทธิ |
| ovstist | varchar(2) | ประเภทการมา → `ovstist` |
| ovstost | varchar(4) | สถานะการส่งตรวจ → `ovstost` |
| oqueue | int | ลำดับคิววันนั้น |
| main_dep | varchar(3) | แผนกหลัก |
| main_dep_queue | smallint | ลำดับคิวย่อย |
| cur_dep | varchar(3) | แผนกปัจจุบัน → `kskdepartment.depcode` |
| hospmain | varchar(5) | รพ.หลัก (refer) |
| hospsub | varchar(5) | รพ.รอง (refer) |
| diag_text | varchar(250) | วินิจฉัย text (ถ้ามี) |
| pt_subtype | smallint | ประเภทผู้ป่วย |
| staff | varchar | ผู้บันทึกส่งตรวจ |

```sql
-- OPD วันนี้ตามแผนก
SELECT o.spclty, s.name, COUNT(*) AS cnt
FROM ovst o
LEFT JOIN spclty s ON s.spclty = o.spclty
WHERE o.vstdate = CURDATE()
GROUP BY o.spclty, s.name
ORDER BY cnt DESC
```

### vn_stat — สรุป visit + ค่าใช้จ่าย + วินิจฉัยหลัก

Primary key: `vn` (1:1 กับ ovst)

| Column | Type | ความหมาย |
|--------|------|----------|
| vn | varchar(13) | Visit Number |
| hn | varchar(7) | HN |
| pdx | varchar(6) | วินิจฉัยหลัก (ICD10) |
| dx0–dx5 | varchar(6) | วินิจฉัยรอง |
| op0–op5 | varchar(6) | หัตถการ (ICD9) |
| income | float | ค่ารักษารวม |
| paid_money | float | ชำระแล้ว |
| remain_money | float | ค้างชำระ |
| uc_money | float | ส่วน UC |
| item_money | float | ค่ารายการ |
| inc01–inc17 | float | แยกตาม income group |
| inc_drug | float | ค่ายา |
| inc_nondrug | float | ค่า non-drug |
| pttype | varchar(2) | สิทธิ |
| spclty | varchar(2) | แผนก |
| sex | varchar(1) | เพศ ณ visit |
| age_y, age_m, age_d | smallint | อายุ ณ visit |
| count_in_month | smallint | ครั้งที่มาในเดือน |
| count_in_year | smallint | ครั้งที่มาในปี |
| count_in_day | smallint | ครั้งที่มาในวัน |
| dx_doctor | varchar(4) | แพทย์วินิจฉัย |
| rcp_no | varchar(10) | เลขใบเสร็จ |
| print_done | varchar(1) | พิมพ์ใบเสร็จแล้ว |

### ovstost — lookup สถานะการส่งตรวจ

| Column | ความหมาย |
|--------|----------|
| ovstost | รหัสสถานะ |
| name | ชื่อสถานะ (เช่น รอตรวจ, ตรวจแล้ว, จ่ายแล้ว) |

### ovstist — lookup ประเภทการมา

| Column | ความหมาย |
|--------|----------|
| ovstist | รหัส |
| name | ชื่อ (เช่น มาเอง, นัด, refer) |

---

## 3. ซักประวัติ / Screening

### opdscreen — ข้อมูลซักประวัติและตรวจร่างกาย

Primary key: `hos_guid` — join ด้วย `vn`

| Column | Type | ความหมาย |
|--------|------|----------|
| vn | varchar(13) | Visit Number |
| hn | varchar(7) | HN |
| vstdate, vsttime | datetime | วันเวลา visit |
| bps, bpd | float | ความดัน |
| pulse | float | ชีพจร |
| rr | float | อัตราหายใจ |
| temperature | float | อุณหภูมิ |
| bw | float | น้ำหนัก (kg) |
| height | int | ส่วนสูง (cm) |
| fbs | float | น้ำตาล |
| cc | image/text | Chief complaint |
| pe | image/text | Physical exam |
| cc_begin_date | datetime | วันเริ่มอาการ |
| screen_dep | varchar(3) | จุด screen |
| pe_ga, pe_heent, pe_heart, pe_lung, pe_ab, pe_ext, pe_neuro | varchar(1) | PE แต่ละระบบ (Y/N) |

### opdscreening — screening แบบย่อ

Primary key: `vn`

| Column | ความหมาย |
|--------|----------|
| vn | Visit Number |
| bps, bpd, bw, rr, t, p | vital signs |
| cc | varchar(250) — อาการสำคัญ |
| note | หมายเหตุ |

---

## 4. วินิจฉัย

### ovstdiag — ผลวินิจฉัย OPD (ICD-10)

Primary key: `(vn, icd10, diagtype)`

| Column | Type | ความหมาย |
|--------|------|----------|
| vn | varchar(13) | Visit Number |
| icd10 | varchar(6) | รหัส ICD-10 |
| diagtype | varchar(2) | ประเภทวินิจฉัย → `diagtype` |
| hn | varchar(7) | HN |
| vstdate, vsttime | datetime | วันเวลา |
| icd103 | varchar(3) | ICD-10 3 หลัก |
| hcode | varchar(5) | รหัส รพ. |

```sql
-- 10 โรค OPD บ่อย (ช่วงเวลา)
SELECT d.icd10, i.name, COUNT(*) AS cnt
FROM ovstdiag d
JOIN ovst o ON o.vn = d.vn
LEFT JOIN icd101 i ON i.code = d.icd10
WHERE o.vstdate BETWEEN ? AND ?
  AND d.diagtype = '1'  -- วินิจฉัยหลัก (ตรวจ site)
GROUP BY d.icd10, i.name
ORDER BY cnt DESC
LIMIT 10
```

### icd101 — รหัส ICD-10

| Column | ความหมาย |
|--------|----------|
| code | รหัส ICD-10 |
| name | ชื่อโรค |

### icd9cm1 — รหัส ICD-9 (หัตถการ)

| Column | ความหมาย |
|--------|----------|
| code | รหัส |
| name | ชื่อหัตถการ |

### diagtype — ประเภทวินิจฉัย

| Column | ความหมาย |
|--------|----------|
| diagtype | รหัส (1=principal, 2=secondary ฯลฯ — ตรวจ site) |
| name | ชื่อ |

---

## 5. สิทธิการรักษา

### pttype — master สิทธิ

| Column | ความหมาย |
|--------|----------|
| pttype | รหัสสิทธิ |
| name | ชื่อสิทธิ (เช่น ประกันสังคม, UC) |
| pttype_group | กลุ่มสิทธิ |

### pttypeno — เลขที่สิทธิต่อ HN

| Column | ความหมาย |
|--------|----------|
| hn | HN |
| pttype | รหัสสิทธิ |
| pttypeno | เลขที่สิทธิ |
| begin_date | วันเริ่ม |
| expire_date | วันหมดอายุ |
| hospmain, hospsub | รพ.ที่ลงทะเบียน |

### pttype_multi — สิทธิหลายรายการต่อ visit

| Column | ความหมาย |
|--------|----------|
| vn | Visit Number |
| pttype | สิทธิ |
| pttype_number | ลำดับสิทธิ |

---

## 6. แผนก / คลินิก / จุดบริการ

### spclty — แผนก/สาขาเฉพาะทาง

| Column | ความหมาย |
|--------|----------|
| spclty | รหัส |
| name | ชื่อแผนก |

### kskdepartment — จุดส่งตรวจ / ห้องตรวจ

| Column | ความหมาย |
|--------|----------|
| depcode | รหัสจุด (join `ovst.cur_dep`, `oapp.depcode`) |
| department | ชื่อจุด/ห้องตรวจ |

### clinic — คลินิกพิเศษ

| Column | ความหมาย |
|--------|----------|
| clinic | รหัสคลินิก |
| name | ชื่อคลินิก |
| chronic | Y = คลินิกเรื้อรัง |

### doctor — บุคลากร/แพทย์

| Column | ความหมาย |
|--------|----------|
| code | รหัสแพทย์ |
| name | ชื่อ |
| spclty | แผนก |

---

## 7. นัดหมาย

### oapp — การนัด

| Column | Type | ความหมาย |
|--------|------|----------|
| hn | varchar(7) | HN |
| vn | varchar(13) | VN ที่เปิดนัด (visit id ก่อนหน้า) |
| vstdate | datetime | วันที่ visit ที่เปิดนัด |
| nextdate | datetime | วันนัด |
| nexttime | datetime | เวลานัด |
| clinic | varchar(3) | คลินิก → `clinic` |
| depcode | varchar(3) | จุดส่งตรวจ |
| doctor | varchar(2) | แพทย์ |
| spclty | varchar(2) | แผนก |
| note | varchar(200) | หมายเหตุ |
| app_cause | varchar(250) | เหตุผลนัด |
| contact_point | varchar(250) | ช่องทางติดต่อ |

---

## 8. สั่งยา / หัตถการ / ค่ารักษา

### opitemrece — รายการยา หัตถการ ค่าบริการ (OPD + IPD)

Primary key: `hos_guid` — join ด้วย `vn`

| Column | Type | ความหมาย |
|--------|------|----------|
| vn | varchar(13) | Visit Number |
| hn | varchar(7) | HN |
| an | varchar(9) | AN (IPD) |
| icode | varchar(7) | รหัสรายการ |
| qty | int | จำนวน |
| unitprice | float | ราคาต่อหน่วย |
| sum_price | float | ราคารวม (บาง version) |
| drugusage | varchar(4) | วิธีใช้ยา → `drugusage` |
| iperday | int | ครั้ง/วัน |
| iperdose | float | ครั้งละ |
| sp_use | varchar(7) | ใช้ตามแพทย์สั่ง |
| doctor | varchar(10) | แพทย์สั่ง |
| rxdate, rxtime | datetime | วันเวลาสั่ง |
| recetime | datetime | วันเวลารับยา |
| income | varchar(2) | กลุ่ม income → `income` |
| paidst | varchar(2) | สถานะชำระ → `paidst` |
| pttype | varchar(2) | สิทธิที่ใช้ |
| dep_code | varchar(3) | แผนกสั่ง |
| staff | varchar(10) | ผู้บันทึก |
| finance_number | varchar(7) | เลขการเงิน |

### drugitems — บัญชียา

| Column | ความหมาย |
|--------|----------|
| icode | รหัสยา |
| name | ชื่อยา |
| strength | ความแรง |
| units | หน่วย |
| unitprice | ราคา |
| dosageform | รูปแบบยา |

### nondrugitems — บัญชี non-drug (ค่าบริการ, เวชภัณฑ์)

| Column | ความหมาย |
|--------|----------|
| icode | รหัส |
| name | ชื่อ |
| unitprice | ราคา |
| income | กลุ่ม income |

### s_drugitems — view รวม drug + nondrug

ใช้เมื่อต้องการค้นหารายการทั้งหมดจาก icode เดียว

### drugusage — วิธีใช้ยา

| Column | ความหมาย |
|--------|----------|
| drugusage | รหัส |
| name | คำอธิบาย (เช่น หลังอาหาร) |

### paidst — สถานะชำระเงิน

| Column | ความหมาย |
|--------|----------|
| paidst | รหัส |
| name | ชื่อ (เช่น ชำระแล้ว, ไม่ต้องชำระ) |

### income — กลุ่มค่ารักษา

| Column | ความหมาย |
|--------|----------|
| income | รหัส |
| name | ชื่อกลุ่ม (ค่ายา, ค่าห้อง, ค่า lab) |

---

## 9. Lab (OPD)

### lab_head — หัวใบสั่ง lab

| Column | ความหมาย |
|--------|----------|
| lab_order_number | เลขที่สั่ง |
| vn | Visit Number |
| hn | HN |
| order_date | วันที่สั่ง |
| order_time | เวลาสั่ง |
| doctor | แพทย์สั่ง |
| confirm_report | ยืนยันผลแล้ว |

### lab_order — รายการ lab ย่อย + ผล

| Column | ความหมาย |
|--------|----------|
| lab_order_number | เลขที่สั่ง |
| lab_items_code | รหัส lab item |
| lab_order_result | ผล |
| order_date | วันที่ |

### lab_items — master lab

| Column | ความหมาย |
|--------|----------|
| lab_items_code | รหัส |
| lab_items_name | ชื่อ lab |

```sql
-- Lab วันนี้
SELECT COUNT(*) AS lab_today FROM lab_head WHERE order_date = CURDATE()
```

---

## 10. X-ray (OPD)

### xray_head — หัวใบสั่ง x-ray

| Column | ความหมาย |
|--------|----------|
| xn | เลขที่ x-ray |
| vn | Visit Number |
| hn | HN |
| order_date | วันที่สั่ง |

### xray_report — ผล x-ray

| Column | ความหมาย |
|--------|----------|
| xn | เลขที่ x-ray |
| report_text | ผลอ่าน |
| report_date | วันที่รายงาน |

### xray_items — master x-ray

| Column | ความหมาย |
|--------|----------|
| xray_code | รหัส |
| xray_name | ชื่อ |

---

## 11. เวลาบริการ / Queue

### service_time — timestamp แต่ละจุดบริการ

Primary key: `vn`

| Column | ความหมาย |
|--------|----------|
| vn | Visit Number |
| service1–service14 | เวลาแต่ละจุด (ลงทะเบียน, ซักประวัติ, ตรวจ, จ่ายยา ฯลฯ — ตรวจ config site) |
| rx_time_type | ประเภทเวลารับยา |

### ovst_department — บันทึกเวลาต่อแผนก

Primary key: `(vn, depcode)`

| Column | ความหมาย |
|--------|----------|
| vn | Visit Number |
| depcode | รหัสแผนก |
| service_time | เวลารับบริการ |
| doctor | แพทย์ |
| staff | ผู้บันทึก |

---

## 12. การเงิน OPD

### rcpt_print — หัวใบเสร็จ

| Column | ความหมาย |
|--------|----------|
| finance_number | เลขการเงิน |
| vn | Visit Number |
| hn | HN |
| rcpdate | วันที่ออกใบเสร็จ |
| total_amount | ยอดรวม |

### rcpt_print_detail — รายละเอียดใบเสร็จ

| Column | ความหมาย |
|--------|----------|
| finance_number | เลขการเงิน |
| icode | รหัสรายการ |
| qty | จำนวน |
| amount | จำนวนเงิน |

---

## 13. ตารางเสริม OPD

| ตาราง | หน้าที่ |
|-------|--------|
| opd_allergy | ประวัติแพ้ยา (hn, agent) |
| thaiaddress | lookup ตำบล/อำเภอ/จังหวัด |
| occupation | lookup อาชีพ |
| religion | lookup ศาสนา |
| opduser | ผู้ใช้ระบบ (login) |
| referin | ผู้ป่วย refer เข้า |
| ovaccident | อุบัติเหตุ OPD |

---

## Join Cheat Sheet

```sql
-- Patient + Visit + Department name
FROM ovst o
JOIN patient p ON p.hn = o.hn
LEFT JOIN spclty s ON s.spclty = o.spclty
LEFT JOIN pttype pt ON pt.pttype = o.pttype
LEFT JOIN ovstost os ON os.ovstost = o.ovstost
LEFT JOIN kskdepartment k ON k.depcode = o.cur_dep

-- Full visit detail
FROM ovst o
JOIN vn_stat v ON v.vn = o.vn
LEFT JOIN opdscreen sc ON sc.vn = o.vn
LEFT JOIN ovstdiag d ON d.vn = o.vn
LEFT JOIN opitemrece r ON r.vn = o.vn

-- ที่อยู่เต็ม
LEFT JOIN thaiaddress t1 ON t1.chwpart = p.chwpart AND t1.amppart = '00' AND t1.tmbpart = '00'
LEFT JOIN thaiaddress t2 ON t2.chwpart = p.chwpart AND t2.amppart = p.amppart AND t2.tmbpart = '00'
LEFT JOIN thaiaddress t3 ON t3.chwpart = p.chwpart AND t3.amppart = p.amppart AND t3.tmbpart = p.tmbpart
```

## หมายเหตุ

- `vn` format มักเป็น `yymmddhhnnss` — unique ต่อ visit
- วันที่ใน DB เป็น **ค.ศ.** — แสดงผลด้วย `formatThaiDate()` จาก `src/lib/format.ts`
- `diagtype`, `service1–14`, `ovstost` ความหมายอาจต่างตาม site — ดู lookup table หรือถาม admin รพ.
- ตาราง `opitemrece` ใช้ร่วม OPD/IPD — filter OPD ด้วย `an IS NULL` หรือ join `ovst`
