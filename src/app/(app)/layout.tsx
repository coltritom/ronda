import { TabBar } from "@/components/layout/TabBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthProvider } from "@/lib/supabase/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-noche">
        <Sidebar />

        <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
          {children}
        </main>

        <TabBar />
      </div>
    </AuthProvider>
  );
}
