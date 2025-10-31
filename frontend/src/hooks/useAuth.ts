// src/hooks/useAuth.ts

import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { User, Session } from "@/integrations/metahub/core/types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = metahub.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Check for existing session
    metahub.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await metahub.auth.signOut();
  };

  return { user, session, loading, signOut };
};