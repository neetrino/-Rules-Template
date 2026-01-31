# Лучшие практики разработки

> Проверенные паттерны и рекомендации для качественного кода.

---

## 🎯 ОБЩИЕ ПРИНЦИПЫ

### KISS (Keep It Simple, Stupid)
Простое решение лучше сложного. Не усложняй без необходимости.

### DRY (Don't Repeat Yourself)
Не дублируй код. Выноси повторяющуюся логику в функции/компоненты.

### YAGNI (You Aren't Gonna Need It)
Не реализуй функционал "на будущее". Делай только то, что нужно сейчас.

### Separation of Concerns
Каждый модуль/функция отвечает за одну задачу.

---

## ✅ ДЕЛАЙ

### Код

```typescript
// ✅ Маленькие функции с одной ответственностью
function calculateDiscount(price: number, percentage: number): number {
  return price * (percentage / 100);
}

function applyDiscount(price: number, discount: number): number {
  return price - discount;
}

function calculateFinalPrice(price: number, discountPercent: number): number {
  const discount = calculateDiscount(price, discountPercent);
  return applyDiscount(price, discount);
}

// ✅ Понятные имена
const isUserActive = user.status === 'active';
const hasEnoughStock = product.stock >= requestedQuantity;

// ✅ Early returns для уменьшения вложенности
function processOrder(order: Order) {
  if (!order) throw new Error('Order required');
  if (order.status !== 'pending') throw new Error('Invalid status');
  if (order.items.length === 0) throw new Error('Empty order');
  
  return executeOrder(order);
}

// ✅ Иммутабельность
const newItems = [...items, newItem];
const updatedUser = { ...user, name: 'New Name' };

// ✅ Деструктуризация
const { name, email, role } = user;
const [first, ...rest] = items;
```

### Компоненты React

```tsx
// ✅ Маленькие, переиспользуемые компоненты
function ProductPrice({ price, currency = '₽' }: Props) {
  return (
    <span className="text-lg font-bold">
      {formatPrice(price)} {currency}
    </span>
  );
}

// ✅ Composition over inheritance
function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-lg bg-white shadow', className)}>
      {children}
    </div>
  );
}

function ProductCard({ product }: Props) {
  return (
    <Card>
      <ProductImage src={product.image} />
      <ProductPrice price={product.price} />
    </Card>
  );
}

// ✅ Custom hooks для логики
function useProducts(filters: Filters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchProducts(filters).then(setProducts).finally(() => setIsLoading(false));
  }, [filters]);
  
  return { products, isLoading };
}
```

### API

```typescript
// ✅ Валидация входных данных
async function createUser(dto: CreateUserDto) {
  const validated = createUserSchema.parse(dto);
  return userService.create(validated);
}

// ✅ Правильная обработка ошибок
async function fetchUser(id: string): Promise<User> {
  try {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    throw error;
  }
}

// ✅ Транзакции для связанных операций
async function createOrder(data: CreateOrderDto) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({ data: orderData });
    await tx.orderItem.createMany({ data: itemsData });
    await tx.product.updateMany({ /* decrease stock */ });
    return order;
  });
}
```

---

## ❌ НЕ ДЕЛАЙ

### Код

```typescript
// ❌ Длинные функции
function processEverything(data) {
  // 200 строк кода...
}

// ❌ Magic numbers
if (user.age > 18) { ... }
setTimeout(callback, 86400000);

// ❌ Вложенность > 3 уровней
if (a) {
  if (b) {
    if (c) {
      if (d) {
        // Слишком глубоко!
      }
    }
  }
}

// ❌ Мутации аргументов
function addItem(cart) {
  cart.items.push(newItem); // Мутация!
  return cart;
}

// ❌ any в TypeScript
function process(data: any) { ... }

// ❌ Игнорирование ошибок
try {
  await riskyOperation();
} catch (e) {
  // Пустой catch
}
```

### Компоненты React

```tsx
// ❌ Огромные компоненты
function Dashboard() {
  // 500 строк кода, вся логика в одном месте
}

// ❌ Inline objects в пропсах
<Component style={{ color: 'red' }} />
<Button config={{ size: 'lg' }} />

// ❌ Функции в рендере
{items.map(item => (
  <Item onClick={() => handleClick(item.id)} />
))}

// ❌ Prop drilling
<App user={user}>
  <Layout user={user}>
    <Page user={user}>
      <Component user={user} />
    </Page>
  </Layout>
</App>
```

### API

```typescript
// ❌ Логика в контроллерах
@Get()
async findAll() {
  const products = await this.prisma.product.findMany();
  return products.map(p => ({
    ...p,
    price: p.price / 100 // Логика должна быть в сервисе
  }));
}

// ❌ N+1 проблема
const orders = await getOrders();
for (const order of orders) {
  order.items = await getOrderItems(order.id); // N запросов!
}

// ❌ SQL инъекции
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

---

## 🔧 ПАТТЕРНЫ

### Repository Pattern

```typescript
// Абстракция доступа к данным
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
}

class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  // ...
}
```

### Factory Pattern

```typescript
// Создание объектов
function createOrder(data: OrderInput): Order {
  return {
    id: generateId(),
    status: 'pending',
    items: data.items.map(createOrderItem),
    total: calculateTotal(data.items),
    createdAt: new Date(),
  };
}
```

### Strategy Pattern

```typescript
// Разные алгоритмы для одной задачи
interface PaymentStrategy {
  processPayment(amount: number): Promise<PaymentResult>;
}

class StripePayment implements PaymentStrategy {
  async processPayment(amount: number) { /* Stripe logic */ }
}

class PayPalPayment implements PaymentStrategy {
  async processPayment(amount: number) { /* PayPal logic */ }
}

class PaymentService {
  constructor(private strategy: PaymentStrategy) {}
  
  async pay(amount: number) {
    return this.strategy.processPayment(amount);
  }
}
```

---

## 📋 ЧЕКЛИСТЫ

### Перед коммитом

- [ ] Код компилируется без ошибок
- [ ] ESLint проходит без warnings
- [ ] Функции ≤ 50 строк
- [ ] Файлы ≤ 300 строк
- [ ] Нет any в TypeScript
- [ ] Нет console.log
- [ ] Нет закомментированного кода
- [ ] Понятные имена переменных
- [ ] Тесты проходят

### Code Review

- [ ] Код читаем и понятен
- [ ] Нет дублирования
- [ ] Правильная обработка ошибок
- [ ] Правильные типы
- [ ] Нет security issues
- [ ] Есть тесты для новой логики
- [ ] Документация обновлена

---

**Последнее обновление:** 2025-01-31
