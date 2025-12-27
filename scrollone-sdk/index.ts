/**
 * ScrollOne SDK v1
 * 
 * Framework-agnostic WebView Bridge SDK for Scroll SuperApps
 */

// Core exports
export * from './core/constants';
export * from './core/errors';
export * from './core/protocol';
export * from './core/validator';

// Web SDK exports
export * from './web';

// Native SDK exports
export * from './native';

// Type exports
export * from './types/wallet';
export * from './types/transactions';
export * from './types/notifications';

// Version
export const VERSION = '1.0.0';
