import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/ui/theme-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen" style={{ background: "var(--surface)" }}>
        <Sidebar />
        <main className="lg:pl-[220px]">{children}</main>
      </div>
    </ThemeProvider>
  );
}
