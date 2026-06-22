import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { resolveGrantedPermissions } from './permissions';
import type {
  HandshakeAckPayload,
  HandshakeChallengePayload,
  HandshakeInitPayload,
  MiniAppPermission,
  ProtocolEnvelope,
  ProtocolErrorPayload,
  ProtocolSession,
  SessionReadyPayload,
} from './types';
import { PROTOCOL_VERSION } from './types';

const SESSION_TTL_MS = 1000 * 60 * 30;
const CHALLENGE_TTL_MS = 1000 * 60 * 2;
const MAX_NONCES_PER_SESSION = 1000;

const createId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

interface PendingChallenge {
  challenge: string;
  miniAppId: string;
  origin: string;
  publicKey: string;
  requestedPermissions: MiniAppPermission[];
  expiresAt: number;
}

export class SuperAppProtocolManager {
  private sessions = new Map<string, ProtocolSession>();
  private pendingChallenges = new Map<string, PendingChallenge>();

  beginHandshake(message: ProtocolEnvelope<HandshakeInitPayload>): ProtocolEnvelope<HandshakeChallengePayload> {
    this.assertEnvelopeShape(message);

    const challenge = createId();
    const expiresAt = Date.now() + CHALLENGE_TTL_MS;

    this.pendingChallenges.set(message.id, {
      challenge,
      miniAppId: message.miniAppId,
      origin: message.origin,
      publicKey: message.payload?.publicKey ?? '',
      requestedPermissions: message.payload?.requestedPermissions ?? [],
      expiresAt,
    });

    return {
      id: createId(),
      correlationId: message.id,
      miniAppId: message.miniAppId,
      origin: message.origin,
      nonce: createId(),
      timestamp: Date.now(),
      type: 'handshake:challenge',
      version: PROTOCOL_VERSION,
      payload: { challenge, expiresAt },
    };
  }

  async completeHandshake(message: ProtocolEnvelope<HandshakeAckPayload>): Promise<ProtocolEnvelope<SessionReadyPayload>> {
    this.assertEnvelopeShape(message);

    const pending = this.pendingChallenges.get(message.correlationId ?? '');
    if (!pending || pending.expiresAt < Date.now()) {
      throw this.createProtocolError('SESSION_NOT_FOUND', 'Handshake challenge expired or missing', true);
    }

    const signature = message.payload?.signedChallenge;
    if (!signature) {
      throw this.createProtocolError('INVALID_SIGNATURE', 'Missing challenge signature', false);
    }

    try {
      const messageBytes = new TextEncoder().encode(pending.challenge);
      const publicKey = await verifyPersonalMessageSignature(messageBytes, signature, {
        address: pending.publicKey,
      });
      if (normalizeSuiAddress(publicKey.toSuiAddress()) !== normalizeSuiAddress(pending.publicKey)) {
        throw this.createProtocolError('INVALID_SIGNATURE', 'Challenge signature did not match declared address', false);
      }
    } catch {
      throw this.createProtocolError('INVALID_SIGNATURE', 'Challenge signature verification failed', false);
    }

    const grantedPermissions = resolveGrantedPermissions(
      pending.miniAppId,
      pending.requestedPermissions,
    );

    const sessionId = createId();
    const expiresAt = Date.now() + SESSION_TTL_MS;

    this.sessions.set(sessionId, {
      sessionId,
      miniAppId: pending.miniAppId,
      origin: pending.origin,
      publicKey: pending.publicKey,
      permissions: new Set(grantedPermissions),
      createdAt: Date.now(),
      expiresAt,
      lastSeenAt: Date.now(),
      usedNonces: new Set<string>(),
    });

    this.pendingChallenges.delete(message.correlationId ?? '');

    return {
      id: createId(),
      correlationId: message.id,
      miniAppId: pending.miniAppId,
      origin: pending.origin,
      nonce: createId(),
      timestamp: Date.now(),
      type: 'session:ready',
      version: PROTOCOL_VERSION,
      payload: { sessionId, grantedPermissions, expiresAt },
    };
  }

  validateSessionMessage(message: ProtocolEnvelope, requiredPermission?: MiniAppPermission): ProtocolSession {
    this.assertEnvelopeShape(message);

    const session = message.sessionId ? this.sessions.get(message.sessionId) : undefined;
    if (!session) {
      throw this.createProtocolError('SESSION_NOT_FOUND', 'Session not found', true);
    }

    if (session.expiresAt < Date.now()) {
      this.sessions.delete(session.sessionId);
      throw this.createProtocolError('SESSION_EXPIRED', 'Session has expired', true);
    }

    if (session.origin !== message.origin || session.miniAppId !== message.miniAppId) {
      throw this.createProtocolError('ORIGIN_NOT_ALLOWED', 'Origin or miniapp mismatch', false);
    }

    if (session.usedNonces.has(message.nonce)) {
      throw this.createProtocolError('REPLAY_DETECTED', 'Replay nonce detected', false);
    }

    if (session.usedNonces.size > MAX_NONCES_PER_SESSION) {
      session.usedNonces.clear();
    }
    session.usedNonces.add(message.nonce);
    session.lastSeenAt = Date.now();

    if (requiredPermission && !session.permissions.has(requiredPermission)) {
      throw this.createProtocolError('PERMISSION_DENIED', `Permission ${requiredPermission} denied`, false);
    }

    return session;
  }

  createErrorEnvelope(
    message: ProtocolEnvelope,
    error: ProtocolErrorPayload,
  ): ProtocolEnvelope<ProtocolErrorPayload> {
    return {
      id: createId(),
      correlationId: message.id,
      miniAppId: message.miniAppId,
      origin: message.origin,
      nonce: createId(),
      timestamp: Date.now(),
      type: 'error',
      version: PROTOCOL_VERSION,
      payload: error,
    };
  }

  private assertEnvelopeShape(message: ProtocolEnvelope): void {
    if (message.version !== PROTOCOL_VERSION) {
      throw this.createProtocolError('VERSION_NOT_SUPPORTED', `Expected version ${PROTOCOL_VERSION}`, false);
    }

    if (!message.id || !message.origin || !message.miniAppId || !message.nonce || !message.timestamp) {
      throw this.createProtocolError('INVALID_MESSAGE', 'Envelope missing required fields', false);
    }
  }

  private createProtocolError(
    code: ProtocolErrorPayload['code'],
    message: string,
    retryable: boolean,
  ): ProtocolErrorPayload {
    return { code, message, retryable };
  }
}
