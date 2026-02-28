# LUXE OPTICS - Premium AR Sunglasses Experience

A cutting-edge web application showcasing premium luxury sunglasses with AR try-on capabilities, built with React, Vite, Three.js, and Google Mediapipe.

## 🌟 Features

- **Premium Loading Experience** - SVG wireframe animation with particles
- **Hero Section with 3D** - Floating, rotating sunglasses models
- **3D Customization Studio** - Real-time frame color, lens tint, and environment customization
- **AR Try-On** - Face tracking with Google Mediapipe for virtual try-on
- **Real-Time Dashboard** - Analytics with Chart.js
- **Luxury Design** - Premium color palette, typography, and animations
- **Custom Cursor** - Premium interaction experience
- **Smooth Animations** - GSAP and Framer Motion powered
- **Responsive** - Mobile-first design

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **3D Graphics**: Three.js with React Three Fiber
- **AR**: Google Mediapipe for face tracking
- **Animations**: GSAP & Framer Motion
- **State Management**: Zustand
- **Styling**: SCSS with BEM methodology
- **Charts**: Chart.js with react-chartjs-2

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Place your 3D models in the `public/models` folder:
   - glasses1.glb
   - glasses2.glb
   - glasses3.glb
   - glasses4.glb

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── LoadingScreen/  # Animated loading screen
│   ├── Navbar/         # Navigation bar
│   ├── Hero/           # Hero section with 3D
│   ├── Customizer/     # 3D customization studio
│   ├── ARTryOn/        # AR face tracking
│   ├── Dashboard/      # Analytics dashboard
│   ├── CustomCursor/   # Custom cursor
│   └── Footer/         # Footer
├── store/              # Zustand state management
├── styles/             # Global SCSS styles
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── assets/             # Static assets

models/                 # 3D models (.glb files)
```

## 🎨 Color Palette

- **Backgrounds**: #0A0A0A, #1A1A1A
- **Gold Accents**: #D4AF37, #C9A961
- **Silver**: #C0C0C0, #E8E8E8
- **Rose Gold**: #B76E79
- **Emerald**: #0C4B33
- **Text**: #F5F5F0, #FAF8F3

## 📝 Key Components

### LoadingScreen
Premium loading animation with SVG wireframe glasses and particles

### Hero
Full-viewport section with 3D rotating glasses and scroll indicator

### Customizer
Real-time 3D customization with:
- Frame color selection
- Lens tint options
- Environment swapping
- OrbitControls for 360° viewing

### ARTryOn
Google Mediapipe integration for face tracking and virtual try-on

### Dashboard
Real-time analytics with Chart.js visualizations

## 🚀 Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers with WebGL support

## 🔧 Configuration

### Vite Config
- Path aliases configured for cleaner imports
- GLB/GLTF assets support
- SCSS preprocessing

### TypeScript
- Strict mode enabled
- Path aliases for @components, @styles, etc.

## 🎯 Development

The project is set up with:
- Hot module replacement
- TypeScript type checking
- SCSS preprocessing
- Asset optimization

## 📄 License

Premium Commercial License

## 🤝 Support

For issues or questions, please contact support.

---

**LUXE OPTICS** - Redefining luxury eyewear since 2024
