# Конвенции именования

> Единые правила именования для всего проекта.

---

## 📁 ФАЙЛЫ И ПАПКИ

### Компоненты React

| Тип | Формат | Пример |
|-----|--------|--------|
| Компоненты | PascalCase | `ProductCard.tsx` |
| Страницы (Next.js) | kebab-case папки | `products/[slug]/page.tsx` |
| Layouts | PascalCase | `DashboardLayout.tsx` |

### Утилиты и хелперы

| Тип | Формат | Пример |
|-----|--------|--------|
| Утилиты | camelCase | `formatPrice.ts` |
| Хуки | camelCase с use | `useProducts.ts` |
| Сервисы | camelCase | `productService.ts` |
| Константы | camelCase | `apiConstants.ts` |

### Типы и интерфейсы

| Тип | Формат | Пример |
|-----|--------|--------|
| Типы | camelCase.types | `product.types.ts` |
| DTO | camelCase.dto | `createProduct.dto.ts` |

### Тесты

| Тип | Формат | Пример |
|-----|--------|--------|
| Unit тесты | *.test.ts(x) | `formatPrice.test.ts` |
| E2E тесты | *.spec.ts | `checkout.spec.ts` |

### Backend (NestJS)

| Тип | Формат | Пример |
|-----|--------|--------|
| Controllers | kebab-case.controller | `products.controller.ts` |
| Services | kebab-case.service | `products.service.ts` |
| Modules | kebab-case.module | `products.module.ts` |
| Guards | kebab-case.guard | `jwt-auth.guard.ts` |
| Filters | kebab-case.filter | `http-exception.filter.ts` |

---

## 📝 КОД

### Переменные

```typescript
// ✅ ПРАВИЛЬНО — camelCase, описательные
const userName = 'John';
const isActive = true;
const hasProducts = products.length > 0;
const totalPrice = 10000;
const orderItems = [];

// ❌ НЕПРАВИЛЬНО
const UserName = 'John';      // PascalCase
const user_name = 'John';     // snake_case
const n = 'John';             // Не описательное
const active = true;          // Для boolean используй is/has
```

### Функции

```typescript
// ✅ ПРАВИЛЬНО — camelCase + глагол
function getUser(id: string) { ... }
function createOrder(data: OrderData) { ... }
function updateProduct(id: string, data: Partial<Product>) { ... }
function deleteCartItem(itemId: string) { ... }

// Boolean getters
function isValid(data: unknown): boolean { ... }
function hasPermission(user: User, action: string): boolean { ... }
function canEdit(user: User, resource: Resource): boolean { ... }

// Handlers
function handleClick() { ... }
function handleSubmit(event: FormEvent) { ... }

// Async
async function fetchProducts() { ... }
async function loadUserData() { ... }

// ❌ НЕПРАВИЛЬНО
function get_user() { ... }        // snake_case
function GetUser() { ... }         // PascalCase
function user() { ... }            // Нет глагола
function processData() { ... }     // Слишком общее
```

### Классы и интерфейсы

```typescript
// ✅ ПРАВИЛЬНО — PascalCase
class UserService { ... }
class OrderRepository { ... }
class PaymentGateway { ... }

interface User { ... }
interface ProductData { ... }
interface CreateOrderParams { ... }

// ❌ НЕПРАВИЛЬНО
interface IUser { ... }            // Не используй I- префикс
interface userInterface { ... }    // camelCase
type TProductData = { ... }        // Не используй T- префикс
```

### Типы

```typescript
// ✅ ПРАВИЛЬНО — PascalCase
type UserId = string;
type OrderStatus = 'pending' | 'completed' | 'cancelled';
type ProductWithCategory = Product & { category: Category };

// ✅ Union types — значимые имена
type ButtonVariant = 'primary' | 'secondary' | 'outline';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// ❌ НЕПРАВИЛЬНО
type userId = string;              // camelCase
type TUserId = string;             // T- префикс
```

### Константы

```typescript
// ✅ ПРАВИЛЬНО — UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRIES = 3;
const DEFAULT_PAGE_SIZE = 20;
const JWT_EXPIRATION_TIME = 3600;

// Объекты констант
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
} as const;

// ❌ НЕПРАВИЛЬНО
const apiBaseUrl = 'https://...';  // camelCase
const APIBASEURL = 'https://...';  // Нет разделителей
```

### Enum

```typescript
// ✅ ПРАВИЛЬНО — PascalCase имя, UPPER_SNAKE значения
enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

// ❌ НЕПРАВИЛЬНО
enum orderStatus { ... }           // camelCase имя
enum OrderStatus {
  pending = 'pending',             // camelCase значения
}
```

---

## 🗄️ БАЗА ДАННЫХ

### Prisma Schema

```prisma
// ✅ ПРАВИЛЬНО
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String   // camelCase для полей
  lastName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  orders    Order[]  // Связи во множественном числе
  
  @@map("users")     // snake_case для таблиц
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  
  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])
  
  @@map("order_items")
}
```

### SQL (если raw)

```sql
-- snake_case для всего
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  product_id INT REFERENCES products(id)
);
```

---

## 🌐 API

### REST Endpoints

```
✅ ПРАВИЛЬНО
GET    /api/v1/products
GET    /api/v1/products/:id
POST   /api/v1/products
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id

GET    /api/v1/users/:id/orders    # Вложенные ресурсы
POST   /api/v1/orders/:id/cancel   # Действия

❌ НЕПРАВИЛЬНО
GET    /api/v1/getProducts         # Глагол в URL
GET    /api/v1/Products            # PascalCase
POST   /api/v1/createProduct       # Глагол
```

### JSON Response

```json
{
  "data": {
    "id": "123",
    "userName": "john",
    "firstName": "John",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

> Используй **camelCase** для JSON полей

---

## 🎨 CSS И TAILWIND

### CSS классы (если custom)

```css
/* ✅ kebab-case */
.product-card { }
.product-card__title { }
.product-card--featured { }
.btn-primary { }

/* ❌ НЕПРАВИЛЬНО */
.productCard { }
.ProductCard { }
.product_card { }
```

### Tailwind (стандартные классы)

```html
<!-- Следуй стандартным Tailwind классам -->
<div class="bg-primary text-white p-4 rounded-lg">
```

---

## 📋 SUMMARY

| Что | Формат | Пример |
|-----|--------|--------|
| Компоненты React | PascalCase | `ProductCard.tsx` |
| Хуки | camelCase + use | `useProducts.ts` |
| Функции | camelCase + глагол | `getProducts()` |
| Переменные | camelCase | `userName` |
| Boolean | is/has/can | `isActive` |
| Константы | UPPER_SNAKE | `API_URL` |
| Классы | PascalCase | `UserService` |
| Интерфейсы | PascalCase | `UserData` |
| Типы | PascalCase | `OrderStatus` |
| Enum | PascalCase + UPPER | `Status.PENDING` |
| Файлы утилит | camelCase | `formatPrice.ts` |
| Тесты | *.test.ts | `format.test.ts` |
| API endpoints | kebab-case | `/user-orders` |
| JSON поля | camelCase | `firstName` |
| DB таблицы | snake_case | `user_orders` |
| CSS классы | kebab-case | `.product-card` |

---

**Последнее обновление:** 2025-01-31
