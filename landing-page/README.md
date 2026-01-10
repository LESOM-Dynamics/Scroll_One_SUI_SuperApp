# Scroll One SuperApp - Landing Page

A world-class, modern landing page for Scroll One SuperApp, built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

## 🚀 Features

- **Modern Design**: Beautiful, responsive design with glassmorphism effects
- **Smooth Animations**: Powered by Framer Motion for engaging user experience
- **Dark Mode**: Optimized dark theme with gradient accents
- **Mobile First**: Fully responsive design that works on all devices
- **SEO Optimized**: Built-in metadata and Open Graph tags
- **Fast Performance**: Optimized for speed and Core Web Vitals
- **Super Admin Dashboard**: Hidden administrative interface at `/admin-super` (Super Admin access required)

## 📦 Installation

```bash
# Install dependencies
npm install
# or
bun install
```

## 🏃 Development

```bash
# Start development server
npm run dev
# or
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Build

```bash
# Build for production
npm run build
# or
bun run build

# Start production server
npm start
# or
bun start
```

## 🚢 Deploy to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and deploy

### Option 3: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will auto-configure and deploy

## 📝 Customization

### Update Download Links

Edit `app/page.tsx` and update the download links:

- **iOS App Store**: Update the `href` in the iOS download card
- **Google Play Store**: Update the `href` in the Android download card
- **APK Download**: Update the `href` in the APK download card (or upload APK to `/public/downloads/`)

### Update Content

All content is in `app/page.tsx`. You can easily customize:
- Hero section text
- Features list
- About section
- Footer links

### Update Colors

Edit `tailwind.config.ts` to customize the color scheme, especially the `scroll` color palette.

## 📁 Project Structure

```
landing-page/
├── app/
│   ├── globals.css      # Global styles and Tailwind directives
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Main landing page
│   └── admin-super/     # Super Admin Dashboard (hidden route)
│       └── page.tsx     # Admin dashboard page
├── components/
│   └── admin/           # Admin dashboard components
├── lib/
│   └── adminApi.ts      # Admin API client
├── public/              # Static assets (add your APK here)
├── tailwind.config.ts   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
├── next.config.js       # Next.js configuration
├── vercel.json          # Vercel deployment config
└── package.json         # Dependencies
```

## 🛡️ Super Admin Dashboard

The landing page includes a hidden Super Admin Dashboard accessible at `/admin-super`.

**Features:**
- User management (search, filter, update roles/status)
- Transaction monitoring
- Mini-app management (verify, feature)
- Security event monitoring
- System health metrics
- Complete audit log

**Setup:**
1. See [ADMIN_DASHBOARD_SETUP.md](../ADMIN_DASHBOARD_SETUP.md) for setup instructions
2. Create Super Admin user in database
3. Set `NEXT_PUBLIC_API_URL` in `.env.local`
4. Access at `http://localhost:3000/admin-super`

**Documentation:**
- [ADMIN_DASHBOARD_DOCUMENTATION.md](../ADMIN_DASHBOARD_DOCUMENTATION.md) - Complete documentation
- [ADMIN_DASHBOARD_SETUP.md](../ADMIN_DASHBOARD_SETUP.md) - Setup guide
- [ADMIN_DASHBOARD_SUMMARY.md](../ADMIN_DASHBOARD_SUMMARY.md) - Implementation summary

## 🎨 Design Features

- **Glassmorphism**: Modern glass-effect cards
- **Gradient Text**: Eye-catching gradient text effects
- **Smooth Scroll**: Smooth scrolling navigation
- **Hover Effects**: Interactive hover states
- **Animations**: Fade-in and slide-up animations
- **Glow Effects**: Subtle glow on interactive elements

## 🔗 Links to Update

Before deploying, make sure to update:

1. **App Store Link**: `https://apps.apple.com/app/scroll-one-superapp`
2. **Play Store Link**: `https://play.google.com/store/apps/details?id=app.rork.scroll_one_superapp`
3. **APK Download Path**: `/downloads/scroll-one-superapp.apk` (upload APK to `public/downloads/`)
4. **Footer Links**: Update documentation, support, and legal links

## 📱 Adding APK Download

1. Create `public/downloads/` directory
2. Place your APK file as `scroll-one-superapp.apk`
3. The download link will automatically work

## 🌐 SEO

The landing page includes:
- Meta tags for SEO
- Open Graph tags for social sharing
- Twitter Card support
- Semantic HTML structure

## 📄 License

Private and proprietary. All rights reserved.

---

Built with ❤️ for Scroll One SuperApp
