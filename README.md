# Шаблон правил разработки (Cursor AI)

Шаблон репозитория с правилами для AI-разработки в Cursor. Содержит правила архитектуры, кода, безопасности, тестирования и деплоя для проектов на Next.js и NestJS.

---

## Как начать разработку

### 1. Создай репозиторий из шаблона

Нажми **Use this template** на странице GitHub → задай имя → клонируй.

### 2. Открой в Cursor

```bash
git clone <url>
cd <project>
cursor .
```

### 3. Заполни техзадание

Открой `docs/BRIEF.md` и заполни все секции: описание проекта, функции, интеграции.

### 4. Запусти AI-ассистента

Напиши в чате Cursor:

> Прочитай docs/BRIEF.md и начни процесс по правилу 21-project-onboarding.mdc.
> Этап 1: определи размер проекта.
> Этап 2: заполни docs/TECH_CARD.md по шаблону. Жду утверждения перед кодом.

AI определит размер проекта (A/B/C), заполнит технологическую карту (все решения по стеку, сервисам, хостингу), и будет ждать подтверждения по каждому пункту перед началом кода.

---

## Структура репозитория

```
├── .cursor/rules/             # Правила Cursor (.mdc) — AI читает автоматически
│   ├── 00-core.mdc            # Главные правила (всегда активны)
│   ├── 01-architecture.mdc    # Архитектура
│   ├── 02-coding-standards.mdc
│   ├── 03-typescript.mdc
│   ├── 04-react-nextjs.mdc
│   ├── 05-backend-nestjs.mdc
│   ├── 06-database.mdc
│   ├── 07-api-design.mdc
│   ├── 08-security.mdc
│   ├── 09-figma-design.mdc
│   ├── 10-testing.mdc
│   ├── 11-documentation.mdc
│   ├── 12-error-handling.mdc
│   ├── 13-git-workflow.mdc
│   ├── 14-observability.mdc
│   ├── 15-performance.mdc
│   ├── 16-state-management.mdc
│   ├── 17-cicd.mdc
│   ├── 18-reliability.mdc
│   ├── 19-checklists.mdc
│   ├── 20-i18n.mdc
│   ├── 21-project-onboarding.mdc
│   ├── 99-project-size.mdc
│   └── project-sizes/          # Настройки по размеру проекта (A/B/C)
│
├── docs/                       # Проектные документы (создаются при старте)
│   ├── BRIEF.md                # Техзадание (заполни перед стартом)
│   └── archive/                # Архив устаревших документов
│
├── reference/                  # Справочные материалы (не проектные)
│   ├── platforms/              # Документация платформ (Vercel, Neon, Cloudflare...)
│   ├── knowledge-base/         # Tech stack, naming conventions
│   ├── templates/              # Шаблоны (ARCHITECTURE, ADR, PROGRESS)
│   └── user-rules/             # Глобальные правила Cursor
│
├── .github/                    # Шаблоны PR и Issue
├── README.md                   # Этот файл
├── LICENSE
└── .editorconfig
```

---

## Что внутри

### Правила Cursor (`.cursor/rules/`)

AI-ассистент автоматически применяет эти правила при работе с кодом:

| Правило | Описание |
|---------|----------|
| `00-core` | Главные правила, роль AI, запреты, стандарты |
| `01-architecture` | Архитектурные паттерны, структура по размеру |
| `02-coding-standards` | Стиль кода, форматирование |
| `03-typescript` | TypeScript strict, типизация |
| `04-react-nextjs` | React, Next.js App Router, SEO |
| `05-backend-nestjs` | NestJS, модули, контроллеры |
| `06-database` | PostgreSQL (Neon), Prisma, роли, таймауты |
| `07-api-design` | REST API, валидация, rate limiting |
| `08-security` | CORS, CSRF, аутентификация, R2 хранилище |
| `10-testing` | Vitest, тестирование API и компонентов |
| `11-documentation` | Структура docs/, архивирование |
| `19-checklists` | DoD, PR review, release чеклисты |
| `21-project-onboarding` | Пошаговый план создания проекта |

### Размеры проектов

| Размер | Описание | Структура |
|--------|----------|-----------|
| **A** (малый) | 1–3 мес, 1–2 чел, 5–15 фич | Простая (`src/app`, `components`, `lib`) |
| **B** (средний) | 3–6 мес, 2–5 чел, 15–50 фич | Feature-based (`src/features/*`) |
| **C** (крупный) | 6+ мес, 5+ чел, 50+ фич | Monorepo (`apps/*`, `packages/*`) |

### Справочники (`reference/`)

- **platforms/** — гайды по Vercel, Neon, Cloudflare R2, Render, Fly.io и др.
- **knowledge-base/** — рекомендуемый стек, конвенции именования
- **templates/** — шаблоны документов (архитектура, ADR, прогресс)

---

## Обновление правил

Правила в этом шаблоне обновляются. Чтобы получить обновления в существующем проекте:

```bash
# 1. Добавь шаблон как remote
git remote add template <url-шаблона>

# 2. Получи обновления
git fetch template

# 3. Сравни правила
git diff HEAD template/main -- .cursor/rules/

# 4. Cherry-pick нужные изменения или мерж конкретных файлов
git checkout template/main -- .cursor/rules/<нужный-файл>.mdc
```

---

## Лицензия

[MIT](LICENSE) — можно свободно использовать и адаптировать.
