import type { Badge, UserProfile } from '@/store/userStore';
import { apiRequest, apiRequestOptional } from './client';
import type { BackendUser, BackendUserBadge } from './types';

function mapBackendBadge(userBadge: BackendUserBadge): Badge {
  return {
    id: userBadge.badge.badgeId,
    name: userBadge.badge.name,
    description: userBadge.badge.description,
    icon: userBadge.badge.icon,
    earned: true,
    earnedAt: new Date(userBadge.earnedAt).getTime(),
    rarity: userBadge.badge.rarity,
  };
}

export function mapBackendUserToProfile(user: BackendUser): UserProfile {
  const prefs = user.preferences ?? {};
  return {
    id: user.id,
    username: user.username ?? `user_${user.walletAddress.slice(-6)}`,
    displayName: user.displayName ?? 'Sui User',
    avatar: user.avatar,
    bio: user.bio,
    suiId: user.suiId ?? user.walletAddress,
    reputation: user.reputation ?? 0,
    level: user.level ?? 1,
    joinedAt: new Date(user.createdAt).getTime(),
    walrusBlobId: prefs.walrusBlobId as string | undefined,
    profileContentHash: prefs.profileContentHash as string | undefined,
  };
}

export async function fetchBackendUser(walletAddress: string): Promise<BackendUser | null> {
  return apiRequestOptional<BackendUser>(`/users/${walletAddress}`, { auth: false });
}

export async function fetchBackendProfile(walletAddress: string): Promise<{
  profile: UserProfile | null;
  badges: Badge[];
}> {
  const user = await fetchBackendUser(walletAddress);
  if (!user) {
    return { profile: null, badges: [] };
  }

  const profile = mapBackendUserToProfile(user);
  const earnedBadges = (user.badges ?? []).map(mapBackendBadge);

  return { profile, badges: earnedBadges };
}

export async function awardBackendBadge(
  walletAddress: string,
  badgeId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await apiRequest(`/users/${walletAddress}/badges/earn`, {
    method: 'POST',
    body: JSON.stringify({ badgeId, metadata }),
  });
}

export async function updateBackendProfile(
  walletAddress: string,
  updates: Partial<Pick<UserProfile, 'username' | 'displayName' | 'avatar' | 'bio' | 'suiId'>>
): Promise<void> {
  await apiRequest(`/users/${walletAddress}`, {
    method: 'PUT',
    body: JSON.stringify({
      username: updates.username,
      displayName: updates.displayName,
      avatar: updates.avatar,
      bio: updates.bio,
      suiId: updates.suiId,
    }),
  });
}
