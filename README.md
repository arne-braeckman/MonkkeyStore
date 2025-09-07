# Monkkey Webshop

A modern e-commerce platform for unique, personalized gifts built with Next.js, TypeScript, and the T3 stack.

## 🛠 Tech Stack

- **Framework:** Next.js 14.1.0 with App Router
- **Language:** TypeScript 5.3.3
- **Database:** Convex (serverless)
- **API:** tRPC for end-to-end type safety
- **Styling:** Tailwind CSS + Shadcn UI
- **Authentication:** NextAuth.js
- **Deployment:** Vercel

## 🏗 Project Structure

```
monkkey-webshop/
├── apps/
│   └── web/                 # Next.js application
│       ├── src/
│       │   ├── app/        # App Router pages
│       │   ├── components/ # React components
│       │   └── trpc/       # tRPC client setup
│       └── types/          # App-specific types
├── packages/
│   ├── shared-types/       # Shared TypeScript types
│   └── ui/                 # Shared UI components
└── docs/                   # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd monkkey-webshop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests (configured in Story 1.6)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🧪 Development

### Code Quality

This project uses:
- **ESLint** with TypeScript and Next.js rules
- **Prettier** for consistent code formatting
- **TypeScript strict mode** for type safety

### Monorepo Structure

This project uses npm workspaces for monorepo management:
- Apps are located in `apps/`
- Shared packages are in `packages/`
- Cross-package imports work out of the box

### TypeScript Configuration

- Root `tsconfig.json` with composite project references
- Strict mode enabled for all packages
- Path aliases configured for clean imports

## 🔧 Troubleshooting

### Common Issues

1. **Module resolution errors**
   - Ensure you're in the project root when running commands
   - Check that `npm install` completed successfully

2. **TypeScript errors**
   - Run `npm run build` to check for type issues
   - Ensure all packages have their dependencies installed

3. **ESLint configuration issues**
   - Check that the project root has `.eslintrc.js`
   - Verify TypeScript parser is configured correctly

### Development Environment

- **Node.js version:** Check with `node --version` (should be 18+)
- **npm version:** Check with `npm --version` (should be 9+)
- **TypeScript:** Installed at exact version 5.3.3

## 📚 Next Steps

This foundation setup enables:
1. **Story 1.2:** Database setup with Convex
2. **Story 1.3:** tRPC API layer configuration
3. **Story 1.4:** Tailwind CSS and Shadcn UI setup
4. **Story 1.5:** First product display page
5. **Story 1.6:** Full testing and CI/CD setup

## 🤝 Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write TypeScript with strict mode
3. Test your changes thoroughly
4. Update documentation as needed

## 📄 License

Private project for Monkkey Webshop.