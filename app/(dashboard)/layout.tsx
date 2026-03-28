import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar />
      <main className="lg:pl-60">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
