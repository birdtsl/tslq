import Footer from "@/components/admin/Footer";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="fixed top-6 right-0 left-64 z-30 px-6">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-[85px]">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
