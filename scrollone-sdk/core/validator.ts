/**
 * ScrollOne SDK v1 - Validator
 * 
 * Message and origin validation utilities
 */

import { BridgeMessage, isBridgeMessage } from './protocol';
import { BridgeErrorCode, createBridgeError } from './errors';
import { BridgeMethod } from './constants';

/**
 * Validate a bridge message
 */
export function validateMessage(message: unknown): {
  valid: boolean;
  error?: BridgeErrorCode;
} {
  if (!isBridgeMessage(message)) {
    return {
      valid: false,
      error: BridgeErrorCode.INVALID_MESSAGE,
    };
  }

  // Validate required fields
  if (!message.id || typeof message.id !== 'string') {
    return {
      valid: false,
      error: BridgeErrorCode.INVALID_MESSAGE,
    };
  }

  if (!message.type || !Object.values(BridgeMethod).includes(message.type as BridgeMethod)) {
    return {
      valid: false,
      error: BridgeErrorCode.UNSUPPORTED_METHOD,
    };
  }

  if (typeof message.timestamp !== 'number' || message.timestamp <= 0) {
    return {
      valid: false,
      error: BridgeErrorCode.INVALID_MESSAGE,
    };
  }

  // Validate timestamp is not too old (5 minutes)
  const age = Date.now() - message.timestamp;
  if (age > 5 * 60 * 1000) {
    return {
      valid: false,
      error: BridgeErrorCode.INVALID_MESSAGE,
    };
  }

  return { valid: true };
}

/**
 * Validate origin against allow list
 */
export function validateOrigin(
  origin: string,
  allowedOrigins: string[] | ((origin: string) => boolean)
): boolean {
  if (typeof allowedOrigins === 'function') {
    return allowedOrigins(origin);
  }

  return allowedOrigins.some((allowed) => {
    // Exact match
    if (allowed === origin) return true;
    
    // Wildcard domain match (e.g., *.example.com)
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    
    return false;
  });
}

/**
 * Check if method requires wallet connection
 */
export function requiresWallet(method: BridgeMethod): boolean {
  return [
    BridgeMethod.GET_ACCOUNT,
    BridgeMethod.GET_BALANCE,
    BridgeMethod.SIGN_TRANSACTION,
    BridgeMethod.SIGN_MESSAGE,
    BridgeMethod.SIGN_TYPED_DATA,
  ].includes(method);
}

/**
 * Check if method requires user approval
 */
export function requiresApproval(method: BridgeMethod): boolean {
  return [
    BridgeMethod.SIGN_TRANSACTION,
    BridgeMethod.SIGN_MESSAGE,
    BridgeMethod.SIGN_TYPED_DATA,
    BridgeMethod.SWITCH_NETWORK,
  ].includes(method);
}

/**
 * Check if method is allowed (for allow-list enforcement)
 */
export function isMethodAllowed(
  method: BridgeMethod,
  allowedMethods?: BridgeMethod[] | ((method: BridgeMethod) => boolean)
): boolean {
  if (!allowedMethods) return true;
  
  if (typeof allowedMethods === 'function') {
    return allowedMethods(method);
  }
  
  return allowedMethods.includes(method);
}
