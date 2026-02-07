# Шаблон репозитория: Правила разработки

Шаблон репозитория с правилами разработки, правилами Cursor и документацией для использования в новых проектах.

---

## Использование шаблона

### 1. Создать новый репозиторий из шаблона

1. Нажми **Use this template** (зелёная кнопка) на странице репозитория в GitHub.
2. Задай имя новому репозиторию и создай его.
3. Клонируй новый репозиторий к себе.

### 2. Применить правила к проекту

Скопируй папку с правилами Cursor в свой проект:

```bash
# Из корня своего проекта (куда нужно подставить правила)
cp -r path/to/-Template-Development-Rules/Rules/.cursor ./
```

Либо скопируй только правила:

```bash
mkdir -p .cursor
cp -r path/to/-Template-Development-Rules/Rules/.cursor/rules .cursor/
```

### 3. Документация и шаблоны

- **Правила и инструкции:** [Rules/README.md](Rules/README.md)
- **Шаблоны документов:** `Rules/templates/` (PROJECT_INIT, ARCHITECTURE, ADR, PROGRESS)
- **База знаний:** `Rules/knowledge-base/` (TECH_STACK, NAMING_CONVENTIONS, BEST_PRACTICES)
- **Платформы:** `Rules/Platforms/` (Vercel, Neon, Cloudflare и др.)

---

## Структура репозитория

```
├── .github/                    # Шаблоны PR и Issue для GitHub
├── Rules/
│   ├── .cursor/rules/          # Правила Cursor (.mdc)
│   ├── knowledge-base/        # База знаний
│   ├── Platforms/             # Документация по платформам
│   ├── templates/             # Шаблоны документов проекта
│   ├── user-rules/            # Пользовательские правила
│   └── README.md              # Подробная инструкция по правилам
├── README.md                  # Этот файл
├── LICENSE
└── .editorconfig
```

---

## Что внутри Rules

- **Правила Cursor** — архитектура, TypeScript, React/Next.js, NestJS, БД, API, безопасность, тесты, Git, CI/CD и др.
- **Размеры проектов** — A (малый), B (средний), C (крупный) с разной структурой и объёмом документации.
- **Шаблоны** — инициализация проекта, архитектура, ADR, отчёт о прогрессе.

Подробности и чеклисты — в [Rules/README.md](Rules/README.md).

---

## Лицензия

[MIT](LICENSE) — можно свободно использовать и адаптировать в своих проектах.
