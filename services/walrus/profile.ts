import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { uploadBlob, readBlobAsJson } from './storage';
import { syncWalrusProfileToBackend } from './api';
import type { Badge, UserProfile } from '@/store/userStore';

const PROFILE_BLOB_KEY_PREFIX = '@sui_one:walrus_profile_blob:';

export interface ScrollOneProfileBundle {
  version: number;
  displayName: string;
  bio: string;
  suiId: string;
  username: string;
  avatarBlobId?: string;
  avatarDataUri?: string;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedAt?: number;
    rarity: Badge['rarity'];
    metadataBlobId?: string;
  }>;
  reputation: number;
  level: number;
  updatedAt: number;
  walletAddress: string;
}

export function profileBlobStorageKey(walletAddress: string): string {
  return `${PROFILE_BLOB_KEY_PREFIX}${walletAddress.toLowerCase()}`;
}

export async function getCachedProfileBlobId(walletAddress: string): Promise<string | null> {
  return AsyncStorage.getItem(profileBlobStorageKey(walletAddress));
}

export async function setCachedProfileBlobId(
  walletAddress: string,
  blobId: string
): Promise<void> {
  await AsyncStorage.setItem(profileBlobStorageKey(walletAddress), blobId);
}

export function buildProfileBundle(
  profile: UserProfile,
  walletAddress: string,
  badges: Badge[],
  extras?: Partial<ScrollOneProfileBundle>
): ScrollOneProfileBundle {
  return {
    version: 1,
    displayName: profile.displayName,
    bio: profile.bio ?? '',
    suiId: profile.suiId,
    username: profile.username,
    avatarBlobId: profile.walrusAvatarBlobId,
    avatarDataUri: profile.avatar,
    badges: badges.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      earned: b.earned,
      earnedAt: b.earnedAt,
      rarity: b.rarity,
    })),
    reputation: profile.reputation,
    level: profile.level,
    updatedAt: Date.now(),
    walletAddress,
    ...extras,
  };
}

export async function uploadProfileBundle(
  bundle: ScrollOneProfileBundle,
  walletAddress: string,
  isTestnet: boolean
): Promise<{ blobId: string; contentHash: string }> {
  const json = JSON.stringify(bundle);
  const bytes = new TextEncoder().encode(json);
  const contentHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    json
  );

  const { blobId } = await uploadBlob(
    bytes,
    walletAddress,
    isTestnet,
    `scroll-one-profile-${walletAddress.slice(0, 10)}.json`
  );

  await setCachedProfileBlobId(walletAddress, blobId);
  await syncWalrusProfileToBackend(walletAddress, blobId, contentHash);
  return { blobId, contentHash };
}

export async function fetchProfileBundle(
  blobId: string,
  isTestnet: boolean
): Promise<ScrollOneProfileBundle | null> {
  try {
    return await readBlobAsJson<ScrollOneProfileBundle>(blobId, isTestnet);
  } catch (error) {
    console.error('[WalrusProfile] Failed to fetch profile bundle:', error);
    return null;
  }
}

export async function loadProfileFromWalrus(
  walletAddress: string,
  isTestnet: boolean,
  blobId?: string | null
): Promise<ScrollOneProfileBundle | null> {
  const resolvedBlobId = blobId ?? (await getCachedProfileBlobId(walletAddress));
  if (!resolvedBlobId) return null;
  return fetchProfileBundle(resolvedBlobId, isTestnet);
}

export function bundleToUserProfile(
  bundle: ScrollOneProfileBundle,
  existingId?: string
): UserProfile {
  return {
    id: existingId ?? bundle.walletAddress,
    username: bundle.username,
    displayName: bundle.displayName,
    bio: bundle.bio,
    suiId: bundle.suiId,
    reputation: bundle.reputation,
    level: bundle.level,
    joinedAt: bundle.updatedAt,
    avatar: bundle.avatarDataUri,
    walrusBlobId: undefined,
    walrusAvatarBlobId: bundle.avatarBlobId,
    profileContentHash: undefined,
  };
}

export function bundleToBadges(bundle: ScrollOneProfileBundle): Badge[] {
  return bundle.badges.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    earned: b.earned,
    earnedAt: b.earnedAt,
    rarity: b.rarity,
  }));
}
