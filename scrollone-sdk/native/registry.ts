/**
 * ScrollOne SDK v1 - Action Registry
 * 
 * Registry for native-side action handlers
 */

import { BridgeMethod } from '../core/constants';
import { BridgeMessage, BridgeResponse } from '../core/protocol';
import { BridgeErrorCode } from '../core/errors';

/**
 * Handler function type
 */
export type ActionHandler<T = unknown, R = unknown> = (
  payload: T,
  context: HandlerContext
) => Promise<R> | R;

/**
 * Handler context
 */
export interface HandlerContext {
  walletAddress: string | null;
  isWalletLocked: boolean;
  chainId: number;
  origin?: string;
  [key: string]: unknown; // Allow additional context
}

/**
 * Action registry
 */
export class ActionRegistry {
  private handlers: Map<BridgeMethod, ActionHandler> = new Map();
  private middleware: Array<(message: BridgeMessage, context: HandlerContext) => void | Promise<void>> = [];

  /**
   * Register a handler for a method
   */
  register<T = unknown, R = unknown>(
    method: BridgeMethod,
    handler: ActionHandler<T, R>
  ): void {
    if (this.handlers.has(method)) {
      console.warn(`[ActionRegistry] Handler for ${method} already registered, overwriting`);
    }
    this.handlers.set(method, handler);
  }

  /**
   * Unregister a handler
   */
  unregister(method: BridgeMethod): void {
    this.handlers.delete(method);
  }

  /**
   * Add middleware
   */
  use(middleware: (message: BridgeMessage, context: HandlerContext) => void | Promise<void>): void {
    this.middleware.push(middleware);
  }

  /**
   * Handle a message
   */
  async handle(
    message: BridgeMessage,
    context: HandlerContext
  ): Promise<BridgeResponse> {
    // Run middleware
    for (const mw of this.middleware) {
      try {
        await mw(message, context);
      } catch (error) {
        return {
          id: message.id,
          success: false,
          error: {
            code: BridgeErrorCode.EXECUTION_ERROR,
            message: error instanceof Error ? error.message : 'Middleware error',
          },
        };
      }
    }

    // Get handler
    const handler = this.handlers.get(message.type);
    if (!handler) {
      return {
        id: message.id,
        success: false,
        error: {
          code: BridgeErrorCode.UNSUPPORTED_METHOD,
          message: `No handler registered for ${message.type}`,
        },
      };
    }

    // Execute handler
    try {
      const data = await handler(message.payload, context);
      return {
        id: message.id,
        success: true,
        data,
      };
    } catch (error) {
      return {
        id: message.id,
        success: false,
        error: {
          code: error instanceof Error && 'code' in error
            ? (error as any).code || BridgeErrorCode.EXECUTION_ERROR
            : BridgeErrorCode.EXECUTION_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Check if a method has a handler
   */
  hasHandler(method: BridgeMethod): boolean {
    return this.handlers.has(method);
  }

  /**
   * Get all registered methods
   */
  getRegisteredMethods(): BridgeMethod[] {
    return Array.from(this.handlers.keys());
  }
}
