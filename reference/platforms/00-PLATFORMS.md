# Настройка платформ для Production

> Полное руководство по настройке всех платформ и сервисов для запуска проекта в production.

**Последнее обновление:** 2026-02-12

---

## 📋 СПИСОК ПЛАТФОРМ

### Frontend Hosting

| Платформа | Файл | Когда использовать |
|-----------|------|-------------------|
| **Vercel** | [01-VERCEL.md](./01-VERCEL.md) | Next.js проекты, основной выбор |

### Backend Hosting

| Платформа | Файл | Когда использовать |
|-----------|------|-------------------|
| **Railway** | [04-RAILWAY.md](./04-RAILWAY.md) | Простой backend, хороший DX |
| **Render** | [05-RENDER.md](./05-RENDER.md) | Есть бесплатный tier |
| **Fly.io** | [06-FLYIO.md](./06-FLYIO.md) | Global edge, low latency |

### Database

| Платформа | Файл | Когда использовать |
|-----------|------|-------------------|
| **Neon** | [02-NEON.md](./02-NEON.md) | Serverless Postgres, основной выбор |

### CDN и Storage

| Платформа | Файл | Когда использовать |
|-----------|------|-------------------|
| **Cloudflare** | [03-CLOUDFLARE.md](./03-CLOUDFLARE.md) | CDN, R2 storage, WAF, DNS |

### Cache и Очереди

| Платформа | Файл | Когда использовать |
|-----------|------|-------------------|
| **Upstash** | [09-UPSTASH.md](./09-UPSTASH.md) | Redis serverless, rate limiting, кэш |

### Аутентификация

| Платформа | Файл | Когда использовать |
|-----------|------|-------------------|
| **Clerk / NextAuth** | [10-AUTH.md](./10-AUTH.md) | Аутентификация пользователей |

### Email

| Платформа | Файл | Когда использовать |
|-----------|------|-------------------|
| **Resend** | [11-EMAIL.md](./11-EMAIL.md) | Транзакционные письма |

### DevOps и Мониторинг

| Платформа | Файл | Когда использовать |
|-----------|------|-------------------|
| **GitHub** | [07-GITHUB.md](./07-GITHUB.md) | CI/CD, Secrets, Environments |
| **Sentry** | [08-SENTRY.md](./08-SENTRY.md) | Error tracking, monitoring |

---

## 🎯 ТИПИЧНЫЕ КОНФИГУРАЦИИ

### Малый проект (A)

```
Frontend:  Vercel
Database:  Neon (Free tier)
Auth:      Clerk или NextAuth
Storage:   Vercel Blob
CI/CD:     Vercel (встроенный)
```

### Средний проект (B)

```
Frontend:  Vercel
Backend:   Railway или Vercel (API Routes)
Database:  Neon (Pro)
Cache:     Upstash Redis
Auth:      Clerk
Email:     Resend
Storage:   Cloudflare R2
CDN:       Cloudflare
CI/CD:     GitHub Actions + Vercel
Monitoring: Sentry
```

### Крупный проект (C)

```
Frontend:  Vercel (Pro)
Backend:   Railway / Fly.io
Database:  Neon (Scale)
Cache:     Upstash Redis
Auth:      Clerk (Pro)
Email:     Resend
Storage:   Cloudflare R2
CDN:       Cloudflare (Pro)
CI/CD:     GitHub Actions
Monitoring: Sentry + Vercel Analytics
```

---

## ✅ ОБЩИЙ CHECKLIST НАСТРОЙКИ

### Перед запуском проекта

- [ ] **Accounts созданы:**
  - [ ] Vercel
  - [ ] Neon
  - [ ] Clerk / NextAuth настроен
  - [ ] Upstash (если нужен кэш/rate limiting)
  - [ ] Resend (если нужны email)
  - [ ] Cloudflare (если нужен CDN)
  - [ ] Railway/Render/Fly.io (если backend)
  - [ ] Sentry (если нужен)

- [ ] **GitHub настроен:**
  - [ ] Repository создан
  - [ ] Secrets добавлены
  - [ ] Environments настроены

### При деплое

- [ ] **Vercel:**
  - [ ] Проект подключён к GitHub
  - [ ] Environment Variables настроены
  - [ ] Domain настроен

- [ ] **Neon:**
  - [ ] Database создана
  - [ ] Production branch создан
  - [ ] Connection string в Vercel/Railway

- [ ] **Cloudflare (если используется):**
  - [ ] DNS записи настроены
  - [ ] SSL/TLS mode: Full (strict)
  - [ ] WAF rules настроены

### После деплоя

- [ ] **Мониторинг:**
  - [ ] Sentry подключён
  - [ ] Analytics работает
  - [ ] Alerts настроены

---

## 🔐 БЕЗОПАСНОСТЬ

### Secrets Management

```markdown
## Где хранить секреты

| Секрет | Где хранить |
|--------|-------------|
| DATABASE_URL | Vercel/Railway Environment Variables |
| API Keys | Vercel/Railway Environment Variables |
| JWT_SECRET | Vercel/Railway Environment Variables |
| Webhook secrets | Platform-specific |

## НИКОГДА

- ❌ В коде
- ❌ В .env в git
- ❌ В публичных логах
- ❌ В GitHub Issues/PR
```

### Environment Separation

```markdown
## Environments

| Environment | Использование | Database |
|-------------|---------------|----------|
| Development | Локальная разработка | Neon dev branch |
| Preview | PR previews | Neon preview branch |
| Staging | Тестирование | Neon staging branch |
| Production | Боевой сервер | Neon main branch |
```

---

## 📖 ПОРЯДОК НАСТРОЙКИ

### Для нового проекта:

```
1. GitHub     → Создать repo, настроить secrets
2. Neon       → Создать database
3. Clerk      → Настроить аутентификацию
4. Vercel     → Подключить repo, настроить env vars
5. Upstash    → Redis для кэша/rate limiting (опционально)
6. Resend     → Email (опционально)
7. Cloudflare → DNS, CDN (опционально)
8. Railway    → Backend (если нужен)
9. Sentry     → Мониторинг (опционально)
```

---

## 📁 ФАЙЛЫ В ЭТОЙ ПАПКЕ

```
Platforms/
├── 00-PLATFORMS.md      # ← Этот файл (оглавление)
├── 01-VERCEL.md         # Vercel настройка
├── 02-NEON.md           # Neon Database настройка
├── 03-CLOUDFLARE.md     # Cloudflare настройка
├── 04-RAILWAY.md        # Railway настройка
├── 05-RENDER.md         # Render настройка
├── 06-FLYIO.md          # Fly.io настройка
├── 07-GITHUB.md         # GitHub Actions, Secrets
├── 08-SENTRY.md         # Sentry мониторинг
├── 09-UPSTASH.md        # Redis serverless (кэш, очереди)
├── 10-AUTH.md           # Аутентификация (Clerk, NextAuth)
└── 11-EMAIL.md          # Транзакционные email (Resend)
```

---

**Версия:** 1.1
