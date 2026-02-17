# План внедрения автоматизации качества

> На основе аудита предложения и существующих правил проекта (17-cicd, 10-testing, 02-coding-standards, 13-git-workflow).
> Приоритет: скорость + стабильность. Команда 1–5 человек.

**Статус:** Ожидает внедрения
**Дата:** 2026-02-17

---

## 📌 Что внедряем (коротко)

```
Два слоя защиты:

1. Локально (pre-commit) → формат + линт изменённых файлов + commitlint
2. CI (каждый PR)         → формат + линт + типы + тесты + билд + аудит (отдельно)
```

---

## 1. Dev-зависимости

### Установить (если ещё нет)

```bash
# Форматирование + линтинг (обычно уже есть в Next.js)
pnpm add -D prettier typescript

# Тестирование
pnpm add -D vitest @types/node

# Git hooks
pnpm add -D husky lint-staged

# Conventional Commits enforcement
pnpm add -D @commitlint/cli @commitlint/config-conventional

# Инициализация husky
pnpm husky init
```

> **Примечание:** ESLint уже встроен в Next.js (`next lint`).
> Для NestJS — ESLint и Jest идут из коробки через Nest CLI.

---

## 2. Конфиги

### 2.1 Prettier — `prettier.config.cjs`

```js
module.exports = {
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  arrowParens: 'always',
};
```

> `printWidth: 100` — соответствует правилу 02-coding-standards (≤ 100 символов в строке).

### 2.2 Prettier ignore — `.prettierignore`

```
node_modules
.next
dist
build
coverage
pnpm-lock.yaml
prisma/migrations
```

> Без этого Prettier будет пытаться форматировать сгенерированные файлы и lockfile.

### 2.3 Commitlint — `.commitlintrc.json`

```json
{
  "extends": ["@commitlint/config-conventional"]
}
```

> Обеспечивает соблюдение Conventional Commits из правила 13-git-workflow.
> Формат: `feat(scope): message`, `fix(scope): message` и т.д.

---

## 3. Git Hooks (husky)

### 3.1 Pre-commit — `.husky/pre-commit`

```bash
pnpm lint-staged
```

### 3.2 Commit message — `.husky/commit-msg`

```bash
pnpm commitlint --edit $1
```

### 3.3 lint-staged конфиг в `package.json`

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json,md,css}": ["prettier --write"],
    "*.{ts,tsx,js,jsx}": ["eslint --fix"]
  }
}
```

> Только изменённые файлы. Быстро, не раздражает.

---

## 4. Scripts в package.json

### Вариант A: Next.js (фронт + бэк на Next.js)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",

    "format": "prettier . --write",
    "format:check": "prettier . --check",

    "lint": "next lint --max-warnings=0",
    "typecheck": "prisma generate && tsc --noEmit",

    "test": "vitest run",
    "test:coverage": "vitest run --coverage",

    "ci:check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build",

    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",

    "prepare": "husky"
  }
}
```

**Ключевые моменты:**

- `typecheck` включает `prisma generate` — без этого `tsc` упадёт из-за отсутствия сгенерированных типов Prisma
- `--max-warnings=0` — предупреждения = ошибки, не копятся
- `audit` **НЕ** в цепочке `ci:check` — запускается отдельно в CI (см. раздел 5)
- `prepare: husky` — автоматически устанавливает hooks при `pnpm install`

### Вариант B: Next.js + NestJS (монорепо)

**Root `package.json`:**

```json
{
  "scripts": {
    "ci:check": "pnpm -C apps/web ci:check && pnpm -C apps/api ci:check",
    "prepare": "husky"
  }
}
```

**`apps/web/package.json` (Next.js):**

```json
{
  "scripts": {
    "format:check": "prettier . --check",
    "lint": "next lint --max-warnings=0",
    "typecheck": "prisma generate && tsc --noEmit",
    "test": "vitest run",
    "build": "next build",
    "ci:check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build"
  }
}
```

**`apps/api/package.json` (NestJS):**

```json
{
  "scripts": {
    "format:check": "prettier . --check",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "build": "nest build",
    "ci:check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build"
  }
}
```

> NestJS использует Jest (из коробки). Next.js — Vitest (быстрее, нативный ESM).

---

## 5. CI Pipeline — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

# Отменяет предыдущие runs при новом пуше в тот же PR
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  # ==========================================
  # QUALITY — блокирующий, PR не мержится без него
  # ==========================================
  quality:
    name: Quality checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Format check
        run: pnpm format:check

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Tests
        run: pnpm test

      - name: Build
        run: pnpm build

  # ==========================================
  # AUDIT — НЕ блокирующий, информативный
  # ==========================================
  audit:
    name: Security audit
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Audit dependencies
        run: pnpm audit --audit-level=high
        continue-on-error: true
```

**Почему так:**

| Решение | Причина |
|---------|---------|
| `concurrency` + `cancel-in-progress` | Не тратить минуты Actions на устаревшие runs |
| `audit` отдельным job + `continue-on-error` | Новые CVE в транзитивных зависимостях не блокируют PR |
| Команды по отдельности (не `ci:check`) | В CI видно, на каком именно шаге упало |
| pnpm v9 | Актуальная версия, зафиксировать в проекте |
| Один runner для quality | Быстрее, чем ждать allocation 4 параллельных runners |

---

## 6. GitHub Settings (ручные действия)

### 6.1 Branch Protection на `main`

```
Settings → Branches → Add rule → main

✅ Require a pull request before merging
✅ Require status checks to pass → выбрать "Quality checks"
✅ Require branches to be up to date before merging
✅ Do not allow bypassing the above settings
```

> Без этого CI — декорация. Любой может мержить мимо проверок.

### 6.2 Secret Scanning (бесплатно)

```
Settings → Code security → Secret scanning → Enable
```

### 6.3 Dependabot (бесплатно)

Создать `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 5
    labels:
      - 'dependencies'
```

> Авто-PR на обновление зависимостей раз в неделю. Максимум 5 открытых.

---

## 7. Структура файлов после внедрения

```
project/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                  # CI pipeline
│   └── dependabot.yml              # Авто-обновление зависимостей
│
├── .husky/
│   ├── pre-commit                  # prettier + eslint на staged файлы
│   └── commit-msg                  # commitlint (Conventional Commits)
│
├── .commitlintrc.json              # Конфиг commitlint
├── .prettierignore                 # Игнор для Prettier
├── prettier.config.cjs             # Конфиг Prettier
│
├── package.json                    # scripts + lint-staged
└── ...
```

---

## 8. Чеклист внедрения

### Шаг 1: Зависимости и конфиги

- [ ] Установить dev-зависимости (раздел 1)
- [ ] Создать `prettier.config.cjs` (раздел 2.1)
- [ ] Создать `.prettierignore` (раздел 2.2)
- [ ] Создать `.commitlintrc.json` (раздел 2.3)

### Шаг 2: Git hooks

- [ ] Инициализировать husky (`pnpm husky init`)
- [ ] Создать `.husky/pre-commit` (раздел 3.1)
- [ ] Создать `.husky/commit-msg` (раздел 3.2)
- [ ] Добавить `lint-staged` в `package.json` (раздел 3.3)

### Шаг 3: Scripts

- [ ] Обновить `scripts` в `package.json` (раздел 4)
- [ ] Проверить локально: `pnpm ci:check` проходит

### Шаг 4: CI

- [ ] Создать `.github/workflows/ci.yml` (раздел 5)
- [ ] Создать `.github/dependabot.yml` (раздел 6.3)
- [ ] Запушить, проверить что CI проходит

### Шаг 5: GitHub Settings (ручные)

- [ ] Включить Branch Protection на main (раздел 6.1)
- [ ] Включить Secret Scanning (раздел 6.2)

### Шаг 6: Обновить правила проекта

- [ ] Обновить `17-cicd.mdc` — привести `PNPM_VERSION` к `9`
- [ ] Обновить `10-testing.mdc` — добавить Vitest как фреймворк для Next.js
- [ ] Обновить `17-cicd.mdc` — убрать дублирование с этим документом

---

## 9. Что НЕ внедряем (осознанно)

| Что | Почему не сейчас |
|-----|-----------------|
| E2E тесты (Playwright) | Добавить когда будут стабильные user flows |
| Coverage upload (Codecov) | Оверхед для малой команды, добавить при росте |
| Отдельные CI jobs (lint/test/build) | Один job быстрее для малой команды |
| Docker в CI | Managed platforms (Vercel/Railway) делают это сами |
| Slack notifications | Добавить когда реально нужно, GitHub notifications хватает |
| Feature flags | Добавить когда появится потребность в gradual rollout |

---

## 10. Итоговый стандарт

После внедрения стандарт проекта такой:

```
✅ ci:check всегда зелёный
✅ --max-warnings=0
✅ Сборка проходит в CI
✅ Типы не игнорятся (prisma generate + tsc)
✅ Conventional Commits принудительно (commitlint)
✅ Формат единый (Prettier с полным конфигом)
✅ Audit не блокирует, но информирует
✅ Branch Protection — мимо CI не пройти
✅ Dependabot — зависимости не гниют
✅ Secret scanning — токены не утекают
```

---

**Версия:** 1.0
**Дата:** 2026-02-17
**Основание:** Аудит предложения quality automation + существующие правила проекта
