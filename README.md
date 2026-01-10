# Scroll One SuperApp

<div align="center">

![Scroll One SuperApp](https://img.shields.io/badge/Scroll_One-SuperApp-00D9FF?style=for-the-badge&logo=ethereum&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=for-the-badge)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-~54.0.27-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

**A comprehensive super app ecosystem built on the Scroll blockchain, integrating wallet, identity, and a diverse mini-app marketplace..**

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**Scroll One SuperApp** is a mobile-first crypto SuperApp built exclusively on the Scroll blockchain (Ethereum L2). It serves as a unified gateway to the Scroll ecosystem, combining a self-custodial wallet with real blockchain integration, a WebView-based dApp marketplace, and decentralized identity management.

### 🎥 Demo Video

Watch the V1 demo: [https://youtu.be/BTva_cgqkRI](https://youtu.be/BTva_cgqkRI)

### Key Highlights

- 🔐 **Self-Custodial Wallet**: Real blockchain integration using ethers.js v6 with secure private key management
- 🌉 **WebView Bridge SDK**: Custom SDK (`scrollone-sdk`) enabling secure communication between native wallet and WebView-hosted dApps
- 🆔 **Decentralized Identity**: User profiles with reputation, badges, and achievements
- 🎯 **Mini-App Ecosystem**: Discover and use real Scroll-native dApps (SyncSwap, Skydrome, LayerBank, Aave v3, etc.)
- 🌐 **Cross-Platform**: Native iOS, Android, and Web support
- ⚡ **Modern Stack**: React Native, Expo, TypeScript, Zustand, and React Query
- ⛓️ **Scroll-Native**: Built exclusively for Scroll blockchain with Scroll-specific RPC endpoints and integrations

---

## ✨ Features

### 💼 Wallet

- **Real Blockchain Integration**: Wallet creation, signing, and transaction sending using ethers.js v6
- **Send & Receive**: Transfer ETH and tokens on the Scroll network
- **Transaction History**: Real-time transaction tracking via ScrollScan API
- **Multi-Wallet Support**: Create and manage multiple wallets
- **Gas Estimation**: Real-time gas estimation before transactions
- **Activity Tracking**: Detailed transaction history with status polling
- **Secure Storage**: Private keys encrypted with Expo SecureStore (device keychain/keystore)
- **Bridge Integration**: Native bridge support for Ethereum ↔ Scroll transfers
- **On-Ramp Support**: Integrated fiat on-ramp providers (Ramp, MoonPay, Transak)

### 🆔 Identity

- **Scroll ID**: Unique decentralized identifier
- **Reputation System**: Earn reputation through app usage
- **Badges & Achievements**: Collect and display achievements
- **User Profile**: Customizable profile with stats and history

### 🔍 Explore

- **Mini-App Discovery**: Browse categorized applications
- **Featured Apps**: Highlighted popular and verified apps
- **Category Filtering**: Filter by DeFi, NFT, Gaming, Social, and more
- **WebView Integration**: Seamless in-app experience for mini-apps

### 📱 Mini-App Categories

The app integrates real Scroll-native dApps from the official Scroll ecosystem:

- **DeFi DEXes**: SyncSwap, Skydrome, iZiSwap
- **Lending**: LayerBank, Aave v3 (Scroll)
- **Bridge**: Scroll Bridge (official)
- **On-Ramp**: Ramp, MoonPay, Transak
- **NFT**: NFTScan (Scroll)
- **Tools**: ScrollScan (block explorer)

### 🌉 WebView Bridge SDK

- **Custom SDK**: Framework-agnostic `scrollone-sdk` for secure dApp integration
- **Bridge Methods**: GET_ACCOUNT, GET_BALANCE, SIGN_TRANSACTION, SIGN_MESSAGE, GET_NETWORK, ESTIMATE_GAS
- **Transaction Approval**: Native modal for user transaction approvals
- **Secure Communication**: PostMessage-based bridge with origin validation
- **Permissions System** (Planned): ERC-7715-inspired fine-grained permissions for reduced approval prompts - see [PERMISSIONS_SYSTEM_IMPLEMENTATION.md](./Technical_Docs/PERMISSIONS_SYSTEM_IMPLEMENTATION.md)

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm)
- **Bun** (latest | Recommended) - [Install Bun](https://bun.sh/docs/installation)
- **iOS Development** (optional): Xcode 14+ for iOS Simulator
- **Android Development** (optional): Android Studio for Android Emulator

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone <YOUR_GIT_URL>
   cd Scroll_One_SuperApp
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up backend (optional but recommended)**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start PostgreSQL and Redis with Docker
   docker-compose up -d postgres redis
   
   # Initialize database
   psql -U postgres -d scroll_one -f database/schema.sql
   
   # Start backend server
   npm run dev
   
   cd ..
   ```

4. **Start the mobile app development server**

   ```bash
   # For web preview
   bun run start-web
   
   # For mobile (iOS/Android)
   bun run start
   ```

---

## 🏃 Quick Start

### Running on Your Phone (Recommended)

1. **Download Expo Go**:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start the development server**:

   ```bash
   bun run start
   ```

3. **Scan the QR code** displayed in your terminal with:
   - **iOS**: Camera app or Expo Go
   - **Android**: Expo Go app

### Running in Browser

```bash
bun run start-web
```

The app will open automatically in your default browser with hot-reload enabled.

### Running in Simulator/Emulator

```bash
# iOS Simulator (requires Xcode)
bun run start -- --ios

# Android Emulator (requires Android Studio)
bun run start -- --android
```

---

## 📁 Project Structure

```
Scroll_One_SuperApp/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── (wallet)/            # Wallet tab screens
│   │   │   ├── index.tsx        # Wallet overview (balance, assets)
│   │   │   ├── send.tsx         # Send tokens
│   │   │   ├── receive.tsx      # Receive (QR code)
│   │   │   ├── swap.tsx         # Token swap (UI)
│   │   │   ├── bridge.tsx       # Bridge to Ethereum (WebView)
│   │   │   ├── deposit.tsx      # Deposit/on-ramp (WebView)
│   │   │   ├── activity.tsx     # Transaction history
│   │   │   └── transaction/[id].tsx  # Transaction detail
│   │   ├── (explore)/           # Explore tab (mini-apps)
│   │   │   ├── index.tsx        # Mini-app discovery
│   │   │   └── [appId].tsx      # Mini-app detail/WebView
│   │   ├── (identity)/          # Identity tab
│   │   │   ├── index.tsx        # Profile, badges, reputation
│   │   │   ├── privacy-security.tsx  # Privacy settings
│   │   │   ├── preferences.tsx  # App preferences
│   │   │   └── developer-settings.tsx  # Developer tools
│   │   └── _layout.tsx          # Tab layout config
│   ├── _layout.tsx              # Root layout (QueryClient, AuthGuard)
│   └── +not-found.tsx           # 404 screen
├── components/                   # Reusable React components
│   ├── auth/
│   │   └── AuthGuard.tsx        # Route protection, wallet check
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
│   └── useAppInitialization.ts  # App startup logic (wallet loading)
├── landing-page/                # Separate Next.js landing page
│   ├── app/                     # Next.js app directory
│   ├── components/
│   └── package.json             # Separate package.json
├── miniapps/
│   ├── registry.ts              # Mini-app registry (Scroll-native dApps)
│   └── WebViewContainer.tsx     # WebView wrapper with bridge integration
├── scrollone-sdk/               # Custom WebView bridge SDK
│   ├── core/                    # Protocol, validation, errors
│   ├── web/                     # window.scrollOne implementation
│   ├── native/                  # Native bridge router
│   ├── types/                   # TypeScript types
│   └── README.md                # SDK documentation
├── services/                     # Business logic layer (no React)
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
├── backend/                     # Backend API service (Node.js/Express)
│   ├── src/                     # Backend source code
│   │   ├── config/              # Configuration (DB, Redis, Logger)
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # Auth, validation, error handling
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic (user, transaction, token, etc.)
│   │   ├── utils/               # Helpers and utilities
│   │   ├── jobs/                # Background jobs (transaction indexer, price updater)
│   │   └── index.ts             # Entry point
│   ├── database/                # Database schema and migrations
│   ├── docs/                    # Backend documentation
│   │   ├── ARCHITECTURE.md      # System architecture
│   │   ├── API.md               # API documentation
│   │   └── DEPLOYMENT.md        # Deployment guide
│   ├── package.json             # Backend dependencies
│   ├── Dockerfile               # Docker configuration
│   └── docker-compose.yml       # Docker Compose setup
├── app.json                     # Expo configuration
├── package.json                 # Main dependencies
├── tsconfig.json                # TypeScript config
├── WEB3_ENGINEER_ONBOARDING.md  # Detailed onboarding guide
├── WEBVIEW_BRIDGE_GUIDE.md      # Bridge integration guide
└── IMPLEMENTATION_STATUS.md     # Feature completion status
```

---

## 🏗️ Architecture

### Tech Stack

**Mobile App**:

- **Framework**: React Native 0.81.5 with Expo ~54.0.27
- **Routing**: Expo Router (file-based routing, similar to Next.js)
- **Language**: TypeScript 5.9.2 (strict mode)
- **State Management**:
  - Zustand 5.0.2 (client state: wallet, user, mini-apps, settings)
  - React Query (@tanstack/react-query) for server state
- **Blockchain**: ethers.js v6.0.0 (wallet operations, signing, transactions)
- **Icons**: Lucide React Native
- **Storage**:
  - Expo SecureStore (encrypted private keys, wallet data)
  - AsyncStorage (non-sensitive preferences)
- **WebView**: React Native WebView 13.15.0
- **UI Components**: Custom design system in `theme/`

**Backend API** (Optional):
- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Authentication**: JWT with wallet signature verification
- **Background Jobs**: node-cron for scheduled tasks

### Backend/Services Architecture

**Hybrid Architecture**: The app combines client-side blockchain operations with an optional backend API for enhanced features:

**Client-Side (Mobile App)**:

- **Blockchain RPC**: Direct calls to Scroll RPC endpoints
- **Wallet Operations**: Local wallet creation, signing, and transaction sending
- **Local Storage**: Encrypted SecureStore for sensitive data (private keys)

**Backend API** (Optional, located in `backend/`):

- **User & Identity Management**: User profiles, badges, reputation system
- **Transaction Indexing**: Automated blockchain transaction indexing and history
- **Mini-App Registry**: Dynamic app discovery, analytics, and usage tracking
- **Token Management**: Multi-token support with real-time price updates
- **Notification System**: Push and in-app notifications
- **Analytics**: User behavior tracking and insights
- **Caching Layer**: Redis for performance optimization

The mobile app can operate fully standalone (client-side only) or connect to the backend API for enhanced features like user profiles, transaction history indexing, and analytics.

See [backend/README.md](./backend/README.md) for complete backend documentation.

### State Management

The app uses **Zustand** for client-side state management with four main stores:

- **`walletStore`**: Wallet address, balance, transaction history, multi-wallet support
- **`userStore`**: User profile, badges, reputation, Scroll ID
- **`miniAppStore`**: Mini-app favorites, recent apps, usage stats
- **`settingsStore`**: App settings (theme, network, KYC status)

### Blockchain Integration

**Scroll-Native Implementation:**

- **Scroll Provider**: Custom RPC provider with Scroll-specific endpoints
  - Mainnet: `https://rpc.scroll.io` (chainId: 534352)
  - Testnet: `https://sepolia-rpc.scroll.io` (chainId: 534351)
- **Wallet Service**: Real wallet creation, signing, and sending using ethers.js
- **Transaction Service**:
  - Client-side: Real transaction sending and history fetching via ScrollScan API
  - Backend: Automated transaction indexing and enhanced history tracking
- **Token Service**: ERC-20 token balance fetching and metadata
- **Price Service**:
  - Client-side: CoinGecko integration for real-time token prices
  - Backend: Automated price updates and caching

### WebView Bridge Architecture

The app includes a custom **WebView Bridge SDK** (`scrollone-sdk`) that enables secure communication between native wallet functionality and WebView-hosted dApps:

- **Protocol**: PostMessage-based communication with validation
- **Security**: Origin validation, method allow-list, wallet lock checks
- **Methods**: GET_ACCOUNT, GET_BALANCE, SIGN_TRANSACTION, SIGN_MESSAGE, GET_NETWORK, ESTIMATE_GAS
- **Flow**: dApp (WebView) → `window.scrollOne` API → postMessage → WebViewContainer → bridgeService → handlers → wallet/transaction services → Scroll blockchain

### Component Communication Flow

**Mobile App Flow:**
```
React Components (app/, components/)
    ↓
Zustand Stores (store/)
    ↓
Services Layer (services/scroll/, services/bridge/)
    ↓
Blockchain / External APIs (Scroll RPC, CoinGecko, ScrollScan)
    ↓
Backend API (optional, for enhanced features)
```

**Backend API Flow:**

```
API Requests
    ↓
Routes & Middleware (auth, validation, rate limiting)
    ↓
Controllers
    ↓
Services Layer (business logic)
    ↓
Data Layer (PostgreSQL, Redis, Blockchain RPC)
    ↓
Background Jobs (transaction indexing, price updates)
```

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server (mobile)
bun run start

# Start web development server
bun run start-web

# Start web with debug logging
bun run start-web-dev

# Lint code
bun run lint
```

### Code Style

- **Linter**: ESLint with Expo config
- **Type Checking**: TypeScript strict mode
- **Formatting**: Follow React Native and Expo conventions

### Adding a New Mini-App

1. **Register in `miniapps/registry.ts`**:

   ```typescript
   {
     id: 'yourapp',
     name: 'Your App',
     url: 'https://yourapp.com',
     icon: '🎯',
     description: 'Your app description',
     category: 'DeFi',
     featured: false,
     verified: true,
   }
   ```

2. **The app will automatically appear** in the Explore tab

### Adding a New Bridge Method

If you need to add new functionality that dApps can call:

1. **Add method to enum** in `scrollone-sdk/core/constants.ts` (`BridgeMethod`)
2. **Create handler** in `services/bridge/handlers.ts`
3. **Register handler** in `services/bridge/bridgeService.ts::registerHandlers()`
4. **Add to web SDK** in `scrollone-sdk/web/webBridge.ts` (if needed)
5. **Update types** in `scrollone-sdk/types/` if needed

See [WEBVIEW_BRIDGE_GUIDE.md](./WEBVIEW_BRIDGE_GUIDE.md) for detailed bridge integration documentation.

### Permissions System (Planned)

We're planning to implement an ERC-7715-inspired permissions system that allows mini-apps to request fine-grained permissions for reduced approval prompts. This will significantly improve UX for trusted mini-apps while maintaining security through limits and user control.

**Key Features**:
- Request permissions with amount, time, and contract limits
- Automatic transaction execution within permission constraints
- Usage tracking and rate limiting
- Full user control to view, modify, and revoke permissions

See [PERMISSIONS_SYSTEM_IMPLEMENTATION.md](./Technical_Docs/PERMISSIONS_SYSTEM_IMPLEMENTATION.md) for complete implementation guide.

### Custom Development Builds

For advanced native features (Face ID, push notifications, in-app purchases), create a custom development build:

```bash
# Install EAS CLI
bun i -g @expo/eas-cli

# Configure project
eas build:configure

# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Start with dev client
bun start --dev-client
```

---

## 🧪 Testing

### On Device

- Use Expo Go for basic testing
- Use custom development build for native features

### Browser Testing

```bash
bun run start-web
```

Note: Some native features may not be available in browser preview.

### Simulator/Emulator

- **iOS**: Requires Xcode and iOS Simulator
- **Android**: Requires Android Studio and Android Emulator

---

## 📦 Deployment

### iOS App Store

1. **Install EAS CLI**:

   ```bash
   bun i -g @expo/eas-cli
   ```

2. **Configure project**:

   ```bash
   eas build:configure
   ```

3. **Build for iOS**:

   ```bash
   eas build --platform ios
   ```

4. **Submit to App Store**:

   ```bash
   eas submit --platform ios
   ```

[Full iOS deployment guide](https://docs.expo.dev/submit/ios/)

### Google Play Store

1. **Build for Android**:

   ```bash
   eas build --platform android
   ```

2. **Submit to Google Play**:

   ```bash
   eas submit --platform android
   ```

[Full Android deployment guide](https://docs.expo.dev/submit/android/)

### Web Deployment

1. **Build for web**:

   ```bash
   eas build --platform web
   ```

2. **Deploy with EAS Hosting**:

   ```bash
   eas hosting:configure
   eas hosting:deploy
   ```

**Alternative platforms**:

- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Connect GitHub repo for automatic deployments

---

## 🔒 Security

- **Private Keys**:
  - Generated using cryptographically secure `expo-crypto.getRandomBytes(32)`
  - Encrypted with Expo SecureStore (device keychain/keystore)
  - Never leave the device (no cloud backup)
  - Never logged or exposed
- **Secure Storage**: Uses device keychain/keystore via Expo SecureStore
- **Biometric Auth**: Face ID/Touch ID support (library installed, requires custom build for full integration)
- **Network Security**: HTTPS-only for all API calls
- **Bridge Security**:
  - Origin validation (configurable)
  - Method allow-list (configurable)
  - Wallet lock checks before signing
  - Transaction approval modal for user confirmation
- **Transaction Safety**:
  - Gas estimation before sending
  - User approval required for all transactions
  - Address validation before transactions

**Note**: The app is currently in pre-launch. Before production launch:
- Token addresses need to be replaced with real Scroll mainnet addresses
- Security audit recommended
- Seed phrase backup implementation recommended

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write clear commit messages
- Add TypeScript types for new code
- Test on both iOS and Android when possible
- Update documentation for new features

---

## 📚 Documentation

### Documentation Index

For a complete guide to all documentation, see **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)**.

### Key Concepts

- **Scroll Blockchain**: Layer 2 Ethereum scaling solution (Ethereum L2)
- **Mini-Apps**: Web-based applications integrated via WebView with bridge SDK
- **WebView Bridge**: Custom SDK enabling dApps to securely request wallet operations
- **Scroll ID**: Decentralized identity on Scroll network
- **Reputation**: User reputation earned through app usage
- **Self-Custodial Wallet**: Users control their private keys, stored encrypted on device
- **Super Admin Dashboard**: Comprehensive administrative interface for platform management

### Project Documentation

**Mobile App Documentation**:
- **[WEB3_ENGINEER_ONBOARDING.md](./WEB3_ENGINEER_ONBOARDING.md)** - Comprehensive onboarding guide for Web3 engineers
- **[WEBVIEW_BRIDGE_GUIDE.md](./WEBVIEW_BRIDGE_GUIDE.md)** - Detailed guide for WebView bridge integration
- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - Feature completion status
- **[scrollone-sdk/README.md](./scrollone-sdk/README.md)** - WebView bridge SDK documentation
- **[Technical_Docs/PERMISSIONS_SYSTEM_IMPLEMENTATION.md](./Technical_Docs/PERMISSIONS_SYSTEM_IMPLEMENTATION.md)** - ERC-7715-inspired permissions system (planned feature)

**Backend API Documentation**:
- **[backend/README.md](./backend/README.md)** - Backend API overview and quick start
- **[backend/docs/ARCHITECTURE.md](./backend/docs/ARCHITECTURE.md)** - Complete system architecture
- **[backend/docs/API.md](./backend/docs/API.md)** - Full API reference documentation
- **[backend/docs/DEPLOYMENT.md](./backend/docs/DEPLOYMENT.md)** - Production deployment guide

**Admin Dashboard Documentation**:
- **[ADMIN_DASHBOARD_DOCUMENTATION.md](./ADMIN_DASHBOARD_DOCUMENTATION.md)** - Complete admin dashboard documentation
- **[ADMIN_DASHBOARD_SETUP.md](./ADMIN_DASHBOARD_SETUP.md)** - Quick setup and testing guide
- **[ADMIN_DASHBOARD_SUMMARY.md](./ADMIN_DASHBOARD_SUMMARY.md)** - Implementation summary and overview

### External Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Scroll Documentation](https://docs.scroll.io/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

---

## 🐛 Troubleshooting

### App Not Loading on Device

1. Ensure phone and computer are on the same WiFi network
2. Try tunnel mode: `bun start -- --tunnel`
3. Check firewall settings
4. Restart the development server

### Build Failures

1. Clear cache: `bunx expo start --clear`
2. Delete `node_modules` and reinstall:

   ```bash
   rm -rf node_modules
   bun install
   ```

3. Check [Expo troubleshooting guide](https://docs.expo.dev/troubleshooting/build-errors/)

### Native Features Not Working

- Ensure you're using a custom development build (not Expo Go) for native features like biometric auth
- Check that required permissions are configured in `app.json`
- Verify native modules are properly installed

### Wallet Issues

- **Transaction failing**: Check you have sufficient ETH for gas fees
- **Balance not updating**: Ensure RPC endpoint is accessible and correct
- **Bridge not working**: Verify dApp is using `window.scrollOne` API correctly

### WebView Bridge Issues

- **dApp can't connect**: Ensure dApp is loading `scrollone-sdk` and calling `window.scrollOne` API
- **Transaction not approving**: Check bridge origin validation settings
- See [WEBVIEW_BRIDGE_GUIDE.md](./WEBVIEW_BRIDGE_GUIDE.md) for detailed troubleshooting

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🙏 Acknowledgments

- Built with [Rork](https://rork.com) - AI-powered mobile app development
- Powered by [Expo](https://expo.dev) and [React Native](https://reactnative.dev)
- Built on [Scroll](https://scroll.io) blockchain

---

## 📞 Support

- **Documentation**:
  - Check the [Expo docs](https://docs.expo.dev/)
  - Review [WEB3_ENGINEER_ONBOARDING.md](./WEB3_ENGINEER_ONBOARDING.md) for detailed technical information
- **Issues**: Open an issue on GitHub
- **Community**: Join the Scroll community

## ⚠️ Pre-Launch Status

This app is currently in **pre-launch** status. Before production launch, ensure:

- ✅ Replace placeholder token addresses with real Scroll mainnet addresses
- ✅ Remove any mock data from wallet screens
- ✅ Complete security audit
- ✅ Test all critical flows (wallet creation, transactions, bridge communication)
- ✅ Implement error handling and user-friendly error messages

See [WEB3_ENGINEER_ONBOARDING.md](./WEB3_ENGINEER_ONBOARDING.md) for detailed pre-launch checklist.

---

<div align="center">

**Made with ❤️ for the Scroll ecosystem**

[Scroll](https://scroll.io) • [Expo](https://expo.dev) • [React Native](https://reactnative.dev)

</div>
