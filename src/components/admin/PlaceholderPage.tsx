import { Construction } from "lucide-react";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center border-dashed py-24 text-center">
      <Construction className="h-12 w-12 text-muted" strokeWidth={1.5} />
      <h2 className="mt-4 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted">หน้านี้อยู่ระหว่างพัฒนา</p>
    </div>
  );
}
