# Naming Conventions

> Этот файл — краткая шпаргалка. Полные правила — в `.cursor/rules/02-coding-standards.mdc`.

---

## Файлы

| Тип | Формат | Пример |
|-----|--------|--------|
| Компоненты React | PascalCase | `ProductCard.tsx` |
| Хуки | camelCase + use | `useProducts.ts` |
| Утилиты | camelCase | `formatPrice.ts` |
| Типы | camelCase.types | `product.types.ts` |
| Тесты | *.test.ts(x) | `formatPrice.test.ts` |
| NestJS сервисы | kebab-case | `products.service.ts` |

## Код

| Тип | Формат | Пример |
|-----|--------|--------|
| Переменные | camelCase | `userName` |
| Функции | camelCase | `getProducts` |
| Классы/Интерфейсы | PascalCase | `ProductService` |
| Константы | UPPER_SNAKE | `API_BASE_URL` |
| Enum значения | UPPER_SNAKE | `OrderStatus.PENDING` |
| Boolean | is/has/can | `isActive`, `hasAccess` |

## БД (Prisma)

- Модели: PascalCase (`OrderItem`)
- Поля: camelCase (`createdAt`)
- Таблицы: snake_case через `@@map("order_items")`

---

> Полные правила, примеры и антипаттерны: `.cursor/rules/02-coding-standards.mdc`

**Последнее обновление:** 2026-02-12
