# ScrollOne SDK v1

Framework-agnostic WebView Bridge SDK for Scroll SuperApps and MiniApps.

## Overview

The ScrollOne SDK enables secure two-way communication between web-based dApps (MiniApps) loaded in WebView and native SuperApp wallets. It provides a standardized protocol for wallet operations, transaction signing, and network management.

## Architecture

### Components

1. **Core Protocol** (`/core`) - Canonical message formats, validation, and error handling
2. **Web SDK** (`/web`) - `window.scrollOne` implementation for dApps
3. **Native SDK** (`/native`) - Message router and handler registry for SuperApps
4. **Types** (`/types`) - TypeScript type definitions

### Message Flow

```
┌─────────────┐
│   dApp      │
│  (WebView)  │
└──────┬──────┘
       │
       │ window.scrollOne.signTransaction()
       │ → BridgeMessage
       ▼
┌─────────────┐
│  Web SDK    │
│ (Injected)  │
└──────┬──────┘
       │
       │ postMessage()
       ▼
┌─────────────┐
│ Native SDK  │
│  (Router)   │
└──────┬──────┘
       │
       │ Handler
       ▼
┌─────────────┐
│  Wallet     │
│  Service    │
└─────────────┘
```

## Protocol

### Canonical Message Format

All messages MUST conform to this shape:

```typescript
interface BridgeMessage<T = unknown> {
  id: string;
  source: 'web' | 'native';
  type: BridgeMethod;
  payload?: T;
  timestamp: number;
}
```

### Canonical Response Format

All responses MUST conform to this shape:

```typescript
interface BridgeResponse<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: {
    code: BridgeErrorCode;
    message: string;
  };
}
```

**No parallel formats. No ad-hoc wrapping.**

## Supported Methods

### GET_ACCOUNT

Get connected wallet address.

```typescript
const account = await window.scrollOne.getAccount();
// { address: string | null, isConnected: boolean }
```

### GET_BALANCE

Get ETH balance (token support coming soon).

```typescript
const balance = await window.scrollOne.getBalance();
// { balance: string, formatted: string, symbol?: string }
```

### SIGN_TRANSACTION

Sign and send a transaction (requires user approval).

```typescript
const result = await window.scrollOne.signTransaction({
  to: '0x...',
  value: '0.1', // ETH amount as string
  data: '0x...', // Optional
});
// { hash: string, from: string, to: string | null }
```

### SIGN_MESSAGE

Sign an arbitrary message.

```typescript
const result = await window.scrollOne.signMessage('Hello, Scroll!');
// { signature: string }
```

### SIGN_TYPED_DATA

Sign EIP-712 typed data (coming soon).

```typescript
const result = await window.scrollOne.signTypedData(domain, types, value);
// { signature: string }
```

### GET_NETWORK

Get current network information.

```typescript
const network = await window.scrollOne.getNetwork();
// { chainId: number, chainName: string, rpcUrl: string, isTestnet: boolean }
```

### ESTIMATE_GAS

Estimate gas for a transaction.

```typescript
const estimate = await window.scrollOne.estimateGas({
  to: '0x...',
  value: '0.1',
});
// { gasLimit: string, gasPrice: string, estimatedFee: string }
```

### REQUEST_NOTIFICATION

Request a notification from mini-app (requires user permission).

```typescript
const notification = await window.scrollOne.requestNotification({
  title: 'DeFi Position Updated',
  body: 'Your liquidity position has been updated',
  data: {
    type: 'defi_update',
    poolId: '0x123...',
  },
  sound: true, // Optional, defaults to true
  badge: 1,    // Optional, set app badge count
});
// { success: boolean, notificationId?: string }
```

**Note:** 
- Maximum 5 notifications per minute per origin (rate limited)
- Respects user's notification preferences
- Title max 100 chars, body max 500 chars
- All notifications include origin tracking

## dApp Integration

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <title>My dApp</title>
</head>
<body>
  <button id="connect">Connect Wallet</button>
  <button id="send">Send Transaction</button>

  <script>
    // Wait for bridge to be ready
    window.addEventListener('scrollOneReady', () => {
      console.log('Scroll One bridge ready!');
      initializeApp();
    });

    // Or check if already ready
    if (window.scrollOne && window.scrollOne.isScrollOne) {
      initializeApp();
    }

    async function initializeApp() {
      // Get account
      const account = await window.scrollOne.getAccount();
      if (account.isConnected) {
        console.log('Connected:', account.address);
      }

      // Listen for account changes
      window.scrollOne.on('accountChanged', (data) => {
        console.log('Account changed:', data.address);
      });

      // Send transaction
      document.getElementById('send').addEventListener('click', async () => {
        try {
          const result = await window.scrollOne.signTransaction({
            to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            value: '0.01',
          });
          console.log('Transaction sent:', result.hash);
        } catch (error) {
          console.error('Transaction failed:', error);
        }
      });
    }
  </script>
</body>
</html>
```

### React/Next.js Integration

```typescript
import { useEffect, useState } from 'react';

function useScrollOne() {
  const [account, setAccount] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkBridge = () => {
      if (window.scrollOne?.isScrollOne) {
        setIsReady(true);
        loadAccount();
      }
    };

    window.addEventListener('scrollOneReady', checkBridge);
    checkBridge();

    if (window.scrollOne) {
      window.scrollOne.on('accountChanged', (data) => {
        setAccount(data.address);
      });
    }

    return () => {
      window.removeEventListener('scrollOneReady', checkBridge);
    };
  }, []);

  const loadAccount = async () => {
    try {
      const accountData = await window.scrollOne.getAccount();
      setAccount(accountData);
    } catch (error) {
      console.error('Error loading account:', error);
    }
  };

  return { account, isReady };
}
```

## SuperApp Integration

### 1. Initialize Native Bridge

```typescript
import { NativeBridge, BridgeMethod } from '@/scrollone-sdk';
import { bridgeService } from '@/services/bridge/bridgeService';

// Bridge is already initialized in bridgeService
// Register handlers for each method
```

### 2. Register Handlers

```typescript
import {
  createGetAccountHandler,
  createGetBalanceHandler,
  createSignTransactionHandler,
  // ... other handlers
} from '@/services/bridge/handlers';

bridgeService.register(BridgeMethod.GET_ACCOUNT, createGetAccountHandler());
bridgeService.register(BridgeMethod.GET_BALANCE, createGetBalanceHandler());
// ... register all handlers
```

### 3. Handle Messages in WebView

```typescript
import { bridgeService } from '@/services/bridge/bridgeService';

const handleMessage = async (event: WebViewMessageEvent) => {
  const data = JSON.parse(event.nativeEvent.data);
  
  const context = {
    walletAddress: address,
    isWalletLocked: !isUnlocked,
    chainId: config.chainId,
    origin: app.url,
  };

  const response = await bridgeService.handleMessage(data, context);
  // Send response back to WebView
};
```

### 4. Inject Script

```typescript
import { generateInjectedScript } from '@/scrollone-sdk';

const script = generateInjectedScript({
  walletAddress: address,
  chainId: config.chainId,
  isWalletLocked: !isUnlocked,
  kycSharingEnabled: kycEnabled,
});

<WebView injectedJavaScript={script} />
```

## Security

### Origin Validation

```typescript
const bridge = new NativeBridge({
  allowedOrigins: [
    'https://trusted-dapp.com',
    '*.scroll.io',
  ],
});
```

### Method Allow-List

```typescript
const bridge = new NativeBridge({
  allowedMethods: [
    BridgeMethod.GET_ACCOUNT,
    BridgeMethod.GET_BALANCE,
    // Only allow specific methods
  ],
});
```

### Rate Limiting

```typescript
const bridge = new NativeBridge({
  rateLimiter: (origin) => {
    // Implement your rate limiting logic
    return checkRateLimit(origin);
  },
});
```

## Events

The SDK emits the following events:

- `scrollOneReady` - Bridge is initialized
- `accountChanged` - Wallet address changed
- `networkChanged` - Network changed
- `walletLocked` - Wallet was locked
- `walletUnlocked` - Wallet was unlocked

```typescript
window.scrollOne.on('accountChanged', (data) => {
  console.log('New address:', data.address);
});

window.scrollOne.off('accountChanged', callback);
```

## Error Handling

All errors follow a standardized format:

```typescript
try {
  await window.scrollOne.signTransaction(tx);
} catch (error) {
  if (error.code === 'WALLET_LOCKED') {
    // Handle locked wallet
  } else if (error.code === 'USER_REJECTED') {
    // User rejected the transaction
  }
}
```

### Error Codes

- `WALLET_NOT_CONNECTED` - No wallet connected
- `WALLET_LOCKED` - Wallet is locked
- `TRANSACTION_REJECTED` - User rejected transaction
- `INVALID_MESSAGE` - Invalid message format
- `UNSUPPORTED_METHOD` - Method not supported
- `TIMEOUT` - Request timeout
- And more...

## Lifecycle

### Initialization

1. WebView loads dApp
2. SDK injects `window.scrollOne`
3. `scrollOneReady` event fires
4. dApp can start using the bridge

### State Synchronization

The bridge automatically syncs:

- Wallet address changes
- Network changes
- Wallet lock/unlock state
- KYC sharing preferences

### Cleanup

On WebView reload:

- Pending requests are cleared
- Event listeners are preserved (dApp responsibility)
- State is re-initialized

## Versioning

Current version: **v1.0.0**

The SDK follows semantic versioning:

- **Major**: Breaking protocol changes
- **Minor**: New methods/features (backward compatible)
- **Patch**: Bug fixes

## TypeScript Support

Full TypeScript support with strict types:

```typescript
import type {
  AccountInfo,
  BalanceInfo,
  TransactionRequest,
  TransactionResponse,
  // ... all types
} from '@/scrollone-sdk';
```

## Framework Agnostic

The SDK has **zero dependencies** and works with:

- React Native
- Flutter (via platform channels)
- Native iOS/Android
- Any WebView implementation

## Best Practices

1. **Always check bridge readiness**

   ```typescript
   if (!window.scrollOne?.isScrollOne) {
     // Fallback to other providers
   }
   ```

2. **Handle errors gracefully**

   ```typescript
   try {
     await window.scrollOne.signTransaction(tx);
   } catch (error) {
     // Show user-friendly error
   }
   ```

3. **Listen for state changes**

   ```typescript
   window.scrollOne.on('accountChanged', handleAccountChange);
   ```

4. **Validate transaction data**

   ```typescript
   if (!tx.to || !tx.value) {
     throw new Error('Invalid transaction');
   }
   ```

## License

Proprietary - Scroll One SuperApp

## Support

For questions or issues, refer to the main project documentation.
