# Auth — Полная настройка

> Аутентификация: Auth.js (основной) для Next.js, Passport.js + JWT для NestJS.
> Clerk — альтернатива для SaaS-проектов, где нужен готовый UI.

---

## 📋 СОДЕРЖАНИЕ

### Auth.js (основной — бесплатный, open-source)
1. [Настройка Auth.js](#authjs-setup)
2. [Providers](#authjs-providers)
3. [Database Adapter](#authjs-database)
4. [Защита routes](#authjs-protection)

### NestJS Backend (Passport.js + JWT)
5. [Связь стеков: Auth.js → NestJS](#cross-stack)

### Clerk (альтернатива для SaaS)
6. [Когда использовать Clerk](#clerk-when)
7. [Настройка Clerk](#clerk-setup)

8. [Checklist](#checklist)

---

## Выбор Auth-решения

| Критерий | Auth.js | Clerk |
|----------|---------|-------|
| Стоимость | Бесплатно | $0 → $25+/мес |
| Open-source | Да | Нет (SaaS) |
| Next.js интеграция | Нативная (App Router) | SDK |
| Готовый UI | Нет (свой) | Да (компоненты) |
| NestJS backend | JWT → Passport.js | Webhook sync |
| Зависимость от третьей стороны | Нет | Да |
| Кастомизация | Полная | Ограниченная |

**Рекомендация:**
- **Auth.js** — для большинства проектов (бесплатен, полный контроль, нативный Next.js)
- **Clerk** — когда нужен готовый UI для auth и управление пользователями из коробки (SaaS)

---

# AUTH.JS (ОСНОВНОЙ)

## 1. Настройка Auth.js {#authjs-setup}

### Установка:

```bash
pnpm add next-auth@beta @auth/prisma-adapter
```

### Конфигурация:

```typescript
// auth.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './lib/prisma';
import { verify } from 'argon2';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await verify(user.password, credentials.password as string);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
```

### Environment Variables:

```bash
AUTH_SECRET="your-secret-here"          # openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# Providers (добавь нужные)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### Route Handlers:

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

### Middleware:

```typescript
// middleware.ts
import { auth } from './auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isProtectedPage = req.nextUrl.pathname.startsWith('/dashboard');

  if (isProtectedPage && !isLoggedIn) {
    return Response.redirect(new URL('/auth/signin', req.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL('/dashboard', req.nextUrl));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 2. Providers {#authjs-providers}

### GitHub:

1. GitHub → Settings → Developer settings → OAuth Apps
2. New OAuth App:
   - Homepage URL: `https://your-app.com`
   - Callback URL: `https://your-app.com/api/auth/callback/github`

### Google:

1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-app.com/api/auth/callback/google`

---

## 3. Database Adapter {#authjs-database}

### Prisma Schema:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?   // Для Credentials provider
  role          Role      @default(USER)
  accounts      Account[]
  sessions      Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

enum Role {
  USER
  ADMIN
}
```

---

## 4. Защита routes {#authjs-protection}

### Server Component:

```tsx
// app/dashboard/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div>
      <h1>Привет, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### API Route:

```typescript
// app/api/user/route.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return NextResponse.json(user);
}
```

---

## 5. Связь стеков: Auth.js → NestJS {#cross-stack}

Когда Next.js (frontend) + NestJS (backend) — используй JWT для связи:

### Auth.js — выдаёт JWT:

```typescript
// auth.ts — добавить в callbacks
callbacks: {
  jwt: async ({ token, user }) => {
    if (user) {
      token.id = user.id;
      token.role = user.role;
    }
    return token;
  },
  session: ({ session, token }) => ({
    ...session,
    user: {
      ...session.user,
      id: token.id as string,
      role: token.role as string,
    },
  }),
},
session: { strategy: 'jwt' },
```

### NestJS — валидирует тот же JWT:

```typescript
// auth/jwt.strategy.ts (NestJS)
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.AUTH_SECRET, // Тот же секрет что в Auth.js
    });
  }

  validate(payload: { id: string; role: string }) {
    return { id: payload.id, role: payload.role };
  }
}
```

> AUTH_SECRET должен быть **одинаковым** в Next.js и NestJS для валидации JWT.

---

# CLERK (АЛЬТЕРНАТИВА)

## 6. Когда использовать Clerk {#clerk-when}

Clerk подходит когда:
- Нужен **готовый UI** для auth (формы, компоненты, user management)
- Проект — **SaaS** с управлением организациями
- Нет времени на кастомный auth UI
- Бюджет позволяет ($25+/мес на Pro)

### Pricing:

| План | Стоимость | MAU |
|------|-----------|-----|
| Free | $0 | 10,000 |
| Pro | $25/month | 10,000 + $0.02/MAU |
| Enterprise | Custom | Unlimited |

---

## 7. Настройка Clerk {#clerk-setup}

### Установка:

```bash
pnpm add @clerk/nextjs
```

### Environment Variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### Middleware:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Provider:

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

> Полная документация Clerk: [clerk.com/docs](https://clerk.com/docs)

---

## ✅ Checklist {#checklist}

### Auth.js (основной):

- [ ] `next-auth@beta` установлен (`pnpm add next-auth@beta`)
- [ ] `auth.ts` настроен
- [ ] Providers настроены (GitHub, Google и т.д.)
- [ ] `@auth/prisma-adapter` настроен
- [ ] Middleware настроен
- [ ] `AUTH_SECRET` добавлен в `.env`
- [ ] Prisma schema содержит User, Account, Session, VerificationToken
- [ ] Protected routes работают

### NestJS backend (если есть):

- [ ] Passport.js + JWT strategy настроены
- [ ] `AUTH_SECRET` одинаковый в Next.js и NestJS
- [ ] JWT Guards работают

### Clerk (если выбран):

- [ ] `@clerk/nextjs` установлен
- [ ] Ключи добавлены в `.env`
- [ ] `ClerkProvider` в layout
- [ ] Middleware настроен
- [ ] Webhooks настроены (синхронизация с БД)

### Общее:

- [ ] Protected routes работают
- [ ] User data синхронизируется с БД
- [ ] Sign out работает
- [ ] Error handling настроен

---

**Версия:** 2.0
**Дата:** 2026-02-12
