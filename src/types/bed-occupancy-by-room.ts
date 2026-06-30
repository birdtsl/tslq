export type BedOccupancyByRoomRow = {
  room_name: string;
  bed_cc: number;
  an_cc: number;
  adm: number;
  /** อัตราครองเตียง (%): วันนอนตึก × 100 ÷ (bed_cc × จำนวนวันในช่วงที่เลือก) */
  occupancy_pct: number | null;
  dch_an: number;
  admdate: number;
  adjrw: number;
  rw: number;
};

export type BedOccupancyByRoomResponse = {
  start: string;
  end: string;
  /** จำนวนวันแบบรวมปลายทาง (วันเริ่ม–วันสิ้นสุด) ใช้เป็นตัวหารร่วมกับเตียง */
  day_count: number;
  rows: BedOccupancyByRoomRow[];
  error?: string;
};
