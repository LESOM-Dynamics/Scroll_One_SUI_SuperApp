/**
 * ScrollOne SDK v1 - Native Bridge
 * 
 * Message router and dispatcher for native side
 * Framework-agnostic, UI-agnostic
 */

import { BridgeMessage, BridgeResponse, isBridgeMessage, createErrorResponse } from '../core/protocol';
import { BridgeErrorCode, createBridgeError } from '../core/errors';
import { validateMessage, requiresWallet, requiresApproval, isMethodAllowed } from '../core/validator';
import { ActionRegistry, HandlerContext } from './registry';
import { BridgeMethod } from '../core/constants';

/**
 * Security configuration
 */
export interface SecurityConfig {
  allowedOrigins?: string[] | ((origin: string) => boolean);
  allowedMethods?: BridgeMethod[] | ((method: BridgeMethod) => boolean);
  rateLimiter?: (origin: string) => boolean;
}

/**
 * Native Bridge
 */
export class NativeBridge {
  private registry: ActionRegistry;
  private securityConfig: SecurityConfig;

  constructor(securityConfig: SecurityConfig = {}) {
    this.registry = new ActionRegistry();
    this.securityConfig = securityConfig;
    
    // Add security middleware
    this.registry.use(this.createSecurityMiddleware());
  }

  /**
   * Create security middleware
   */
  private createSecurityMiddleware() {
    return async (message: BridgeMessage, context: HandlerContext) => {
      // Validate origin if provided
      if (context.origin && this.securityConfig.allowedOrigins) {
        const { validateOrigin } = await import('../core/validator');
        if (!validateOrigin(context.origin, this.securityConfig.allowedOrigins)) {
          throw createBridgeError(
            BridgeErrorCode.INVALID_ORIGIN,
            `Origin ${context.origin} is not allowed`
          );
        }
      }

      // Check method allow list
      if (this.securityConfig.allowedMethods) {
        if (!isMethodAllowed(message.type, this.securityConfig.allowedMethods)) {
          throw createBridgeError(
            BridgeErrorCode.METHOD_NOT_ALLOWED,
            `Method ${message.type} is not allowed`
          );
        }
      }

      // Rate limiting
      if (context.origin && this.securityConfig.rateLimiter) {
        if (!this.securityConfig.rateLimiter(context.origin)) {
          throw createBridgeError(
            BridgeErrorCode.RATE_LIMIT_EXCEEDED,
            'Rate limit exceeded'
          );
        }
      }

      // Check wallet requirements
      if (requiresWallet(message.type)) {
        if (!context.walletAddress) {
          throw createBridgeError(
            BridgeErrorCode.WALLET_NOT_CONNECTED,
            'Wallet not connected'
          );
        }
        if (context.isWalletLocked) {
          throw createBridgeError(
            BridgeErrorCode.WALLET_LOCKED,
            'Wallet is locked'
          );
        }
      }

      // Note: Approval requirements are handled by the app layer (UI)
      // This middleware only checks if approval is needed, not if it was granted
      if (requiresApproval(message.type)) {
        // The app layer should check this and show approval UI
        // We just mark it as requiring approval
        context.requiresApproval = true;
      }
    };
  }

  /**
   * Register a handler
   */
  register<T = unknown, R = unknown>(
    method: BridgeMethod,
    handler: (payload: T, context: HandlerContext) => Promise<R> | R
  ): void {
    this.registry.register(method, handler);
  }

  /**
   * Handle a message
   */
  async handleMessage(
    message: unknown,
    context: HandlerContext
  ): Promise<BridgeResponse> {
    // Validate message format
    if (!isBridgeMessage(message)) {
      return createErrorResponse(
        'unknown',
        BridgeErrorCode.INVALID_MESSAGE,
        'Invalid message format'
      );
    }

    // Validate message structure
    const validation = validateMessage(message);
    if (!validation.valid) {
      return createErrorResponse(
        message.id,
        validation.error || BridgeErrorCode.INVALID_MESSAGE,
        'Message validation failed'
      );
    }

    // Handle the message
    return this.registry.handle(message, context);
  }

  /**
   * Get the action registry (for advanced usage)
   */
  getRegistry(): ActionRegistry {
    return this.registry;
  }

  /**
   * Update security configuration
   */
  updateSecurityConfig(config: Partial<SecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...config };
  }
}
