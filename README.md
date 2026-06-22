# Scroll One SuperApp

<div align="center">

![Scroll One SuperApp](https://img.shields.io/badge/Scroll_One-SuperApp-00D9FF?style=for-the-badge&logo=ethereum&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=for-the-badge)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-~54.0.27-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

**A comprehensive super app ecosystem built on the Scroll blockchain, integrating wallet, identity, and a diverse mini-app marketplace.**

[Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**Scroll One SuperApp** is a mobile-first crypto SuperApp built exclusively on the SUI blockchain. It serves as a unified gateway to the Scroll ecosystem, combining a self-custodial wallet with real blockchain integration, a WebView-based dApp marketplace, and decentralized identity management.

### Key Highlights

- 🔐 **Self-Custodial Wallet**: Real blockchain integration using ethers.js v6 with secure private key management
- 🌉 **WebView Bridge SDK**: Custom SDK (`scrollone-sdk`) enabling secure communication between native wallet and WebView-hosted dApps
- 🆔 **Decentralized Identity**: User profiles with reputation, badges, and achievements
- 🎯 **Mini-App Ecosystem**: Discover and use real Scroll-native dApps (SyncSwap, Skydrome, LayerBank, Aave v3, etc.)
- 🌐 **Cross-Platform**: Native iOS, Android, and Web support
- ⚡ **Modern Stack**: React Native, Expo, TypeScript, Zustand, and React Query
- ⛓️ **Scroll-Native**: Built exclusively for Scroll blockchain with Scroll-specific RPC endpoints and integrations

---

## 🏗️ Architecture

The system uses a **hybrid architecture** combining:

- **Client-Side**: Direct blockchain operations via Scroll RPC, local wallet management
- **Backend API** (Optional): Enhanced features like user profiles, transaction indexing, analytics
- **WebView Bridge**: Secure communication between native wallet and mini-apps

```
Mobile App (React Native)
    ↓
Services Layer (Wallet, Transactions, Bridge)
    ↓
Scroll Blockchain (RPC) + Backend API (Optional)
```

For detailed architecture documentation, see [System Overview](./docs/architecture/system-overview.md).

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Bun** (latest | Recommended)
- **iOS Development** (optional): Xcode 14+ for iOS Simulator
- **Android Development** (optional): Android Studio for Android Emulator

### Installation

1. **Clone the repository**

   ```bash
   git clone <YOUR_GIT_URL>
   cd Scroll_One_SuperApp
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Start the development server**

   ```bash
   # For mobile (iOS/Android)
   bun run start
   
   # For web preview
   bun run start-web
   ```

### Running on Your Phone

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

For detailed setup instructions, see [Deployment Guide](./docs/deployment/environments.md).

---

## 📚 Documentation

**All documentation is now centralized in the [`/docs`](./docs/) directory.**

### Quick Links

- **[Documentation Index](./docs/README.md)** - Complete documentation navigation
- **[System Overview](./docs/architecture/system-overview.md)** - High-level architecture
- **[WebView Bridge Guide](./docs/integrations/webview-bridge.md)** - Mini-app integration
- **[API Reference](./docs/backend/api-design.md)** - Backend API documentation
- **[Implementation Status](./docs/reference/implementation-status.md)** - Feature completion tracking

### Documentation Structure

```
docs/
├── overview/          # Product vision, problem statement, target users
├── architecture/      # System design, data flow, Web3 architecture
├── backend/           # Backend services, database, API design
├── frontend/          # UI architecture, state management
├── integrations/      # WebView bridge, SDK reference, third-party APIs
├── security/          # Authentication, encryption, secrets management
├── deployment/        # Environments, CI/CD, production checklist
├── testing/           # Testing strategy and coverage
├── contributing/      # Contribution guide, code style
└── reference/         # Glossary, FAQ, implementation status
```

### For New Engineers

Start here for comprehensive onboarding:

1. [Product Vision](./docs/overview/product-vision.md) - What we're building
2. [System Overview](./docs/architecture/system-overview.md) - How it works
3. [WebView Bridge](./docs/integrations/webview-bridge.md) - Mini-app integration
4. [Implementation Status](./docs/reference/implementation-status.md) - Current state

### For API Integration

- [API Design](./docs/backend/api-design.md) - REST API reference
- [WebView Bridge](./docs/integrations/webview-bridge.md) - Mini-app SDK
- [SDK Reference](./docs/integrations/sdk-reference.md) - Detailed SDK docs

### For Deployment

- [Environments](./docs/deployment/environments.md) - Environment setup
- [Production Checklist](./docs/deployment/production-checklist.md) - Pre-launch requirements
- [CI/CD](./docs/deployment/ci-cd.md) - Automated deployment

---

## 🔒 Security

- **Private Keys**: Generated using cryptographically secure methods, encrypted with Expo SecureStore (device keychain/keystore), never leave the device
- **Secure Storage**: Uses device keychain/keystore via Expo SecureStore
- **Network Security**: HTTPS-only for all API calls
- **Bridge Security**: Origin validation, method allow-list, wallet lock checks, transaction approval modals

For detailed security documentation, see [Security Architecture](./docs/security/auth.md).

---

## 📦 Deployment

### Mobile Apps

- **iOS App Store**: Build with EAS Build, submit via EAS Submit
- **Google Play Store**: Build with EAS Build, submit via EAS Submit
- **APK**: See [Build APK Guide](./docs/deployment/build-apk.md) for local build instructions

### Backend

- **Production**: Docker deployment with PostgreSQL and Redis
- **Environment Variables**: Configure via `.env` file

### Landing Page

- **Vercel**: Automatic deployments via GitHub integration

For detailed deployment instructions, see [Deployment Guide](./docs/deployment/environments.md).

---

## 🤝 Contributing

We welcome contributions! Please see our [Contribution Guide](./docs/contributing/contribution-guide.md) for:

- Code style guidelines
- Development workflow
- Pull request process
- Testing requirements

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

- **Documentation**: See [Documentation Index](./docs/README.md)
- **Issues**: Open an issue on GitHub
- **Community**: Join the Scroll community

---

## ⚠️ Pre-Launch Status

This app is currently in **pre-launch** status. Before production launch, ensure:

- ✅ Replace placeholder token addresses with real Scroll mainnet addresses
- ✅ Remove any mock data from wallet screens
- ✅ Complete security audit
- ✅ Test all critical flows (wallet creation, transactions, bridge communication)
- ✅ Implement error handling and user-friendly error messages

See [Implementation Status](./docs/reference/implementation-status.md) for detailed pre-launch checklist.

---

<div align="center">

**Made with ❤️ for the Scroll ecosystem**

[Scroll](https://scroll.io) • [Expo](https://expo.dev) • [React Native](https://reactnative.dev)

</div>
