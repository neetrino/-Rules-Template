# Cloudflare — Полная настройка

> Cloudflare — CDN, DNS, WAF, R2 Storage, и защита от DDoS.

---

## 📋 СОДЕРЖАНИЕ

1. [Создание аккаунта](#создание-аккаунта)
2. [Добавление домена](#добавление-домена)
3. [DNS настройка](#dns)
4. [SSL/TLS](#ssl-tls)
5. [CDN & Caching](#cdn-caching)
6. [R2 Storage](#r2-storage)
7. [WAF (Web Application Firewall)](#waf)
8. [DDoS Protection](#ddos)
9. [Page Rules](#page-rules)
10. [Workers](#workers)
11. [Analytics](#analytics)
12. [Checklist](#checklist)

---

## 1. Создание аккаунта {#создание-аккаунта}

### Шаги:

1. Перейти на [cloudflare.com](https://cloudflare.com)
2. "Sign Up"
3. Подтвердить email
4. Выбрать план:
   - **Free** — базовый CDN, DNS, DDoS protection
   - **Pro** — $20/месяц, WAF, Image Optimization
   - **Business** — $200/месяц, advanced WAF, 24/7 support

### Что включено в Free:

- DNS hosting
- CDN (200+ data centers)
- DDoS protection (Layer 3/4)
- Universal SSL
- Page Rules (3)
- Analytics (базовая)

---

## 2. Добавление домена {#добавление-домена}

### Шаги:

1. Dashboard → "Add a Site"
2. Ввести домен: `example.com`
3. Выбрать план (Free)
4. Cloudflare сканирует существующие DNS записи
5. Проверить и подтвердить записи
6. Получить Cloudflare nameservers:
   ```
   ada.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```
7. Изменить nameservers у регистратора домена

### Ожидание:

- DNS propagation: до 24 часов (обычно 1-2 часа)
- Статус изменится на "Active"

---

## 3. DNS настройка {#dns}

### Панель DNS:

1. Domain → DNS → Records

### Типы записей:

| Тип | Назначение | Пример |
|-----|------------|--------|
| A | IPv4 адрес | @ → 76.76.21.21 (Vercel) |
| AAAA | IPv6 адрес | @ → 2606:... |
| CNAME | Alias | www → cname.vercel-dns.com |
| MX | Email | @ → mail.provider.com |
| TXT | Verification | @ → "v=spf1 ..." |

### Для Vercel:

```
# Apex domain (example.com)
Type: A
Name: @
Content: 76.76.21.21
Proxy: ON (оранжевое облако)

# WWW subdomain
Type: CNAME
Name: www
Content: cname.vercel-dns.com
Proxy: ON

# API subdomain (если отдельный backend)
Type: CNAME
Name: api
Content: your-api.railway.app
Proxy: OFF (серое облако) или ON
```

### Proxy Status:

| Статус | Значение |
|--------|----------|
| 🟠 Proxied | Трафик через Cloudflare (CDN, WAF) |
| ⚪ DNS only | Только DNS, без Cloudflare features |

### Когда отключать Proxy:

- WebSockets (если проблемы)
- Некоторые API интеграции
- Mail servers (MX записи)

---

## 4. SSL/TLS {#ssl-tls}

### Настройка:

1. Domain → SSL/TLS → Overview

### Режимы:

| Режим | Описание | Когда использовать |
|-------|----------|-------------------|
| Off | Нет HTTPS | ❌ НИКОГДА |
| Flexible | HTTPS до CF, HTTP до origin | ⚠️ Не рекомендуется |
| Full | HTTPS везде, self-signed OK | Для тестирования |
| Full (strict) | HTTPS везде, valid cert | ✅ РЕКОМЕНДУЕТСЯ |

### Рекомендуемая настройка:

```
SSL/TLS Mode: Full (strict)
Always Use HTTPS: ON
Automatic HTTPS Rewrites: ON
Minimum TLS Version: 1.2
```

### Edge Certificates:

1. SSL/TLS → Edge Certificates
2. "Universal SSL" включён автоматически
3. Для wildcard (*.example.com) — настроить

---

## 5. CDN & Caching {#cdn-caching}

### Caching настройка:

1. Domain → Caching → Configuration

### Основные настройки:

```
Caching Level: Standard
Browser Cache TTL: Respect Existing Headers
Crawler Hints: ON
```

### Cache Rules:

1. Caching → Cache Rules → Create Rule

#### Пример: Кэшировать статику

```
Name: Cache static assets
When: URI Path contains /static OR File Extension in (jpg, png, gif, css, js)
Then: 
  - Cache eligibility: Eligible for cache
  - Edge TTL: 1 month
  - Browser TTL: 1 week
```

#### Пример: Не кэшировать API

```
Name: Bypass API
When: URI Path starts with /api
Then:
  - Cache eligibility: Bypass cache
```

### Purge Cache:

1. Caching → Configuration → Purge Cache
2. Выбрать:
   - Purge Everything — всё
   - Custom Purge — конкретные URL

### Программный purge:

```typescript
// После обновления контента
async function purgeCache(urls: string[]) {
  await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: urls }),
    }
  );
}
```

---

## 6. R2 Storage {#r2-storage}

> S3-совместимое object storage. Дешевле чем S3, без egress fees.

### Создание bucket:

1. Dashboard → R2 → Create bucket
2. Name: `my-bucket`
3. Location: Auto (или specific region)

### Pricing:

| Ресурс | Цена |
|--------|------|
| Storage | $0.015 / GB / месяц |
| Class A ops (write) | $4.50 / million |
| Class B ops (read) | $0.36 / million |
| Egress | FREE |

### Настройка доступа:

#### Публичный доступ (для static assets):

1. R2 → bucket → Settings
2. Public access → Enable
3. Custom domain (опционально):
   - `files.example.com`
   - Добавить CNAME в DNS

#### API доступ:

1. R2 → Manage R2 API Tokens
2. Create API Token:
   - Permissions: Object Read & Write
   - Specify bucket(s)
3. Получить:
   - Account ID
   - Access Key ID
   - Secret Access Key

### Использование с Next.js:

```typescript
// lib/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Загрузка файла
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
) {
  await R2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  
  return `https://${process.env.R2_PUBLIC_URL}/${key}`;
}

// Presigned URL для загрузки
export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  
  return await getSignedUrl(R2, command, { expiresIn: 3600 });
}
```

### Environment Variables:

```bash
CF_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=my-bucket
R2_PUBLIC_URL=files.example.com
```

---

## 7. WAF (Web Application Firewall) {#waf}

### Free план:

- Базовые managed rules
- 5 custom rules

### Pro+ план:

- OWASP Core Ruleset
- Cloudflare Managed Ruleset
- Unlimited custom rules

### Настройка:

1. Domain → Security → WAF

### Managed Rules:

1. WAF → Managed Rules
2. Включить:
   - Cloudflare Managed Ruleset
   - Cloudflare OWASP Core Ruleset (Pro+)

### Custom Rules:

1. WAF → Custom Rules → Create Rule

#### Пример: Блокировать страны

```
Name: Block countries
When: ip.geoip.country in {"RU" "CN" "KP"}
Then: Block
```

#### Пример: Rate limiting для API

```
Name: API Rate Limit
When: http.request.uri.path starts with "/api"
Then: Rate limit
  - Requests: 100
  - Period: 1 minute
  - Action: Block
```

#### Пример: Защита админки

```
Name: Protect Admin
When: 
  http.request.uri.path starts with "/admin" AND
  NOT ip.src in {1.2.3.4 5.6.7.8}
Then: Block
```

---

## 8. DDoS Protection {#ddos}

### Включено по умолчанию:

- Layer 3/4 DDoS mitigation
- HTTP DDoS protection

### Настройка:

1. Security → DDoS
2. HTTP DDoS attack protection:
   - Sensitivity: High (рекомендуется)
   - Action: Block

### Under Attack Mode:

Для экстренных ситуаций:

1. Overview → Under Attack Mode → ON
2. Все посетители проходят JS challenge

### Bot Fight Mode:

1. Security → Bots → Bot Fight Mode: ON
2. Блокирует известных bad bots

---

## 9. Page Rules {#page-rules}

> Устаревает в пользу Rules, но всё ещё работает.

### Примеры:

#### Redirect www to non-www:

```
URL: www.example.com/*
Setting: Forwarding URL (301)
Destination: https://example.com/$1
```

#### Force HTTPS:

```
URL: http://example.com/*
Setting: Always Use HTTPS
```

#### Cache Everything:

```
URL: example.com/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
```

---

## 10. Workers {#workers}

> Serverless functions на edge.

### Создание:

1. Workers & Pages → Create Application
2. Create Worker

### Пример Worker:

```javascript
// Redirect based on country
export default {
  async fetch(request) {
    const country = request.cf?.country;
    
    if (country === 'DE') {
      return Response.redirect('https://de.example.com' + new URL(request.url).pathname, 302);
    }
    
    return fetch(request);
  },
};
```

### Привязка к домену:

1. Worker → Settings → Triggers
2. Add Route: `example.com/*`

---

## 11. Analytics {#analytics}

### Web Analytics:

1. Analytics & Logs → Web Analytics
2. Включить для домена

### Метрики:

- Requests
- Bandwidth
- Unique Visitors
- Page Views
- Threats blocked
- Cache hit ratio

### GraphQL API:

```graphql
query {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1dGroups(
        limit: 7
        filter: { date_gt: "2024-01-01" }
      ) {
        dimensions { date }
        sum { requests bytes cachedBytes }
      }
    }
  }
}
```

---

## ✅ Checklist {#checklist}

### Первоначальная настройка:

- [ ] Аккаунт создан
- [ ] Домен добавлен
- [ ] Nameservers изменены у регистратора
- [ ] Статус "Active"

### DNS:

- [ ] A/CNAME записи для Vercel
- [ ] MX записи для email (если нужно)
- [ ] TXT записи для verification

### SSL/TLS:

- [ ] Mode: Full (strict)
- [ ] Always Use HTTPS: ON
- [ ] Minimum TLS Version: 1.2

### Caching:

- [ ] Cache Rules для статики
- [ ] Bypass для API/dynamic content
- [ ] Browser Cache TTL настроен

### R2 Storage (если нужен):

- [ ] Bucket создан
- [ ] Public access или API access настроен
- [ ] Custom domain (опционально)
- [ ] CORS настроен

### Security:

- [ ] WAF Managed Rules включены
- [ ] Bot Fight Mode: ON
- [ ] Rate Limiting для API
- [ ] DDoS protection настроен

### Performance:

- [ ] Auto Minify: JS, CSS, HTML
- [ ] Brotli: ON
- [ ] Early Hints: ON
- [ ] HTTP/3: ON

---

**Версия:** 1.0
