# Scroll One SuperApp

<div align="center">

![Scroll One SuperApp](https://img.shields.io/badge/Scroll-One%20SuperApp-00D9FF?style=for-the-badge&logo=ethereum&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=for-the-badge)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-~54.0.27-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

**A comprehensive super app ecosystem built on the Scroll blockchain, integrating wallet, identity, and a diverse mini-app marketplace..**

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**Scroll One SuperApp** is a next-generation mobile application that serves as a unified gateway to the Scroll blockchain ecosystem. It combines a secure crypto wallet, decentralized identity management, and an extensive marketplace of mini-applications covering DeFi, NFTs, gaming, social networking, and more.

### 🎥 Demo Video

Watch the V1 demo: [https://youtu.be/BTva_cgqkRI](https://youtu.be/BTva_cgqkRI)

### Key Highlights

- 🔐 **Secure Wallet**: Built-in wallet with send, receive, and swap functionality
- 🆔 **Decentralized Identity**: User profiles with reputation, badges, and achievements
- 🎯 **Mini-App Ecosystem**: Discover and use 20+ integrated applications
- 🌐 **Cross-Platform**: Native iOS, Android, and Web support
- ⚡ **Modern Stack**: React Native, Expo, TypeScript, and Zustand

---

## ✨ Features

### 💼 Wallet

- **Send & Receive**: Transfer tokens on the Scroll network
- **Token Swap**: Exchange tokens with integrated DEX functionality
- **Balance Tracking**: Real-time balance updates and transaction history
- **Secure Storage**: Private keys encrypted with Expo SecureStore

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

- **DeFi**: ScrollSwap, Scroll Lend, Scroll Trade
- **Bridge**: Scroll Bridge
- **Payments**: ZK Pay
- **NFT**: Scroll NFT, Scroll Photo
- **Gaming**: Scroll Gaming, Scroll Pets
- **Social**: Scroll Social, Scroll Chat
- **Governance**: Scroll DAO, Scroll Vote
- **AI**: Scroll AI
- **Entertainment**: Scroll Music, Scroll Tickets
- **Education**: Scroll Learn
- **Health**: Scroll Health, Scroll Fitness

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm)
- **Bun** (latest) - [Install Bun](https://bun.sh/docs/installation)
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

3. **Start the development server**

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
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   │   ├── (wallet)/            # Wallet tab
│   │   │   ├── index.tsx        # Wallet overview
│   │   │   ├── send.tsx         # Send tokens
│   │   │   ├── receive.tsx      # Receive tokens
│   │   │   └── swap.tsx         # Token swap
│   │   ├── (explore)/           # Explore tab
│   │   │   ├── index.tsx        # Mini-apps list
│   │   │   └── [appId].tsx      # Mini-app detail
│   │   ├── (identity)/          # Identity tab
│   │   │   └── index.tsx        # User profile
│   │   └── _layout.tsx          # Tab layout config
│   ├── _layout.tsx              # Root layout
│   └── +not-found.tsx           # 404 screen
├── components/                   # Reusable components
│   ├── layout/                  # Layout components
│   │   └── Screen.tsx
│   └── ui/                      # UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Header.tsx
│       ├── Loading.tsx
│       ├── CategoryTabs.tsx
│       ├── MiniAppGridCard.tsx
│       └── MiniAppListCard.tsx
├── constants/                    # App constants
│   └── color.ts
├── hooks/                        # Custom React hooks
│   └── useAppInitialization.ts
├── miniapps/                     # Mini-app integration
│   ├── registry.ts              # Mini-app registry
│   └── WebViewContainer.tsx     # WebView wrapper
├── services/                     # Business logic
│   └── scroll/                  # Scroll blockchain services
│       ├── provider.ts          # Scroll RPC provider
│       ├── wallet.ts            # Wallet operations
│       └── transactions.ts      # Transaction handling
├── store/                        # State management (Zustand)
│   ├── walletStore.ts           # Wallet state
│   ├── userStore.ts             # User/identity state
│   └── miniAppStore.ts          # Mini-app state
├── theme/                        # Design system
│   ├── colors.ts                # Color palette
│   ├── typography.ts            # Font styles
│   ├── spacing.ts               # Spacing scale
│   ├── shadows.ts               # Shadow presets
│   └── index.ts                 # Theme exports
├── assets/                       # Static assets
│   └── images/                  # Icons and images
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

---

## 🏗️ Architecture

### Tech Stack

- **Framework**: React Native 0.81.5 with Expo ~54.0.27
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript 5.9.2
- **State Management**: Zustand 5.0.2
- **Server State**: React Query (@tanstack/react-query)
- **Icons**: Lucide React Native
- **Storage**: Expo SecureStore (encrypted), AsyncStorage
- **WebView**: React Native WebView

### State Management

The app uses **Zustand** for client-side state management with three main stores:

- **`walletStore`**: Wallet address, balance, transaction history
- **`userStore`**: User profile, badges, reputation, Scroll ID
- **`miniAppStore`**: Mini-app favorites, recent apps, usage stats

### Blockchain Integration

- **Scroll Provider**: Custom RPC provider for Scroll network
- **Wallet Service**: Secure wallet creation and management
- **Transaction Service**: Send, receive, and swap operations

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

- **Private Keys**: Encrypted with Expo SecureStore
- **Secure Storage**: Uses device keychain/keystore
- **Biometric Auth**: Face ID/Touch ID support (requires custom build)
- **Network Security**: HTTPS-only for all API calls

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

### Key Concepts

- **Scroll Blockchain**: Layer 2 Ethereum scaling solution
- **Mini-Apps**: Web-based applications integrated via WebView
- **Scroll ID**: Decentralized identity on Scroll network
- **Reputation**: User reputation earned through app usage

### External Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Scroll Documentation](https://docs.scroll.io/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)

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

- Ensure you're using a custom development build (not Expo Go)
- Check that required permissions are configured in `app.json`
- Verify native modules are properly installed

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

- **Documentation**: Check the [Expo docs](https://docs.expo.dev/)
- **Issues**: Open an issue on GitHub
- **Community**: Join the Scroll community

---

<div align="center">

**Made with ❤️ for the Scroll ecosystem**

[Scroll](https://scroll.io) • [Expo](https://expo.dev) • [React Native](https://reactnative.dev)

</div>
