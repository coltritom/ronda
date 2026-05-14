import { TabBar } from "@/components/layout/TabBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <AuthProvider initialUser={session?.user ?? undefined}>
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
