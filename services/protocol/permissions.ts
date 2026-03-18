import type { MiniAppPermission } from './types';

/**
 * Explicit allow-list per miniapp keeps the core SuperApp decoupled from
 * feature logic while still enforcing least privilege.
 */
export const MINIAPP_PERMISSION_REGISTRY: Record<string, MiniAppPermission[]> = {
  syncswap: ['wallet:read', 'network:read', 'tx:sign'],
  skydrome: ['wallet:read', 'network:read', 'tx:sign'],
  izumi: ['wallet:read', 'network:read', 'tx:sign'],
  layerbank: ['wallet:read', 'network:read', 'tx:sign'],
  'aave-v3-scroll': ['wallet:read', 'network:read', 'tx:sign'],
  'scroll-bridge': ['wallet:read', 'network:read', 'tx:sign'],
  scrollscan: ['network:read'],
};

export function resolveGrantedPermissions(
  miniAppId: string,
  requested: MiniAppPermission[]
): MiniAppPermission[] {
  const allowList = MINIAPP_PERMISSION_REGISTRY[miniAppId] ?? ['network:read'];
  return requested.filter((permission) => allowList.includes(permission));
}
