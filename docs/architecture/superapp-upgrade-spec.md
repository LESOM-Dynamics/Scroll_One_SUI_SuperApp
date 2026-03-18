# SuperApp Production Upgrade Spec (Blockchain + MiniApp Protocol)

## 1) High-level architecture

Target chain: **Scroll (Ethereum L2)** with environments for `dev`, `testnet`, `mainnet`.

```text
+--------------------------------------------------------------------------------+
|                                Scroll One SuperApp                             |
|                                                                                |
|  React Native App                                                              |
|  +---------------------+        +-------------------------------------------+ |
|  | Wallet / Settings   | <----> | Blockchain Client (ethers v6)            | |
|  | UI + State Stores   |        | - env-aware RPC                           | |
|  +---------------------+        | - wallet connection (EIP-1193 / MetaMask) | |
|            |                    | - network validation                       | |
|            |                    | - tx send + confirmations                  | |
|            |                    +-------------------------------------------+ |
|            v                                                              ^    |
|  +---------------------+        +-------------------------------------------+ |
|  | WebView Container   | <----> | Bridge + Protocol Manager (v2 envelope)   | |
|  | (MiniApp host)      |        | - handshake challenge/ack                 | |
|  +---------------------+        | - session nonce replay guard              | |
|            |                    | - scoped permission checks                | |
|            v                    +-------------------------------------------+ |
|  +-------------------------------+                                            |
|  | Embedded MiniApp (dApp)       |<------------------------------------------+
|  | + MiniAppProtocolClient       |  protocol events / request-response
|  +-------------------------------+
+--------------------------------------------------------------------------------+

External:
- Scroll RPC / Scrollscan
- Wallet provider (MetaMask / WalletConnect-compatible EIP-1193 provider)
- Deployed contracts
```

## 2) Real blockchain integration design

### Environment configuration
- `services/blockchain/networks.ts` maps `dev`, `testnet`, `mainnet` to chain metadata + RPC URLs.
- RPC URLs are driven by env variables:
  - `EXPO_PUBLIC_SCROLL_DEV_RPC_URL`
  - `EXPO_PUBLIC_SCROLL_TESTNET_RPC_URL`
  - `EXPO_PUBLIC_SCROLL_MAINNET_RPC_URL`

### Wallet connection
- Uses `BrowserProvider` (ethers) with injected EIP-1193 wallet.
- Requires explicit `eth_requestAccounts` user approval.
- Validates chain before signing/sending.

### Transaction execution
- Native transfer path: `sendNativeTransaction(tx, confirmations)`.
- Contract write path: `callContract({ address, abi, method, args, valueWei }, confirmations)`.
- Both paths:
  - throw typed domain errors on failure
  - wait for confirmation receipt
  - return explorer link for UX

### Required dependencies
- Already present: `ethers` v6.
- Recommended optional additions for broader wallet coverage:
  - `@walletconnect/ethereum-provider`
  - `wagmi` + `viem` (if web-focused connector orchestration is desired)

## 3) SuperApp ↔ MiniApp protocol v2 specification

### Message envelope format
```ts
interface ProtocolEnvelope<TPayload = unknown> {
  id: string;
  version: string; // "2.0.0"
  type: ProtocolMessageType;
  timestamp: number;
  sessionId?: string;
  miniAppId: string;
  origin: string;
  nonce: string;
  payload?: TPayload;
  signature?: string;
  correlationId?: string;
}
```

### Handshake protocol
1. MiniApp → SuperApp: `handshake:init` (public key + requested permissions)
2. SuperApp → MiniApp: `handshake:challenge`
3. MiniApp signs challenge and sends `handshake:ack`
4. SuperApp verifies signature, grants scoped permissions, returns `session:ready`

### Session lifecycle
- Session TTL: 30 minutes (renew via re-handshake).
- Nonce replay protection per session.
- Origin + miniApp binding enforced on every message.

### Permission model
- Explicit allow-list registry (`services/protocol/permissions.ts`).
- Requested permissions are intersected with registered per-miniapp capabilities.
- Unknown miniapps get minimal default (`network:read`).

### Event types
- `wallet:changed`, `network:changed`, `tx:submitted`, `tx:confirmed`, `tx:failed`

### Error propagation model
- Structured error envelope (`type: "error"`) with code, message, retryable, details.
- Correlation IDs map failures to originating requests.

### Failure recovery strategy
- Expired/missing sessions => force handshake restart.
- Replay detected => reject and log security event.
- Version mismatch => reject with `VERSION_NOT_SUPPORTED`.
- Retryable errors expose `retryable: true` for client orchestration.

## 4) Example sequence (text diagram)

```text
MiniApp                        SuperApp Protocol Manager                 Blockchain
  | handshake:init ----------------------------------------------------->|
  |<------------------------ handshake:challenge ------------------------|
  | sign(challenge)                                                      |
  | handshake:ack ------------------------------------------------------>|
  |<--------------------------- session:ready ---------------------------|
  | request: SIGN_TRANSACTION ------------------------------------------>|
  |                 validate session + permission                        |
  |                 submit tx ------------------------------------------>| sendRawTx
  |                 wait receipt --------------------------------------->| receipt
  |<---------------------- response(tx hash, status) --------------------|
  |<---------------------- event: tx:confirmed --------------------------|
```

## 5) Example real transaction flow

1. `connectWallet()` asks wallet permission and validates chain ID.
2. User submits transfer in SuperApp UI or MiniApp request.
3. SuperApp checks session + `tx:sign` permission.
4. `sendNativeTransaction` signs and broadcasts via wallet provider.
5. SuperApp waits 1+ confirmations and emits `tx:confirmed` or `tx:failed`.
6. UI links to Scrollscan tx URL.

## 6) Security checklist

- [x] Chain/network validation before signing
- [x] Signature challenge handshake for MiniApp auth
- [x] Origin binding + per-miniapp identity binding
- [x] Scoped permissions (least privilege)
- [x] Replay defense (nonce cache per session)
- [x] Session TTL with forced re-auth
- [x] Structured error codes (no silent failures)
- [x] Rate-limiting remains in notification bridge handler
- [ ] Add persistent security audit log sink (recommended)
- [ ] Add remote kill-switch for compromised miniapps (recommended)

## 7) Refactored folder structure

```text
services/
  blockchain/
    client.ts
    errors.ts
    networks.ts
    types.ts
  protocol/
    miniAppProtocol.ts
    permissions.ts
    superAppProtocol.ts
    types.ts
  bridge/
    bridgeService.ts
    handlers.ts
miniapps/
  WebViewContainer.tsx
```

## 8) Extensibility recommendations

- Introduce `IWalletConnector` adapters for MetaMask, WalletConnect, and embedded MPC wallets.
- Add protocol capability negotiation field in handshake payload.
- Move permission registry to signed remote config for instant revocation.
- Add protocol test harness with fuzzed malformed envelopes and replay attacks.
