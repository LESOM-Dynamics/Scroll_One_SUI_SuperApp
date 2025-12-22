/**
 * ScrollOne SDK v1 - Error Codes
 * 
 * Typed error codes for deterministic error handling
 */

export enum BridgeErrorCode {
  // Validation errors
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  INVALID_ORIGIN = 'INVALID_ORIGIN',
  
  // Wallet errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_LOCKED = 'WALLET_LOCKED',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  
  // Transaction errors
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  
  // Signing errors
  SIGN_REJECTED = 'SIGN_REJECTED',
  SIGN_FAILED = 'SIGN_FAILED',
  INVALID_MESSAGE_FORMAT = 'INVALID_MESSAGE_FORMAT',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED',
  NETWORK_SWITCH_REJECTED = 'NETWORK_SWITCH_REJECTED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Method errors
  UNSUPPORTED_METHOD = 'UNSUPPORTED_METHOD',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  
  // Execution errors
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  TIMEOUT = 'TIMEOUT',
  USER_REJECTED = 'USER_REJECTED',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Bridge error class
 */
export class BridgeError extends Error {
  constructor(
    public code: BridgeErrorCode,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'BridgeError';
    Object.setPrototypeOf(this, BridgeError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      name: this.name,
    };
  }
}

/**
 * Create a standardized error response
 */
export function createBridgeError(
  code: BridgeErrorCode,
  message: string,
  originalError?: Error
): BridgeError {
  return new BridgeError(code, message, originalError);
}
