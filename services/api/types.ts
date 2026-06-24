export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface BackendUser {
  id: string;
  walletAddress: string;
  suiId?: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  reputation: number;
  level: number;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
  badges?: BackendUserBadge[];
}

export interface BackendUserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: {
    id: string;
    badgeId: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    createdAt: string;
  };
  earnedAt: string;
  metadata?: Record<string, unknown>;
}

export interface AuthSession {
  token: string;
  expiresIn: string;
  user: {
    walletAddress: string;
  };
}

export interface BackendNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface BackendMiniApp {
  id: string;
  appId: string;
  name: string;
  url: string;
  icon?: string;
  description?: string;
  category?: string;
  featured: boolean;
  verified: boolean;
}
