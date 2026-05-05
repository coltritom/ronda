"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/clients";

const AuthContext = createContext<User | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? undefined);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? undefined);
    });
    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
