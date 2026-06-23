import type { MiniAppPermission } from './types';

/**
 * Explicit allow-list per miniapp keeps the core SuperApp decoupled from
 * feature logic while still enforcing least privilege.
 */
export const MINIAPP_PERMISSION_REGISTRY: Record<string, MiniAppPermission[]> = {
  deepbook: ['wallet:read', 'network:read', 'tx:sign'],
  cetus: ['wallet:read', 'network:read', 'tx:sign'],
  scallop: ['wallet:read', 'network:read', 'tx:sign'],
  turbos: ['wallet:read', 'network:read', 'tx:sign'],
  aftermath: ['wallet:read', 'network:read', 'tx:sign'],
  suins: ['wallet:read', 'network:read'],
  suivision: ['network:read'],
  'wormhole-bridge': ['wallet:read', 'network:read', 'tx:sign'],
  flowx: ['wallet:read', 'network:read', 'tx:sign'],
};

export function resolveGrantedPermissions(
  miniAppId: string,
  requested: MiniAppPermission[]
): MiniAppPermission[] {
  const allowList = MINIAPP_PERMISSION_REGISTRY[miniAppId] ?? ['network:read'];
  return requested.filter((permission) => allowList.includes(permission));
}
