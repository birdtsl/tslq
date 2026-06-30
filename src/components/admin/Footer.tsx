export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="glass-footer z-10 flex h-12 shrink-0 items-center justify-center px-6">
      <p className="text-xs text-muted">
        © {year} HosXP Admin. สงวนลิขสิทธิ์
      </p>
    </footer>
  );
}
