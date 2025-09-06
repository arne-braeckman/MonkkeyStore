# Unified Project Structure

```
monkkey-webshop/
├── .github/
│ └── workflows/
├── apps/
│ └── web/
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── styles/
│ │ └── trpc/
│ ├── types/
│ └── package.json
├── packages/
│ ├── shared-types/
│ └── ui/
├── docs/
├── infrastructure/
├── package.json # CRITICAL: This is the root package.json for the monorepo
├── tsconfig.json
└── README.md
```
