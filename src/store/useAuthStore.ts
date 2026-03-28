import { create } from 'zustand';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  neighborhood?: string;
  lote?: string;
  photoURL?: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null });
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  },
}));

export default useAuthStore;
