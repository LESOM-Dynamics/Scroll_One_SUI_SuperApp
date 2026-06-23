import { env } from '@/config/env';
import { readBlobAsJson } from './storage';
import { MINIAPPS, type MiniApp } from '@/miniapps/registry';

export interface WalrusMiniAppManifest {
  version: number;
  updatedAt: number;
  apps: MiniApp[];
}

let cachedManifest: MiniApp[] | null = null;

export async function loadMiniAppsFromWalrus(isTestnet: boolean): Promise<MiniApp[]> {
  if (cachedManifest) {
    return cachedManifest;
  }

  const blobId = env.walrus.manifestBlobId;
  if (!blobId) {
    return MINIAPPS;
  }

  try {
    const manifest = await readBlobAsJson<WalrusMiniAppManifest>(blobId, isTestnet);
    if (manifest.apps?.length) {
      cachedManifest = manifest.apps;
      return manifest.apps;
    }
  } catch (error) {
    console.warn('[WalrusManifest] Falling back to local registry:', error);
  }

  return MINIAPPS;
}

export function clearManifestCache(): void {
  cachedManifest = null;
}
