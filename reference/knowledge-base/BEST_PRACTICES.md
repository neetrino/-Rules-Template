# Best Practices

> Этот файл — краткая шпаргалка. Полные правила — в `.cursor/rules/`.

---

## Источники правил

| Тема | Файл |
|------|------|
| Главные правила | `.cursor/rules/00-core.mdc` |
| Стандарты кода | `.cursor/rules/02-coding-standards.mdc` |
| Архитектура | `.cursor/rules/01-architecture.mdc` |
| TypeScript | `.cursor/rules/03-typescript.mdc` |
| Безопасность | `.cursor/rules/08-security.mdc` |
| Обработка ошибок | `.cursor/rules/12-error-handling.mdc` |

## Быстрые правила

- **Функции:** ≤ 50 строк, ≤ 4 параметра
- **Файлы:** ≤ 300 строк
- **Вложенность:** ≤ 3 уровня
- **TypeScript:** strict mode, без `any`
- **Экспорты:** именованные, без default
- **Стиль:** Tailwind, без inline styles
- **Секреты:** только через env
- **Пароли:** argon2
- **ORM:** Prisma (без raw SQL)

---

**Последнее обновление:** 2026-02-12
