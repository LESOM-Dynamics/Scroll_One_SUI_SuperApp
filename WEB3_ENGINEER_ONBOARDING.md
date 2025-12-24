# Web3 Engineer Onboarding Guide

## Scroll One SuperApp

**Version:** Pre-Launch  
**Last Updated:** Based on current codebase state  
**Target Audience:** Web3 Engineers joining pre-launch

---

## 1. Project Overview

### What This SuperApp Is

**Scroll One SuperApp** is a mobile-first crypto SuperApp built on the Scroll blockchain (Ethereum L2). It combines:

- **Native Wallet**: Self-custodial wallet with real blockchain integration (ethers.js v6)
- **Mini-App Ecosystem**: WebView-based dApp marketplace with 20+ integrated Scroll ecosystem apps
- **Identity Layer**: Decentralized identity with reputation, badges, and achievements
- **WebView Bridge SDK**: Custom SDK (`scrollone-sdk`) enabling secure communication between native wallet and WebView-hosted dApps

### Core Problems It Solves

1. **Fragmented DeFi Experience**: Users currently juggle multiple wallets and dApps. This SuperApp provides a unified interface.
2. **Scroll Ecosystem Discovery**: Makes it easy to discover and use Scroll-native dApps (SyncSwap, Skydrome, LayerBank, Aave v3, etc.)
3. **Secure dApp Integration**: Custom WebView bridge allows dApps to request wallet operations without exposing private keys.
4. **Mobile-First Web3**: Native mobile experience with biometric security, optimized for iOS/Android.

### Why Scroll Blockchain

The codebase is **exclusively** built for Scroll:

- **RPC Endpoints**: Hardcoded to Scroll mainnet (`https://rpc.scroll.io`, chainId: 534352) and testnet (`https://sepolia-rpc.scroll.io`, chainId: 534351)
- **Token Addresses**: Placeholder addresses in `services/scroll/tokens.ts` (need real Scroll token addresses)
- **Explorer Integration**: Uses ScrollScan API (`https://api.scrollscan.com/api`)
- **Mini-App Registry**: All 20+ apps are Scroll-native dApps from the official Scroll ecosystem

**Evidence in code:**

- `services/scroll/provider.ts` - ScrollProvider class with Scroll-specific RPC URLs
- `miniapps/registry.ts` - All apps point to Scroll dApps (SyncSwap, Skydrome, LayerBank, etc.)

---

## 2. High-Level Architecture

### Frontend Stack

- **Framework**: React Native 0.81.5 with Expo ~54.0.27
- **Routing**: Expo Router (file-based routing, similar to Next.js)
- **Language**: TypeScript 5.9.2 (strict mode)
- **State Management**:
  - Zustand 5.0.2 (client state: wallet, user, mini-apps, settings)
  - React Query (@tanstack/react-query) for server state
- **UI Components**: Custom design system in `theme/` (colors, typography, spacing, shadows)
- **Icons**: Lucide React Native
- **WebView**: React Native WebView 13.15.0

### Backend/Services Stack

**No traditional backend.** This is a fully client-side application with:

- **Blockchain RPC**: Direct calls to Scroll RPC endpoints
- **External APIs**:
  - CoinGecko API for token prices (`services/scroll/prices.ts`)
  - ScrollScan API for transaction history (`services/scroll/transactions.ts`)
- **Local Storage**:
  - Expo SecureStore (encrypted private keys, wallet data)
  - AsyncStorage (non-sensitive preferences)

### Smart Contracts

**No custom smart contracts deployed yet.** The app interacts with:

- **Existing Scroll Contracts**: ERC-20 tokens (USDC, USDT, WBTC, DAI) - addresses are placeholders in `services/scroll/tokens.ts`
- **Future Contracts**: None planned in current codebase

**Critical Gap**: Token addresses in `services/scroll/tokens.ts` are placeholders (`0x06eFdBFf2a14a7c8E15953D5F4e4C0A8b8b8b8b8`). These must be replaced with real Scroll mainnet/testnet token addresses before launch.

### Wallet Integrations

**Self-custodial wallet only** - no external wallet connections (MetaMask, WalletConnect, etc.).

- **Library**: ethers.js v6.0.0
- **Key Management**:
  - Private keys generated using `expo-crypto.getRandomBytes(32)`
  - Stored encrypted in Expo SecureStore
  - Supports multiple wallets (wallet list in SecureStore)
- **Operations**:
  - Real wallet creation (`services/scroll/wallet.ts::createWallet`)
  - Real transaction signing (`services/scroll/wallet.ts::signTransaction`)
  - Real transaction sending (`services/scroll/wallet.ts::sendTransaction`)

### Indexing / Data Layers

- **Transaction History**: Fetched from ScrollScan API (`services/scroll/transactions.ts::fetchTransactions`)
- **Token Prices**: CoinGecko API with 1-minute cache (`services/scroll/prices.ts`)
- **Token Balances**: Direct ERC-20 contract calls via ethers.js (`services/scroll/tokens.ts`)

### How Components Communicate

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  (app/, components/)                                     │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│              Zustand Stores (State)                      │
│  (store/walletStore.ts, userStore.ts, etc.)             │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│              Services Layer                              │
│  services/scroll/ (wallet, transactions, tokens, etc.)  │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│         Blockchain / External APIs                       │
│  Scroll RPC, CoinGecko, ScrollScan                      │
└──────────────────────────────────────────────────────────┘
```

**WebView Bridge Flow:**

```
dApp (WebView) → window.scrollOne API → postMessage → 
WebViewContainer → bridgeService → handlers → 
wallet/transaction services → Scroll blockchain
```

---

## 3. Codebase Walkthrough

### Top-Level Folder Structure

```
Scroll_One_SuperApp/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── (wallet)/            # Wallet tab screens
│   │   │   ├── index.tsx        # Wallet overview (balance, assets, transactions)
│   │   │   ├── send.tsx         # Send tokens
│   │   │   ├── receive.tsx      # Receive (QR code)
│   │   │   ├── swap.tsx         # Token swap (UI only, no DEX integration)
│   │   │   ├── bridge.tsx       # Bridge to Ethereum (WebView)
│   │   │   ├── deposit.tsx     # Deposit/on-ramp (WebView)
│   │   │   ├── activity.tsx    # Transaction history
│   │   │   └── transaction/[id].tsx  # Transaction detail screen
│   │   ├── (explore)/           # Explore tab (mini-apps)
│   │   │   ├── index.tsx        # Mini-app discovery
│   │   │   └── [appId].tsx      # Mini-app detail/WebView
│   │   └── (identity)/          # Identity tab
│   │       ├── index.tsx        # Profile, badges, reputation
│   │       ├── privacy-security.tsx  # Privacy settings
│   │       ├── preferences.tsx  # App preferences
│   │       └── developer-settings.tsx  # Developer tools
│   ├── _layout.tsx              # Root layout (QueryClient, AuthGuard)
│   └── +not-found.tsx           # 404 screen
├── components/                   # Reusable React components
│   ├── auth/
│   │   └── AuthGuard.tsx        # Protects routes, checks wallet
│   ├── bridge/
│   │   └── TransactionApprovalModal.tsx  # Transaction approval UI
│   ├── layout/
│   │   └── Screen.tsx           # Screen wrapper component
│   ├── ui/                      # UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   ├── Loading.tsx
│   │   ├── CategoryTabs.tsx
│   │   ├── MiniAppGridCard.tsx
│   │   └── MiniAppListCard.tsx
│   └── wallet/
│       └── WalletSelectionModal.tsx  # Multi-wallet selection
├── constants/
│   └── color.ts                 # Legacy color constants (use theme/ instead)
├── hooks/
│   └── useAppInitialization.ts  # App startup logic (wallet loading, etc.)
├── landing-page/                # Separate Next.js landing page
│   ├── app/                     # Next.js app directory
│   ├── components/
│   └── package.json             # Separate package.json
├── miniapps/
│   ├── registry.ts              # Mini-app registry (20+ apps)
│   └── WebViewContainer.tsx    # WebView wrapper with bridge integration
├── scrollone-sdk/               # Custom WebView bridge SDK
│   ├── core/                    # Protocol, validation, errors
│   ├── web/                     # window.scrollOne implementation
│   ├── native/                  # Native bridge router
│   ├── types/                   # TypeScript types
│   └── README.md                # SDK documentation
├── services/                     # Business logic layer
│   ├── bridge/
│   │   ├── bridgeService.ts    # Bridge service singleton
│   │   └── handlers.ts         # Bridge method handlers
│   └── scroll/
│       ├── provider.ts         # Scroll RPC provider
│       ├── wallet.ts           # Wallet operations (create, sign, send)
│       ├── transactions.ts     # Transaction fetching, sending
│       ├── tokens.ts           # ERC-20 token operations
│       └── prices.ts           # CoinGecko price fetching
├── store/                       # Zustand state stores
│   ├── walletStore.ts          # Wallet state (address, balance, transactions)
│   ├── userStore.ts            # User/identity state
│   ├── miniAppStore.ts         # Mini-app state (favorites, recent)
│   └── settingsStore.ts        # App settings (theme, network, KYC)
├── theme/                       # Design system
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── shadows.ts
│   └── index.ts
├── assets/                      # Static assets
├── app.json                     # Expo configuration
├── package.json                 # Main dependencies
├── tsconfig.json                # TypeScript config
├── IMPLEMENTATION_STATUS.md     # Feature completion status
├── WEBVIEW_BRIDGE_GUIDE.md      # Bridge integration guide
└── README.md                    # General project README
```

### Key Directories

**`app/`** - Expo Router file-based routing. Each file is a route. Folders with `()` are route groups (not in URL).

**`services/`** - Pure business logic, no React. These are the core Web3 integration points:

- `services/scroll/wallet.ts` - Real wallet operations (ethers.js)
- `services/scroll/transactions.ts` - Transaction fetching from ScrollScan
- `services/bridge/` - WebView bridge message handling

**`scrollone-sdk/`** - Framework-agnostic SDK for WebView bridge. Zero dependencies. Used by both native app and dApps.

**`store/`** - Zustand stores. Single source of truth for app state.

**`miniapps/`** - Mini-app registry and WebView container. This is where dApps are loaded.

### Entry Points

1. **`app/_layout.tsx`** - Root layout, initializes QueryClient, loads fonts, shows AuthGuard
2. **`hooks/useAppInitialization.ts`** - Called in root layout, loads wallet from SecureStore, initializes app state
3. **`app/(tabs)/_layout.tsx`** - Tab navigation layout (Wallet, Explore, Identity)

### Configuration Files

- **`app.json`** - Expo configuration (app name, bundle IDs, permissions, plugins)
- **`package.json`** - Dependencies (ethers v6, Expo, React Native, etc.)
- **`tsconfig.json`** - TypeScript strict mode configuration
- **`metro.config.js`** - Metro bundler config (React Native)

### Environment Variables

**No `.env` files found in codebase.** All configuration is hardcoded:

- **RPC URLs**: Hardcoded in `services/scroll/provider.ts`
  - Mainnet: `https://rpc.scroll.io`
  - Testnet: `https://sepolia-rpc.scroll.io`
- **API Keys**: None required currently (CoinGecko is free tier, ScrollScan doesn't require key in current implementation)
- **Token Addresses**: Hardcoded placeholders in `services/scroll/tokens.ts`

**Pre-Launch Action Required**:

- Replace placeholder token addresses with real Scroll mainnet/testnet addresses
- Consider adding environment variable support for RPC URLs (for custom RPC providers)

---

## 4. Blockchain & Web3 Layer

### Current Scroll Integrations

**Fully Integrated:**

- ✅ Wallet creation (ethers.js, real private keys)
- ✅ Transaction signing (real signatures)
- ✅ Transaction sending (real on-chain transactions)
- ✅ ETH balance fetching (real RPC calls)
- ✅ Transaction history (ScrollScan API)
- ✅ Gas estimation (real estimates)
- ✅ Network switching (code supports it, no UI yet)

**Partially Integrated:**

- ⚠️ ERC-20 token balances (code exists, but token addresses are placeholders)
- ⚠️ Token prices (CoinGecko integration works, but only for ETH, USDC, WBTC, USDT)

**Not Integrated:**

- ❌ DEX swap execution (swap screen is UI-only)
- ❌ EIP-712 typed data signing (handler returns unsupported error)
- ❌ ENS resolution (TODO in send.tsx)

### Contract Interaction Patterns

**Direct RPC Calls:**

```typescript
// services/scroll/provider.ts
const provider = new JsonRpcProvider(SCROLL_MAINNET_RPC);
const balance = await provider.getBalance(address);
```

**ERC-20 Contract Calls:**

```typescript
// services/scroll/tokens.ts
const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
const balance = await tokenContract.balanceOf(walletAddress);
```

**Transaction Sending:**

```typescript
// services/scroll/wallet.ts
const signer = wallet.connect(provider);
const txResponse = await signer.sendTransaction(transactionRequest);
```

### Libraries/Frameworks

- **ethers.js v6.0.0** - Primary Web3 library
  - Used for: Wallet creation, signing, sending transactions, contract calls
  - Location: `services/scroll/wallet.ts`, `services/scroll/tokens.ts`
- **No viem, no web3.js** - Only ethers.js

### Network Assumptions

**Current State:**

- Defaults to Scroll mainnet (chainId: 534352)
- Testnet support exists but requires code change (`ScrollProvider` constructor)
- No UI for network switching (settings store has `isTestnet` but no toggle)

**Network Configuration:**

```typescript
// services/scroll/provider.ts
export const SCROLL_MAINNET: ProviderConfig = {
  rpcUrl: 'https://rpc.scroll.io',
  chainId: 534352,
  chainName: 'Scroll',
};

export const SCROLL_TESTNET: ProviderConfig = {
  rpcUrl: 'https://sepolia-rpc.scroll.io',
  chainId: 534351,
  chainName: 'Scroll Sepolia',
};
```

**Pre-Launch Gap**: Add network switcher UI in settings or wallet screen.

### Where New Contracts or Features Should Plug In

**Adding a New Smart Contract Integration:**

1. **Create service file** in `services/scroll/` (e.g., `services/scroll/myContract.ts`)
2. **Import ethers Contract** and ScrollProvider
3. **Define ABI** (minimal interface)
4. **Create functions** that use the contract
5. **Export from service** and use in components/stores

**Example Pattern:**

```typescript
// services/scroll/myContract.ts
import { Contract } from 'ethers';
import { scrollProvider } from './provider';

const MY_CONTRACT_ABI = [
  'function myFunction(uint256 value) returns (bool)',
];

export async function callMyContract(value: bigint) {
  const provider = scrollProvider.getProvider();
  const contract = new Contract(CONTRACT_ADDRESS, MY_CONTRACT_ABI, provider);
  return await contract.myFunction(value);
}
```

**Adding a New Bridge Method:**

1. **Add method to enum** in `scrollone-sdk/core/constants.ts` (`BridgeMethod`)
2. **Create handler** in `services/bridge/handlers.ts`
3. **Register handler** in `services/bridge/bridgeService.ts::registerHandlers()`
4. **Add to web SDK** in `scrollone-sdk/web/webBridge.ts` (if needed)
5. **Update types** in `scrollone-sdk/types/` if needed

---

## 5. What Is Already Built

### ✅ Completed Features

**Core Infrastructure:**

- ✅ Project structure with Expo Router
- ✅ Theme system (colors, typography, spacing, shadows)
- ✅ Zustand state management (wallet, user, mini-apps, settings)
- ✅ UI component library (Button, Card, Header, Loading, etc.)
- ✅ Tab navigation (Wallet, Explore, Identity)
- ✅ Authentication flow (login/signup screens, AuthGuard)

**Wallet Features (Real Blockchain Integration):**

- ✅ Real wallet creation (ethers.js, SecureStore)
- ✅ Real transaction signing (ethers.js)
- ✅ Real transaction sending (on-chain)
- ✅ Real ETH balance fetching (RPC)
- ✅ Real transaction history (ScrollScan API)
- ✅ Real gas estimation
- ✅ Multi-wallet support (wallet list in SecureStore)
- ✅ Wallet overview screen with real balance
- ✅ Transaction detail screen with status polling
- ✅ Send screen (UI complete, real transactions work)
- ✅ Receive screen (QR code generation works)
- ✅ Activity screen (transaction list)

**Mini-App Ecosystem:**

- ✅ Mini-app registry (20+ Scroll dApps)
- ✅ WebView container with bridge integration
- ✅ Mini-app discovery (search, categories, featured)
- ✅ WebView bridge SDK (`scrollone-sdk/`)
- ✅ Bridge handlers (GET_ACCOUNT, GET_BALANCE, SIGN_TRANSACTION, SIGN_MESSAGE, GET_NETWORK, ESTIMATE_GAS)
- ✅ Transaction approval modal
- ✅ Bridge state synchronization

**Identity Features:**

- ✅ Profile screen (UI)
- ✅ Badges display (mock data)
- ✅ Reputation system (mock data)
- ✅ Privacy & Security screen (UI complete)
- ✅ Preferences screen (UI complete)
- ✅ Developer settings screen

**Services:**

- ✅ ScrollProvider (RPC provider)
- ✅ Wallet service (create, sign, send)
- ✅ Transaction service (fetch, send, status)
- ✅ Token service (ERC-20 balance fetching, metadata)
- ✅ Price service (CoinGecko integration)
- ✅ Bridge service (message routing, handlers)

**Security:**

- ✅ Private key encryption (Expo SecureStore)
- ✅ Biometric authentication support (expo-local-authentication installed, not fully integrated)
- ✅ Bridge origin validation (configurable)
- ✅ Bridge method allow-list (configurable)

### Technical Debt / TODOs Found in Code

**Critical TODOs:**

1. `services/scroll/tokens.ts:21` - Token addresses are placeholders, need real Scroll addresses
2. `services/bridge/handlers.ts:66` - ERC-20 token balance support in bridge (only ETH works)
3. `services/bridge/handlers.ts:219` - EIP-712 typed data signing not implemented
4. `app/(tabs)/(wallet)/send.tsx:82` - Contract address risk assessment not implemented
5. `app/(tabs)/(wallet)/send.tsx:87` - ENS resolution not implemented
6. `app/(tabs)/(wallet)/bridge.tsx:18` - Testnet bridge URL needs verification

**Code Quality Notes:**

- Some mock data still in wallet screen (`app/(tabs)/(wallet)/index.tsx` has MOCK_ASSETS and MOCK_TRANSACTIONS)
- Token addresses need to be replaced before launch
- Network switching code exists but no UI

---

## 6. What Is In Progress

### Partially Implemented Features

**Swap Functionality:**

- ✅ UI complete (`app/(tabs)/(wallet)/swap.tsx`)
- ❌ No DEX integration (no Uniswap, ScrollSwap, or other DEX API calls)
- ❌ Mock exchange rates (hardcoded 1 ETH = 2,500 USDC)
- ❌ No real swap execution

**Token Support:**

- ✅ ERC-20 token balance fetching code exists (`services/scroll/tokens.ts`)
- ✅ Token metadata fetching works
- ❌ Token addresses are placeholders (not real Scroll addresses)
- ❌ Token balance not shown in wallet overview (only ETH)
- ❌ Bridge doesn't support token balances (only ETH)

**Transaction History:**

- ✅ Real transaction fetching from ScrollScan API
- ✅ Transaction detail screen with status polling
- ⚠️ Some mock transactions still in wallet screen (should be removed)

**Settings:**

- ✅ Privacy & Security screen UI complete
- ✅ Preferences screen UI complete
- ❌ Network switching UI missing (code supports it)
- ❌ Biometric authentication not fully integrated (library installed, not used)

**WebView Bridge:**

- ✅ Core bridge protocol complete
- ✅ All major methods implemented
- ❌ SIGN_TYPED_DATA returns unsupported error
- ❌ Token balance support missing (only ETH)

### Incomplete Flows

**Send Flow:**

- ✅ UI complete
- ✅ Real transaction sending works
- ❌ ENS resolution not implemented
- ❌ Contract address risk assessment not implemented
- ❌ Asset picker missing (hardcoded ETH)

**Swap Flow:**

- ✅ UI complete
- ❌ No DEX integration
- ❌ No real exchange rates
- ❌ No swap execution

**Bridge Flow (Ethereum ↔ Scroll):**

- ✅ WebView integration (opens Scroll Bridge in WebView)
- ❌ No native bridge implementation (relies on Scroll Bridge website)

### Commented-Out Logic or Placeholders

**No commented-out code found**, but several features return placeholder/mock data:

- Token addresses in `services/scroll/tokens.ts` are placeholders
- Mock assets/transactions in wallet screen (should fetch real data)
- Swap screen uses hardcoded exchange rates

### Known Gaps Inferred from Structure

1. **No Testing**: No test files found (no `__tests__/`, no `.test.ts`, no `.spec.ts`)
2. **No CI/CD**: No GitHub Actions, no CI configuration
3. **No Error Tracking**: No Sentry, no error tracking service
4. **No Analytics**: No analytics integration
5. **No Push Notifications**: expo-notifications mentioned in IMPLEMENTATION_STATUS.md but not implemented
6. **No Network Switching UI**: Code supports it, but no toggle in settings

---

## 7. Where This Developer Is Needed MOST

### High-Impact Areas Requiring Immediate Contribution

**🔴 Critical - Pre-Launch Blockers:**

1. **Replace Placeholder Token Addresses**
   - **File**: `services/scroll/tokens.ts`
   - **Issue**: All token addresses are placeholders (`0x06eFdBFf2a14a7c8E15953D5F4e4C0A8b8b8b8b8`)
   - **Action**: Get real Scroll mainnet/testnet addresses for USDC, USDT, WBTC, DAI
   - **Impact**: Token balances won't work until this is fixed

2. **Remove Mock Data from Wallet Screen**
   - **File**: `app/(tabs)/(wallet)/index.tsx`
   - **Issue**: MOCK_ASSETS and MOCK_TRANSACTIONS still used
   - **Action**: Replace with real data fetching (already implemented in services)
   - **Impact**: Users will see incorrect/mock data

3. **Implement ERC-20 Token Balance in Bridge**
   - **File**: `services/bridge/handlers.ts::createGetBalanceHandler()`
   - **Issue**: Only ETH balance supported, tokenAddress parameter ignored
   - **Action**: Add ERC-20 balance fetching when tokenAddress provided
   - **Impact**: dApps can't query token balances via bridge

4. **Add Network Switching UI**
   - **Files**: `app/(tabs)/(identity)/preferences.tsx` or new settings screen
   - **Issue**: Code supports testnet/mainnet switching, but no UI
   - **Action**: Add toggle in settings to switch between mainnet/testnet
   - **Impact**: Users can't switch networks without code changes

**🟡 Important - Security & UX:**

5. **Implement EIP-712 Typed Data Signing**
   - **File**: `services/bridge/handlers.ts::createSignTypedDataHandler()`
   - **Issue**: Returns unsupported error
   - **Action**: Implement EIP-712 signing using ethers.js
   - **Impact**: Many dApps require EIP-712 for approvals (e.g., DEX approvals)

6. **Add Contract Address Risk Assessment**
   - **File**: `app/(tabs)/(wallet)/send.tsx`
   - **Issue**: TODO comment, no implementation
   - **Action**: Check if address is a contract, show warning if risky
   - **Impact**: Users could send to malicious contracts

7. **Implement ENS Resolution**
   - **File**: `app/(tabs)/(wallet)/send.tsx`
   - **Issue**: TODO comment, no implementation
   - **Action**: Resolve ENS names to addresses (Scroll may not support ENS, verify)
   - **Impact**: Better UX for sending (users can type names instead of addresses)

**🟢 Nice to Have - Post-Launch:**

8. **Add Testing Infrastructure**
   - **Action**: Set up Jest/React Native Testing Library
   - **Impact**: Prevent regressions, enable confident refactoring

9. **Add Error Tracking**
   - **Action**: Integrate Sentry or similar
   - **Impact**: Catch production errors, improve debugging

10. **Add Analytics**
    - **Action**: Integrate analytics service (Mixpanel, Amplitude, etc.)
    - **Impact**: Understand user behavior, prioritize features

### Bugs, Missing Logic, Scalability Risks

**Bugs:**

- None identified in code review, but testing is needed

**Missing Logic:**

- Token balance display in wallet overview (only ETH shown)
- Asset picker in send/swap screens (hardcoded ETH/USDC)
- Network switching UI (code exists, no UI)

**Scalability Risks:**

- No rate limiting on bridge methods (configurable but not implemented)
- No transaction queuing (multiple simultaneous transactions could fail)
- No caching strategy for token prices (1-minute cache may not be enough)

**Security Gaps:**

- Bridge origin validation allows all origins (`allowedOrigins: () => true`)
- No transaction simulation before approval (users can't see what will happen)
- No gas price optimization (uses current gas price, no EIP-1559 support)

---

## 8. Development Workflow

### How to Run the Project Locally

**Prerequisites:**

- Node.js v18+ (use nvm)
- Bun (latest) - package manager
- iOS: Xcode 14+ (for simulator, optional)
- Android: Android Studio (for emulator, optional)

**Setup:**

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd Scroll_One_SuperApp

# Install dependencies
bun install

# Start development server
bun run start
```

**Running on Device:**

1. Install Expo Go on your phone (iOS App Store or Google Play)
2. Run `bun run start`
3. Scan QR code with Expo Go (iOS: Camera app, Android: Expo Go app)

**Running in Browser:**

```bash
bun run start-web
```

**Running in Simulator/Emulator:**

```bash
# iOS Simulator
bun run start -- --ios

# Android Emulator
bun run start -- --android
```

### Scripts and Commands

**Available Scripts** (from `package.json`):

- `bun run start` - Start Expo dev server (mobile)
- `bun run start-web` - Start web dev server
- `bun run start-web-dev` - Start web with debug logging
- `bun run lint` - Run ESLint

**Additional Commands:**

- Clear cache: `bunx expo start --clear`
- Build for production: Requires EAS CLI (see README.md)

### Testing Approach

**Current State:**

- ❌ No test files found
- ❌ No testing framework configured
- ❌ No CI/CD pipeline

**Recommended Testing Strategy:**

1. **Unit Tests**: Test services (wallet, transactions, tokens) with Jest
2. **Integration Tests**: Test bridge handlers with real message flow
3. **E2E Tests**: Test critical flows (send transaction, bridge communication) with Detox or Maestro
4. **Manual Testing**: Test on real devices (iOS/Android) before launch

### Linting, Formatting, CI/CD

**Linting:**

- ✅ ESLint configured (`eslint.config.js`)
- ✅ Expo ESLint config
- Run: `bun run lint`

**Formatting:**

- ❌ No Prettier configured (consider adding)
- ❌ No pre-commit hooks (consider Husky)

**CI/CD:**

- ❌ No CI/CD pipeline
- ❌ No GitHub Actions
- **Pre-Launch Action**: Set up CI/CD for:
  - Linting on PR
  - Type checking
  - Build verification

---

## 9. Web3 & Security Expectations

### Signing Flows

**Transaction Signing:**

1. User initiates transaction (send screen or dApp via bridge)
2. Transaction request created with `to`, `value`, `data`
3. Gas estimated (`scrollProvider.estimateGas()`)
4. User approves in `TransactionApprovalModal`
5. Transaction signed with private key (`wallet.signTransaction()`)
6. Transaction sent to Scroll network (`signer.sendTransaction()`)
7. Transaction hash returned, status polled

**Message Signing:**

1. dApp requests signature via bridge (`SIGN_MESSAGE`)
2. Message signed with `wallet.signMessage()` (ethers.js)
3. Signature returned to dApp

**Typed Data Signing:**

- ❌ Not implemented (returns unsupported error)

### Key Management Assumptions

**Current Implementation:**

- Private keys generated using `expo-crypto.getRandomBytes(32)` (cryptographically secure)
- Keys stored encrypted in Expo SecureStore (device keychain/keystore)
- Keys never leave device (no cloud backup)
- Multiple wallets supported (wallet list in SecureStore)

**Security Practices:**

- ✅ Private keys never logged
- ✅ Keys validated before use (`isValidPrivateKey()`)
- ✅ SecureStore used for sensitive data
- ⚠️ No key derivation (BIP-44) - each wallet is independent
- ⚠️ No seed phrase backup - if device lost, wallets are lost

**Pre-Launch Consideration**: Implement seed phrase backup (BIP-39) for wallet recovery.

### Expected Safety Practices

**Code Review Checklist:**

- ✅ Never log private keys or sensitive data
- ✅ Always validate addresses before use
- ✅ Always validate transaction data before signing
- ✅ Use SecureStore for sensitive data
- ✅ Validate bridge messages before processing
- ✅ Check wallet lock state before signing

**Transaction Safety:**

- ✅ Gas estimation before sending
- ✅ Transaction approval modal (user must approve)
- ⚠️ No transaction simulation (users can't preview outcome)
- ⚠️ No gas price optimization (uses current price)

**Bridge Safety:**

- ✅ Origin validation (configurable, currently allows all)
- ✅ Method allow-list (configurable, currently allows all)
- ✅ Wallet lock checks (prevents signing when locked)
- ⚠️ No rate limiting implementation (hooks exist, not used)

### Areas That Are Sensitive and Must Not Be Changed Casually

**🔴 DO NOT MODIFY WITHOUT SECURITY REVIEW:**

1. `services/scroll/wallet.ts` - Private key generation, signing logic
2. `services/bridge/bridgeService.ts` - Bridge message handling, security checks
3. `services/bridge/handlers.ts` - Transaction signing handlers
4. `scrollone-sdk/core/validator.ts` - Message validation
5. `scrollone-sdk/native/nativeBridge.ts` - Security middleware

**🟡 REVIEW BEFORE MODIFYING:**

1. `services/scroll/provider.ts` - RPC configuration
2. `services/scroll/transactions.ts` - Transaction sending logic
3. `miniapps/WebViewContainer.tsx` - Bridge message routing
4. `store/walletStore.ts` - Wallet state management

**Safe to Modify:**

- UI components (`components/ui/`)
- Screen layouts (`app/(tabs)/`)
- Theme (`theme/`)
- Mini-app registry (`miniapps/registry.ts`)

---

## 10. Contribution Guidelines

### How to Add New Features Cleanly

**Adding a New Screen:**

1. Create file in `app/(tabs)/<tab>/<screen>.tsx`
2. Use `Screen` component wrapper
3. Use theme from `@/theme`
4. Use Zustand stores for state
5. Use services for business logic

**Adding a New Service:**

1. Create file in `services/scroll/<service>.ts`
2. Import `scrollProvider` for RPC access
3. Use ethers.js for blockchain interactions
4. Export functions, not classes
5. Add error handling and logging

**Adding a New Bridge Method:**

1. Add method to `BridgeMethod` enum in `scrollone-sdk/core/constants.ts`
2. Create handler in `services/bridge/handlers.ts`
3. Register handler in `services/bridge/bridgeService.ts::registerHandlers()`
4. Add to web SDK in `scrollone-sdk/web/webBridge.ts` (if needed)
5. Update types in `scrollone-sdk/types/` if needed
6. Test with real dApp

**Adding a New Mini-App:**

1. Add entry to `miniapps/registry.ts`
2. App will appear in Explore tab automatically
3. Test WebView loading and bridge communication

### Patterns to Follow

**State Management:**

- Use Zustand stores for global state
- Use React Query for server state (if needed)
- Keep stores focused (one store per domain)

**Error Handling:**

- Always use try/catch for async operations
- Log errors with context (`console.error('[Service] Error: ...')`)
- Return user-friendly error messages
- Use bridge error codes for bridge errors

**TypeScript:**

- Use strict types (no `any` unless necessary)
- Define interfaces for complex objects
- Use type guards for validation

**Code Organization:**

- Keep services pure (no React dependencies)
- Keep components focused (one responsibility)
- Use custom hooks for reusable logic

**Naming Conventions:**

- Components: PascalCase (`WalletScreen.tsx`)
- Services: camelCase (`walletService.ts`)
- Constants: UPPER_SNAKE_CASE (`SCROLL_MAINNET_RPC`)
- Functions: camelCase (`getBalance()`)

### Patterns to Avoid

**❌ Don't:**

- Store private keys in AsyncStorage (use SecureStore)
- Log sensitive data (private keys, addresses in logs)
- Hardcode network values (use provider config)
- Mix business logic in components (use services)
- Use `any` types (use proper TypeScript types)
- Create global singletons (use Zustand stores)
- Block UI thread (use async/await properly)
- Ignore errors (always handle errors)

**⚠️ Avoid:**

- Mock data in production code (use real data)
- Placeholder addresses (use real addresses)
- Hardcoded values (use constants or config)
- Duplicate logic (extract to services/hooks)

---

## 11. Pre-Launch Priorities

### What Must Be Production-Ready Before Launch

**🔴 Critical (Block Launch):**

1. **Replace Placeholder Token Addresses**
   - Get real Scroll mainnet addresses for USDC, USDT, WBTC, DAI
   - Update `services/scroll/tokens.ts`
   - Test token balance fetching

2. **Remove Mock Data**
   - Remove MOCK_ASSETS and MOCK_TRANSACTIONS from wallet screen
   - Use real data from services

3. **Test All Critical Flows**
   - Wallet creation
   - Transaction sending
   - Bridge communication
   - Transaction history
   - Token balances

4. **Security Audit**
   - Review private key handling
   - Review bridge security (origin validation, rate limiting)
   - Review transaction signing flow

5. **Error Handling**
   - Ensure all errors are handled gracefully
   - Add user-friendly error messages
   - Test error scenarios (network failures, RPC errors, etc.)

**🟡 Important (Should Have):**

6. **Network Switching UI**
   - Add toggle in settings
   - Test mainnet/testnet switching

7. **ERC-20 Token Balance in Bridge**
   - Implement token balance support
   - Test with real dApps

8. **EIP-712 Typed Data Signing**
   - Implement typed data signing
   - Test with DEX approvals

9. **Transaction Simulation** (Optional)
   - Show transaction preview before approval
   - Help users understand what will happen

**🟢 Nice to Have (Can Wait):**

10. **Testing Infrastructure**
    - Set up Jest
    - Add unit tests for services
    - Add integration tests for bridge

11. **Error Tracking**
    - Integrate Sentry
    - Set up error alerts

12. **Analytics**
    - Integrate analytics service
    - Track key events

### What Can Wait Until Post-Launch

- ENS resolution (Scroll may not support ENS)
- Contract address risk assessment (can add later)
- Seed phrase backup (important but not blocking)
- Push notifications
- Advanced gas optimization (EIP-1559)
- Multi-chain support (focus on Scroll first)

### Red Flags That Could Block Launch

**Security Issues:**

- Private keys exposed in logs
- Bridge allows unauthorized origins
- No transaction approval for sensitive operations
- Weak key generation

**Functionality Issues:**

- Transactions fail to send
- Bridge communication broken
- Wallet creation fails
- Balance fetching broken

**Data Issues:**

- Mock data in production
- Placeholder addresses in production
- Incorrect token addresses

**UX Issues:**

- No error messages for failures
- No loading states
- Broken navigation
- Crashes on common flows

---

## Additional Resources

### Documentation Files

- **`README.md`** - General project overview
- **`IMPLEMENTATION_STATUS.md`** - Feature completion status
- **`WEBVIEW_BRIDGE_GUIDE.md`** - Detailed bridge integration guide
- **`scrollone-sdk/README.md`** - SDK documentation
- **`scrollone-sdk/IMPLEMENTATION.md`** - SDK implementation status

### External Resources

- [Scroll Documentation](https://docs.scroll.io/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

### Key Contacts

- Check with team lead for:
  - Real Scroll token addresses
  - RPC endpoint configuration
  - Security review process
  - Launch timeline

---

## Quick Reference: Common Tasks

### How to Send a Transaction

```typescript
import { sendTransaction } from '@/services/scroll/transactions';
import { scrollProvider } from '@/services/scroll/provider';

const tx = await sendTransaction(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // to
  '0.1', // amount (ETH)
  'ETH' // symbol
);
```

### How to Fetch Balance

```typescript
import { scrollProvider } from '@/services/scroll/provider';

const balance = await scrollProvider.getBalance('0x...');
```

### How to Add a Bridge Handler

```typescript
// 1. Add to BridgeMethod enum in scrollone-sdk/core/constants.ts
export enum BridgeMethod {
  // ... existing methods
  MY_NEW_METHOD = 'MY_NEW_METHOD',
}

// 2. Create handler in services/bridge/handlers.ts
export function createMyNewMethodHandler() {
  return async (payload: unknown, context: HandlerContext) => {
    // Handler logic
    return result;
  };
}

// 3. Register in services/bridge/bridgeService.ts
this.nativeBridge.register(BridgeMethod.MY_NEW_METHOD, createMyNewMethodHandler());
```

### How to Add a Mini-App

```typescript
// miniapps/registry.ts
export const MINIAPPS: MiniApp[] = [
  // ... existing apps
  {
    id: 'myapp',
    name: 'My App',
    url: 'https://myapp.com',
    icon: '🎯',
    description: 'My app description',
    category: 'DeFi',
    featured: false,
    verified: true,
  },
];
```

---

**End of Onboarding Document**

This document reflects the current state of the codebase as of the analysis date. For the most up-to-date information, refer to the codebase and team discussions.
