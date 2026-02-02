# Neon — Полная настройка

> Neon — serverless PostgreSQL с branching, autoscaling и автоматическими бэкапами.

---

## 📋 СОДЕРЖАНИЕ

1. [Создание аккаунта](#создание-аккаунта)
2. [Создание проекта](#создание-проекта)
3. [Database Branching](#branching)
4. [Connection Strings](#connection-strings)
5. [Prisma Integration](#prisma)
6. [Vercel Integration](#vercel-integration)
7. [Backup & Restore](#backup-restore)
8. [Autoscaling](#autoscaling)
9. [Monitoring](#monitoring)
10. [Security](#security)
11. [CLI](#cli)
12. [Checklist](#checklist)

---

## 1. Создание аккаунта {#создание-аккаунта}

### Шаги:

1. Перейти на [neon.tech](https://neon.tech)
2. "Sign Up" → GitHub / Google / Email
3. Выбрать план:
   - **Free** — 0.5 GB storage, 1 project, branching
   - **Launch** — $19/месяц, 10 GB, 10 projects
   - **Scale** — $69/месяц, 50 GB, unlimited projects

### Лимиты Free tier:

| Ресурс | Лимит |
|--------|-------|
| Storage | 0.5 GB |
| Compute | 191.9 hours/month |
| Projects | 1 |
| Branches | 10 |
| History | 7 days |

---

## 2. Создание проекта {#создание-проекта}

### Через UI:

1. Dashboard → "New Project"
2. Настройки:
   - **Name:** project-name
   - **Postgres Version:** 16 (рекомендуется)
   - **Region:** US East (ближе к Vercel)
   - **Compute size:** 0.25 CU (Free) или больше

### Regions:

| Region | Код | Использовать для |
|--------|-----|------------------|
| US East (N. Virginia) | aws-us-east-1 | Vercel (default) |
| US East (Ohio) | aws-us-east-2 | Alternative US |
| US West (Oregon) | aws-us-west-2 | West Coast users |
| Europe (Frankfurt) | aws-eu-central-1 | EU users |
| Asia Pacific (Singapore) | aws-ap-southeast-1 | APAC users |

### После создания:

- Автоматически создаётся `main` branch
- Автоматически создаётся database `neondb`
- Автоматически создаётся role (username)

---

## 3. Database Branching {#branching}

> Главная фича Neon — database branches как git branches.

### Концепция:

```
main (production)
├── develop (staging)
├── preview-pr-123 (PR preview)
├── preview-pr-456 (PR preview)
└── dev-feature-auth (local dev)
```

### Создание branch через UI:

1. Project → Branches → "New Branch"
2. Настройки:
   - **Name:** develop
   - **Parent:** main
   - **Include data:** Yes (копировать данные)
   - **Compute:** Shared или Dedicated

### Создание branch через CLI:

```bash
# Установка CLI
npm install -g neonctl

# Логин
neonctl auth

# Создать branch
neonctl branches create --name develop --project-id <project-id>

# Создать branch с данными на определённый момент
neonctl branches create --name restore-point --parent main --point-in-time "2024-01-15T10:00:00Z"
```

### Типы branches:

| Тип | Назначение | Compute |
|-----|------------|---------|
| main | Production | Dedicated (рекомендуется) |
| develop | Staging/QA | Shared |
| preview-* | PR previews | Shared, scale to zero |
| dev-* | Local development | Shared, scale to zero |

### Автоматические preview branches (Vercel):

При Vercel Integration:
- Каждый PR автоматически получает свой database branch
- Branch удаляется при закрытии PR

---

## 4. Connection Strings {#connection-strings}

### Формат:

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### Типы connection strings:

| Тип | Использование | Пример параметра |
|-----|---------------|------------------|
| Pooled | Приложение (Next.js, NestJS) | `?pgbouncer=true` |
| Direct | Миграции (Prisma migrate) | Без pgbouncer |

### Где найти:

1. Project → Connection Details
2. Выбрать branch
3. Выбрать тип (Pooled / Direct)
4. Копировать connection string

### Пример:

```bash
# Pooled (для приложения)
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Direct (для миграций)
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

---

## 5. Prisma Integration {#prisma}

### schema.prisma:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### .env.local:

```bash
# Pooled connection (для приложения)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Direct connection (для миграций)
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Миграции:

```bash
# Создать миграцию
npx prisma migrate dev --name init

# Применить миграции (production)
npx prisma migrate deploy

# Сгенерировать клиент
npx prisma generate
```

### Singleton для Prisma Client:

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## 6. Vercel Integration {#vercel-integration}

### Подключение:

1. Vercel Dashboard → Project → Settings → Integrations
2. "Browse Marketplace" → найти "Neon"
3. "Add Integration"
4. Авторизовать Neon
5. Выбрать Neon project
6. Выбрать Vercel project(s)
7. Настроить:
   - **Production branch:** main
   - **Preview branches:** автоматически создавать

### Что происходит автоматически:

1. **Environment Variables** добавляются в Vercel:
   - `DATABASE_URL` (pooled)
   - `DATABASE_URL_UNPOOLED` (direct)

2. **Preview Deployments:**
   - PR создаётся → Neon branch создаётся
   - PR закрывается → Neon branch удаляется
   - Каждый preview получает изолированную БД

### Настройка branch для preview:

```json
// В Neon Dashboard → Integrations → Vercel
{
  "preview_branch_parent": "main",  // или "develop"
  "include_data": true               // копировать данные
}
```

---

## 7. Backup & Restore {#backup-restore}

### Автоматические бэкапы:

Neon автоматически сохраняет историю изменений:

| План | History Retention |
|------|-------------------|
| Free | 7 days |
| Launch | 7 days |
| Scale | 30 days |

### Point-in-Time Recovery (PITR):

```bash
# Создать branch на определённый момент времени
neonctl branches create \
  --name restore-2024-01-15 \
  --parent main \
  --point-in-time "2024-01-15T10:00:00Z"
```

### Через UI:

1. Project → Branches
2. "Create Branch"
3. Parent: main
4. Enable "Point in time"
5. Выбрать дату/время

### Restore в production:

```bash
# 1. Создать восстановленный branch
neonctl branches create --name restored --parent main --point-in-time "2024-01-15T10:00:00Z"

# 2. Проверить данные в restored branch

# 3. Если всё ОК - переключить приложение на restored branch
# (обновить DATABASE_URL в Vercel)

# 4. Или: переименовать branches
neonctl branches rename main main-broken
neonctl branches rename restored main
```

### Экспорт данных:

```bash
# pg_dump через Neon connection
pg_dump "postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require" > backup.sql

# Восстановление
psql "postgresql://..." < backup.sql
```

---

## 8. Autoscaling {#autoscaling}

### Compute Units (CU):

| CU | vCPU | RAM | Использование |
|----|------|-----|---------------|
| 0.25 | 0.25 | 1 GB | Dev/Preview |
| 0.5 | 0.5 | 2 GB | Small prod |
| 1 | 1 | 4 GB | Medium prod |
| 2 | 2 | 8 GB | Large prod |
| 4+ | 4+ | 16+ GB | High traffic |

### Настройка:

1. Project → Settings → Compute
2. Настроить:
   - **Min compute:** 0 (scale to zero) или 0.25
   - **Max compute:** 2 (или больше)
   - **Suspend after:** 5 минут неактивности

### Scale to Zero:

- Dev/Preview branches могут уходить в sleep
- Первый запрос "будит" compute (~300-500ms cold start)
- Production рекомендуется min 0.25 чтобы избежать cold starts

### Autosuspend настройка:

```bash
# Через CLI
neonctl branches update main --compute-config '{"suspend_timeout": 300}'
```

---

## 9. Monitoring {#monitoring}

### Dashboard метрики:

- **Connections:** активные подключения
- **Compute time:** использование CPU
- **Storage:** размер данных
- **Data transfer:** объём трафика

### Query Insights:

1. Project → Monitoring → Query Insights
2. Видны:
   - Медленные запросы
   - Частые запросы
   - Query plans

### Alerts (Pro+):

1. Project → Settings → Alerts
2. Настроить:
   - Storage > 80%
   - Compute time > threshold
   - Connection errors

### Логирование:

```sql
-- Включить логирование медленных запросов
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 1 секунда
```

---

## 10. Security {#security}

### IP Allow List (Pro+):

1. Project → Settings → IP Allow
2. Добавить разрешённые IP:
   - Vercel IP ranges
   - Ваш офис/VPN
   - CI/CD servers

### Roles & Permissions:

```sql
-- Создать read-only роль
CREATE ROLE readonly_user WITH LOGIN PASSWORD 'password';
GRANT CONNECT ON DATABASE neondb TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

### SSL:

- Всегда включён (sslmode=require)
- Нельзя отключить

### Branch Protection:

1. Project → Settings → Branches
2. Protect "main":
   - Require confirmation for delete
   - Prevent direct writes (только через миграции)

---

## 11. CLI {#cli}

### Установка:

```bash
npm install -g neonctl
```

### Основные команды:

```bash
# Авторизация
neonctl auth

# Проекты
neonctl projects list
neonctl projects create --name my-project

# Branches
neonctl branches list --project-id <id>
neonctl branches create --name develop --project-id <id>
neonctl branches delete develop --project-id <id>

# Connection string
neonctl connection-string main --project-id <id>
neonctl connection-string main --project-id <id> --pooled

# Database operations
neonctl databases list --project-id <id> --branch main
neonctl databases create --name testdb --project-id <id> --branch main

# SQL execution
neonctl query "SELECT version();" --project-id <id> --branch main
```

### Использование в CI:

```yaml
# .github/workflows/migrate.yml
- name: Install Neon CLI
  run: npm install -g neonctl

- name: Run migrations
  env:
    NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
  run: |
    export DATABASE_URL=$(neonctl connection-string main --project-id $PROJECT_ID)
    npx prisma migrate deploy
```

---

## ✅ Checklist {#checklist}

### Первоначальная настройка:

- [ ] Аккаунт создан
- [ ] Project создан
- [ ] Region выбран (близко к Vercel)
- [ ] Main branch настроен

### Branches:

- [ ] main — production
- [ ] develop — staging (опционально)
- [ ] Preview branches через Vercel Integration

### Connections:

- [ ] DATABASE_URL (pooled) для приложения
- [ ] DIRECT_URL для миграций
- [ ] Connection strings в Vercel

### Prisma:

- [ ] schema.prisma настроен
- [ ] directUrl добавлен
- [ ] Начальная миграция создана

### Vercel Integration:

- [ ] Integration подключена
- [ ] Production branch = main
- [ ] Preview branches автоматические

### Backup & Recovery:

- [ ] Понимаете как использовать PITR
- [ ] Знаете как создать restore branch
- [ ] History retention достаточный

### Security:

- [ ] Connection strings не в коде
- [ ] IP Allow List (если Pro+)
- [ ] Branch protection для main

### Performance:

- [ ] Compute size соответствует нагрузке
- [ ] Scale to zero для dev branches
- [ ] Min compute > 0 для production (если критично)

---

**Версия:** 1.0
