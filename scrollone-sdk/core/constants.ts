/**
 * ScrollOne SDK v1 - Constants
 * 
 * This file defines all constants used across the SDK.
 * Version: 1.0.0
 */

export const SDK_VERSION = '1.0.0';
export const SDK_NAME = 'ScrollOne';

/**
 * Bridge method types - canonical list of all supported methods
 */
export enum BridgeMethod {
  GET_ACCOUNT = 'GET_ACCOUNT',
  GET_BALANCE = 'GET_BALANCE',
  SIGN_TRANSACTION = 'SIGN_TRANSACTION',
  SIGN_MESSAGE = 'SIGN_MESSAGE',
  SIGN_TYPED_DATA = 'SIGN_TYPED_DATA',
  GET_NETWORK = 'GET_NETWORK',
  SWITCH_NETWORK = 'SWITCH_NETWORK',
  ESTIMATE_GAS = 'ESTIMATE_GAS',
  GET_TRANSACTION_STATUS = 'GET_TRANSACTION_STATUS',
  REQUEST_NOTIFICATION = 'REQUEST_NOTIFICATION',
}

/**
 * Bridge events - events that can be emitted
 */
export enum BridgeEvent {
  ACCOUNT_CHANGED = 'accountChanged',
  NETWORK_CHANGED = 'networkChanged',
  WALLET_LOCKED = 'walletLocked',
  WALLET_UNLOCKED = 'walletUnlocked',
  READY = 'scrollOneReady',
}

/**
 * Request timeout in milliseconds
 */
export const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Maximum pending requests
 */
export const MAX_PENDING_REQUESTS = 100;

/**
 * Message source identifiers
 */
export type MessageSource = 'web' | 'native';
