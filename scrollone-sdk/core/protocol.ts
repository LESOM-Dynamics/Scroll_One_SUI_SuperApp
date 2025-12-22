/**
 * ScrollOne SDK v1 - Protocol
 * 
 * Canonical message and response contracts - single source of truth
 */

import { BridgeMethod } from './constants';
import { BridgeErrorCode } from './errors';

/**
 * Canonical Bridge Message
 * 
 * All messages MUST conform to this shape.
 * No parallel formats, no ad-hoc wrapping.
 */
export interface BridgeMessage<T = unknown> {
  id: string;
  source: 'web' | 'native';
  type: BridgeMethod;
  payload?: T;
  timestamp: number;
}

/**
 * Canonical Bridge Response
 * 
 * All responses MUST conform to this shape.
 */
export interface BridgeResponse<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: {
    code: BridgeErrorCode;
    message: string;
  };
}

/**
 * Event message format (for native → web events)
 */
export interface BridgeEventMessage {
  type: 'BRIDGE_EVENT';
  event: string;
  data: unknown;
}

/**
 * Response message format (for native → web responses)
 */
export interface BridgeResponseMessage {
  type: 'BRIDGE_RESPONSE';
  payload: BridgeResponse;
}

/**
 * Type guards
 */
export function isBridgeMessage(value: unknown): value is BridgeMessage {
  if (!value || typeof value !== 'object') return false;
  const msg = value as Record<string, unknown>;
  return (
    typeof msg.id === 'string' &&
    (msg.source === 'web' || msg.source === 'native') &&
    typeof msg.type === 'string' &&
    typeof msg.timestamp === 'number'
  );
}

export function isBridgeResponse(value: unknown): value is BridgeResponse {
  if (!value || typeof value !== 'object') return false;
  const res = value as Record<string, unknown>;
  return (
    typeof res.id === 'string' &&
    typeof res.success === 'boolean' &&
    (res.data !== undefined || res.error !== undefined)
  );
}

/**
 * Create a bridge message
 */
export function createBridgeMessage<T>(
  id: string,
  source: 'web' | 'native',
  type: BridgeMethod,
  payload?: T
): BridgeMessage<T> {
  return {
    id,
    source,
    type,
    payload,
    timestamp: Date.now(),
  };
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  id: string,
  data: T
): BridgeResponse<T> {
  return {
    id,
    success: true,
    data,
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  id: string,
  code: BridgeErrorCode,
  message: string
): BridgeResponse {
  return {
    id,
    success: false,
    error: {
      code,
      message,
    },
  };
}
