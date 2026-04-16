import { TabBar } from "@/components/layout/TabBar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-noche">
      <Sidebar />

      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      <TabBar />
    </div>
  );
}
