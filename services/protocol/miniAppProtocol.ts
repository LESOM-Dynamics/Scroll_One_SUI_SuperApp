import { Wallet } from 'ethers';
import type {
  HandshakeAckPayload,
  HandshakeChallengePayload,
  HandshakeInitPayload,
  MiniAppPermission,
  ProtocolEnvelope,
  ProtocolMessageType,
  SessionReadyPayload,
} from './types';
import { PROTOCOL_VERSION } from './types';

const createId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * MiniApp-side helper that handles protocol handshake and session-aware messaging.
 */
export class MiniAppProtocolClient {
  private sessionId: string | null = null;

  constructor(
    private readonly miniAppId: string,
    private readonly origin: string,
    private readonly wallet: Wallet,
  ) {}

  createHandshakeInit(requestedPermissions: MiniAppPermission[]): ProtocolEnvelope<HandshakeInitPayload> {
    return this.makeEnvelope('handshake:init', {
      publicKey: this.wallet.address,
      requestedPermissions,
    });
  }

  async createHandshakeAck(
    challengeEnvelope: ProtocolEnvelope<HandshakeChallengePayload>,
  ): Promise<ProtocolEnvelope<HandshakeAckPayload>> {
    const signature = await this.wallet.signMessage(challengeEnvelope.payload?.challenge ?? '');

    return {
      ...this.makeEnvelope('handshake:ack', {
        challenge: challengeEnvelope.payload?.challenge ?? '',
        signedChallenge: signature,
      }),
      correlationId: challengeEnvelope.id,
    };
  }

  applySessionReady(message: ProtocolEnvelope<SessionReadyPayload>): void {
    this.sessionId = message.payload?.sessionId ?? null;
  }

  createSessionRequest<TPayload>(type: ProtocolMessageType, payload: TPayload): ProtocolEnvelope<TPayload> {
    if (!this.sessionId) {
      throw new Error('Session not ready. Perform handshake first.');
    }

    return this.makeEnvelope(type, payload, this.sessionId);
  }

  private makeEnvelope<TPayload>(
    type: ProtocolMessageType,
    payload: TPayload,
    sessionId?: string,
  ): ProtocolEnvelope<TPayload> {
    return {
      id: createId(),
      version: PROTOCOL_VERSION,
      type,
      timestamp: Date.now(),
      sessionId,
      miniAppId: this.miniAppId,
      origin: this.origin,
      nonce: createId(),
      payload,
    };
  }
}
