import { create } from 'zustand';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  suiId: string;
  reputation: number;
  level: number;
  joinedAt: number;
  walrusBlobId?: string;
  walrusAvatarBlobId?: string;
  profileContentHash?: string;
}

interface UserState {
  profile: UserProfile | null;
  badges: Badge[];
  isLoading: boolean;
  error: string | null;
  
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setBadges: (badges: Badge[]) => void;
  earnBadge: (badgeId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  incrementReputation: (points: number) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  badges: [],
  isLoading: false,
  error: null,
  
  setProfile: (profile) => set({ profile }),
  
  updateProfile: (updates) => 
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    })),
  
  setBadges: (badges) => set({ badges }),
  
  earnBadge: (badgeId) =>
    set((state) => ({
      badges: state.badges.map((badge) =>
        badge.id === badgeId
          ? { ...badge, earned: true, earnedAt: Date.now() }
          : badge
      ),
    })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  incrementReputation: (points) =>
    set((state) => {
      if (!state.profile) return state;
      const reputation = state.profile.reputation + points;
      const level = Math.floor(Math.sqrt(reputation / 100)) + 1;
      return { profile: { ...state.profile, reputation, level } };
    }),
  
  reset: () => set({
    profile: null,
    badges: [],
    isLoading: false,
    error: null,
  }),
}));
