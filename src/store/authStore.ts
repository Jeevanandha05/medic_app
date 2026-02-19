import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { AppRole, UserProfile } from '@/types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setRole: (role: AppRole | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  role: null,
  loading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    set({ loading: true });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      set({ user });

      if (user) {
        // Defer to avoid deadlock
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          set({
            profile: profile as UserProfile | null,
            role: (roles?.[0]?.role as AppRole) ?? 'patient',
            loading: false,
          });
        }, 0);
      } else {
        set({ profile: null, role: null, loading: false });
      }
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, role: null });
  },
}));
