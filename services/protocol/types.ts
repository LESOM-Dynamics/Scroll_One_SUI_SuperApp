export const PROTOCOL_VERSION = '2.0.0';

export type ProtocolMessageType =
  | 'handshake:init'
  | 'handshake:challenge'
  | 'handshake:ack'
  | 'session:ready'
  | 'session:close'
  | 'request'
  | 'response'
  | 'event'
  | 'error';

export type ProtocolEventType =
  | 'wallet:changed'
  | 'network:changed'
  | 'tx:submitted'
  | 'tx:confirmed'
  | 'tx:failed';

export type MiniAppPermission =
  | 'wallet:read'
  | 'tx:sign'
  | 'message:sign'
  | 'network:read'
  | 'notifications:write';

export interface ProtocolEnvelope<TPayload = unknown> {
  id: string;
  version: string;
  type: ProtocolMessageType;
  timestamp: number;
  sessionId?: string;
  miniAppId: string;
  origin: string;
  nonce: string;
  payload?: TPayload;
  signature?: string;
  correlationId?: string;
}

export interface HandshakeInitPayload {
  publicKey: string;
  requestedPermissions: MiniAppPermission[];
}

export interface HandshakeChallengePayload {
  challenge: string;
  expiresAt: number;
}

export interface HandshakeAckPayload {
  challenge: string;
  signedChallenge: string;
}

export interface SessionReadyPayload {
  sessionId: string;
  grantedPermissions: MiniAppPermission[];
  expiresAt: number;
}

export interface ProtocolErrorPayload {
  code:
    | 'INVALID_MESSAGE'
    | 'INVALID_SIGNATURE'
    | 'ORIGIN_NOT_ALLOWED'
    | 'PERMISSION_DENIED'
    | 'SESSION_EXPIRED'
    | 'SESSION_NOT_FOUND'
    | 'REPLAY_DETECTED'
    | 'VERSION_NOT_SUPPORTED'
    | 'INTERNAL_ERROR';
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface ProtocolSession {
  sessionId: string;
  miniAppId: string;
  origin: string;
  publicKey: string;
  permissions: Set<MiniAppPermission>;
  createdAt: number;
  expiresAt: number;
  lastSeenAt: number;
  usedNonces: Set<string>;
}
