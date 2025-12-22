/**
 * ScrollOne SDK v1 - Web SDK Entry Point
 */

import { createScrollOneBridge, ScrollOneWebBridge } from './webBridge';
import { generateInjectedScript } from './injectedScript';
import { BridgeMethod, BridgeEvent } from '../core/constants';
import type { 
  AccountInfo,
  BalanceInfo,
  NetworkInfo,
  TransactionRequest,
  TransactionResponse,
  SignMessageResponse,
  SignTypedDataResponse,
  GasEstimate,
} from '../types';

export { createScrollOneBridge, ScrollOneWebBridge, generateInjectedScript };
export { BridgeMethod, BridgeEvent };
export type {
  AccountInfo,
  BalanceInfo,
  NetworkInfo,
  TransactionRequest,
  TransactionResponse,
  SignMessageResponse,
  SignTypedDataResponse,
  GasEstimate,
};

/**
 * Initialize window.scrollOne if in browser environment
 * 
 * NOTE: This should only run in actual browser/WebView environments.
 * In React Native native code, the bridge is injected via generateInjectedScript().
 * 
 * This auto-initialization is safe to skip in React Native - the bridge
 * will be created by the injected script in the WebView.
 * 
 * We detect React Native by checking if we're in a Node.js-like environment
 * or if window is not properly available.
 */
(function() {
  'use strict';
  
  // Only initialize in actual browser/WebView environments
  // Skip in React Native native code (where this module is imported)
  if (typeof window === 'undefined') {
    return; // Not in browser environment
  }
  
  // Check if window has the necessary APIs
  if (typeof window.addEventListener !== 'function' ||
      typeof window.dispatchEvent !== 'function' ||
      typeof window.Event === 'undefined') {
    return; // Not a proper browser environment
  }
  
  // Don't initialize if already exists
  if (window.scrollOne) {
    return;
  }
  
  // Try to initialize - this will fail gracefully in React Native
  try {
    window.scrollOne = createScrollOneBridge();
    
    // Dispatch ready event
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('scrollOneReady'));
    }
  } catch (error) {
    // Silently fail - expected in React Native native code
    // The bridge will be initialized via injected script in WebView
  }
})();
