# Project: Blog API - Server

## What I've learned

### CommonJS and ESM contradiction in Prisma

**SOLUTION**

1. Modify your `tsconfig.ts` like this:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "CommonJS",
    "lib": ["ESNext"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

2. Remove `"type": "module"` from `package.json`

3. Change all imports to remove `.js` extensions

```TypeScript
import authRoutes from './routes/auth.routes';  // Remove .js
```

## Generate a random secret using Node’s crypto module

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
