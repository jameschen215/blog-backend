# Project: Blog API - Server

## App structure

- src
  - config
    - passport.config.ts
  - controller
    - auth.controller.ts
    - post.controller.ts
    - comment.controller.ts
  - generated
  - lib
    - prisma.ts
  - middleware
    - auth.ts
    - validate.ts
  - routes
    auth.routes.ts
    post.routes.ts
  - types
    - express.d.ts
  - validators
    - auth.validators.ts
    - post.validator.ts
    - comment.validator.ts
  - index.ts

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

temporary for commit message:

1. 'READER' role in register controller should be 'USER'
2. Use published === undefined to check if boolean variable have a value
   in updatePost controller
