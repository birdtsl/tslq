/** อ่าน JSON จาก fetch — จัดการ body ว่าง / ไม่ใช่ JSON */
export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? "เซิร์ฟเวอร์ตอบกลับว่าง (ไม่มีข้อมูล)"
        : `HTTP ${res.status}: ไม่มีข้อมูลตอบกลับจากเซิร์ฟเวอร์`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.ok
        ? "รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง"
        : `HTTP ${res.status}: รูปแบบข้อมูลไม่ถูกต้อง`,
    );
  }
}
