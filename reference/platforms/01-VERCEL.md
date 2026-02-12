# Vercel — Полная настройка

> Vercel — платформа для деплоя frontend (Next.js) и serverless функций.

---

## 📋 СОДЕРЖАНИЕ

1. [Создание аккаунта](#создание-аккаунта)
2. [Подключение проекта](#подключение-проекта)
3. [Environment Variables](#environment-variables)
4. [Domains](#domains)
5. [Vercel Blob Storage](#vercel-blob-storage)
6. [Vercel KV (Redis)](#vercel-kv-redis)
7. [Vercel Postgres](#vercel-postgres)
8. [Edge Config](#edge-config)
9. [Web Application Firewall (WAF)](#waf)
10. [Analytics & Speed Insights](#analytics)
11. [Integrations](#integrations)
12. [Team & Collaboration](#team)
13. [Checklist](#checklist)

---

## 1. Создание аккаунта {#создание-аккаунта}

### Шаги:

1. Перейти на [vercel.com](https://vercel.com)
2. "Sign Up" → "Continue with GitHub"
3. Авторизовать Vercel в GitHub
4. Выбрать план:
   - **Hobby** — бесплатно, для личных проектов
   - **Pro** — $20/месяц, для коммерческих проектов
   - **Enterprise** — для крупных команд

### После регистрации:

- Подтвердить email
- Настроить профиль
- Подключить GitHub organization (если нужно)

---

## 2. Подключение проекта {#подключение-проекта}

### Способ 1: Через UI

1. Dashboard → "Add New Project"
2. "Import Git Repository"
3. Выбрать репозиторий
4. Настроить:
   - **Framework Preset:** Next.js (автоопределение)
   - **Root Directory:** `.` или `apps/web` (для monorepo)
   - **Build Command:** `npm run build` (или авто)
   - **Output Directory:** `.next` (авто)
   - **Install Command:** `npm install` (или `pnpm install`)

### Способ 2: Через CLI

```bash
# Установка CLI
npm i -g vercel

# Логин
vercel login

# Подключение проекта
cd your-project
vercel link

# Деплой
vercel          # preview
vercel --prod   # production
```

### Настройки проекта (vercel.json)

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.example.com/:path*"
    }
  ]
}
```

---

## 3. Environment Variables {#environment-variables}

### Через UI:

1. Project → Settings → Environment Variables
2. Add New:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://...`
   - **Environment:** Production, Preview, Development

### Типы переменных:

| Тип | Описание | Пример |
|-----|----------|--------|
| Plaintext | Обычный текст | API_URL |
| Secret | Зашифрованный | DATABASE_URL, API_KEY |
| Reference | Ссылка на другую переменную | $DATABASE_URL |

### Environments:

| Environment | Когда используется |
|-------------|-------------------|
| Production | main branch → production URL |
| Preview | PR и другие branches → preview URL |
| Development | `vercel dev` локально |

### Обязательные переменные:

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...      # Без pooling для миграций

# Auth
NEXTAUTH_SECRET=your-secret-32-chars-min
NEXTAUTH_URL=https://your-domain.com

# Публичные (доступны в браузере)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Через CLI:

```bash
# Добавить переменную
vercel env add DATABASE_URL production

# Посмотреть переменные
vercel env ls

# Скачать .env.local
vercel env pull
```

---

## 4. Domains {#domains}

### Добавление домена:

1. Project → Settings → Domains
2. "Add Domain"
3. Ввести домен: `example.com`
4. Настроить DNS (см. ниже)

### DNS настройка:

#### Для apex domain (example.com):

```
Type: A
Name: @
Value: 76.76.21.21
```

#### Для www:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### Для subdomain (app.example.com):

```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### SSL/HTTPS:

- Автоматически через Let's Encrypt
- Принудительный HTTPS включён по умолчанию

### Redirects:

```json
// vercel.json
{
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    },
    {
      "source": "/(.*)",
      "has": [{ "type": "host", "value": "www.example.com" }],
      "destination": "https://example.com/$1",
      "permanent": true
    }
  ]
}
```

---

## 5. Vercel Blob Storage {#vercel-blob-storage}

> S3-совместимое хранилище для файлов.

### Подключение:

1. Project → Storage → Create Database
2. Выбрать "Blob"
3. Создать store

### Установка:

```bash
npm install @vercel/blob
```

### Использование:

```typescript
// lib/blob.ts
import { put, del, list } from '@vercel/blob';

// Загрузка файла
export async function uploadFile(file: File) {
  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
  });
  return blob.url;
}

// Удаление файла
export async function deleteFile(url: string) {
  await del(url);
}

// Список файлов
export async function listFiles(prefix?: string) {
  const { blobs } = await list({ prefix });
  return blobs;
}
```

### API Route для загрузки:

```typescript
// app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }

  const blob = await put(file.name, file, {
    access: 'public',
  });

  return NextResponse.json(blob);
}
```

### Лимиты:

| План | Размер файла | Хранилище |
|------|-------------|-----------|
| Hobby | 4.5 MB | 1 GB |
| Pro | 500 MB | 100 GB |

---

## 6. Vercel KV (Redis) {#vercel-kv-redis}

> Serverless Redis для кэширования и сессий.

### Подключение:

1. Project → Storage → Create Database
2. Выбрать "KV"
3. Создать store

### Установка:

```bash
npm install @vercel/kv
```

### Использование:

```typescript
// lib/kv.ts
import { kv } from '@vercel/kv';

// Кэширование
export async function getFromCache<T>(key: string): Promise<T | null> {
  return await kv.get<T>(key);
}

export async function setCache<T>(
  key: string, 
  value: T, 
  ttlSeconds: number
): Promise<void> {
  await kv.set(key, value, { ex: ttlSeconds });
}

// Rate limiting
export async function checkRateLimit(ip: string, limit: number): Promise<boolean> {
  const key = `rate-limit:${ip}`;
  const current = await kv.incr(key);
  
  if (current === 1) {
    await kv.expire(key, 60); // 1 minute window
  }
  
  return current <= limit;
}
```

---

## 7. Vercel Postgres {#vercel-postgres}

> Альтернатива Neon, интегрирована в Vercel.

### Подключение:

1. Project → Storage → Create Database
2. Выбрать "Postgres"
3. Выбрать регион (ближе к функциям)

### Использование с Prisma:

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
```

### Environment Variables (автоматически):

```bash
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://...
```

---

## 8. Edge Config {#edge-config}

> Глобальный key-value store для конфигурации (feature flags, etc.).

### Подключение:

1. Project → Storage → Create
2. Выбрать "Edge Config"

### Использование:

```typescript
import { get } from '@vercel/edge-config';

// В Edge Runtime
export async function getFeatureFlag(flag: string): Promise<boolean> {
  const value = await get<boolean>(flag);
  return value ?? false;
}

// Использование
const isNewCheckoutEnabled = await getFeatureFlag('new-checkout');
```

---

## 9. Web Application Firewall (WAF) {#waf}

> Защита от атак. Доступно на Pro и выше.

### Настройка:

1. Project → Security → Firewall
2. Enable Firewall

### Встроенные правила:

- SQL Injection protection
- XSS protection
- Path traversal protection
- Rate limiting

### Custom Rules:

```json
// Через Dashboard или API
{
  "action": "block",
  "conditions": {
    "ip": ["1.2.3.4", "5.6.7.8"],
    "path": "/admin/*"
  }
}
```

### Rate Limiting:

1. Project → Security → Rate Limiting
2. Add Rule:
   - Path: `/api/*`
   - Limit: 100 requests per minute
   - Action: Block

---

## 10. Analytics & Speed Insights {#analytics}

### Vercel Analytics:

1. Project → Analytics → Enable

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Speed Insights:

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

## 11. Integrations {#integrations}

### Neon Integration:

1. Project → Settings → Integrations
2. "Browse Marketplace" → Neon
3. Connect → авторизовать
4. Environment variables добавятся автоматически
5. Preview branches получат свои database branches

### Sentry Integration:

1. Integrations → Sentry
2. Connect Sentry account
3. Выбрать Sentry project
4. Автоматическая загрузка source maps

### Другие полезные интеграции:

- **Checkly** — мониторинг и synthetic tests
- **LogRocket** — session replay
- **Split** — feature flags
- **PlanetScale** — MySQL database

---

## 12. Team & Collaboration {#team}

### Создание Team:

1. Dashboard → Settings → Teams
2. "Create Team"
3. Пригласить участников

### Роли:

| Роль | Права |
|------|-------|
| Owner | Полный доступ, billing |
| Member | Деплой, настройки проектов |
| Developer | Только деплой |
| Viewer | Только просмотр |

### Git Integration:

- PR previews автоматически
- Comments в PR с preview URL
- Проверки статуса деплоя

---

## ✅ Checklist {#checklist}

### Первоначальная настройка:

- [ ] Аккаунт создан
- [ ] GitHub подключён
- [ ] Проект импортирован
- [ ] Framework preset выбран (Next.js)

### Environment Variables:

- [ ] DATABASE_URL настроен
- [ ] NEXTAUTH_SECRET настроен
- [ ] NEXTAUTH_URL настроен
- [ ] Публичные переменные (NEXT_PUBLIC_*) настроены
- [ ] Preview и Production разделены

### Domains:

- [ ] Домен добавлен
- [ ] DNS настроен
- [ ] SSL работает
- [ ] www redirect настроен (если нужен)

### Storage (если нужен):

- [ ] Blob для файлов
- [ ] KV для кэша
- [ ] Postgres или Neon integration

### Security:

- [ ] WAF включён (Pro)
- [ ] Rate limiting настроен
- [ ] Sensitive env vars помечены как Secret

### Monitoring:

- [ ] Analytics включён
- [ ] Speed Insights включён
- [ ] Sentry подключён (опционально)

### Performance:

- [ ] Регион выбран (близко к пользователям/DB)
- [ ] Edge functions где нужно
- [ ] Caching headers настроены

---

**Версия:** 1.0
