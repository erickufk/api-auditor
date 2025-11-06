# API Security Auditor

Автоматизированная платформа для проведения комплексного аудита безопасности REST API с использованием искусственного интеллекта.

## Описание проекта

API Security Auditor - это интеллектуальный инструмент для выявления уязвимостей в REST API, который использует AI-агентов на базе Google Gemini для автоматического тестирования безопасности. Система поддерживает как автоматический режим с AI-агентами, так и ручное тестирование отдельных эндпоинтов.

### Основные возможности

- **Два режима тестирования:**
  - **Агентный режим (Agentic Mode)**: AI-агент автономно исследует API, генерирует тестовые сценарии и выполняет итеративное тестирование
  - **Ручной режим (Manual Mode)**: Тестирование отдельных эндпоинтов с детальным анализом запросов и ответов

- **Поддержка различных методов аутентификации:**
  - Bearer Token
  - API Key (в заголовках или query-параметрах)
  - Basic Authentication
  - OAuth 2.0
  - Возможность выполнения запросов аутентификации и автоматического извлечения токенов

- **Интеллектуальный анализ безопасности:**
  - Выявление уязвимостей по OWASP API Security Top 10
  - Автоматическая генерация proof-of-concept эксплойтов
  - Оценка критичности по шкале CVSS
  - Рекомендации по устранению уязвимостей

- **Поддержка форматов:**
  - OpenAPI/Swagger спецификации (JSON/YAML)
  - Ручной ввод эндпоинтов
  - Парсинг raw HTTP запросов

- **Многоязычный интерфейс:**
  - Русский
  - Английский

## Архитектура решения

### Технологический стек

**Frontend:**
- Next.js 16 (App Router)
- React 19.2
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui компоненты

**Backend:**
- Next.js API Routes
- Server Actions

**AI/ML:**
- Google Gemini (через Vercel AI SDK)
- AI SDK 5.0

**Дополнительные библиотеки:**
- Zod (валидация схем)
- React Hook Form (управление формами)
- date-fns (работа с датами)
- Recharts (визуализация данных)

### Структура проекта

\`\`\`
api-security-auditor/
├── app/
│   ├── api/                          # API Routes
│   │   ├── analyze-agentic-iteration/ # Анализ итераций агентного тестирования
│   │   ├── analyze-manual-test/       # Анализ ручных тестов
│   │   ├── execute-auth/              # Прокси для выполнения аутентификации
│   │   └── test-endpoint/             # Прокси для тестирования эндпоинтов
│   ├── layout.tsx                     # Корневой layout
│   ├── page.tsx                       # Главная страница с основным workflow
│   └── globals.css                    # Глобальные стили
│
├── components/
│   ├── ui/                            # shadcn/ui компоненты
│   ├── landing-page.tsx               # Лендинг
│   ├── welcome-step.tsx               # Шаг приветствия
│   ├── mode-selection-step.tsx        # Выбор режима тестирования
│   ├── project-mode-step.tsx          # Выбор типа проекта
│   ├── auth-config-step.tsx           # Настройка аутентификации
│   ├── agentic-config-step.tsx        # Настройка агентного режима
│   ├── manual-config-step.tsx         # Настройка ручного режима
│   ├── report-display.tsx             # Отображение отчета
│   ├── progress-tracker.tsx           # Трекер прогресса
│   └── header.tsx                     # Шапка приложения
│
├── lib/
│   ├── types.ts                       # TypeScript типы и интерфейсы
│   ├── agentic-workflow.ts            # Логика агентного тестирования
│   ├── manual-test-workflow.ts        # Логика ручного тестирования
│   ├── openapi-parser.ts              # Парсер OpenAPI спецификаций
│   ├── fuzzing-engine.tsx             # Движок для фаззинга
│   ├── open-doors-detector.ts         # Детектор открытых эндпоинтов
│   ├── translations.ts                # Переводы интерфейса
│   ├── session-storage.ts             # Управление сессиями
│   └── utils.ts                       # Утилиты
│
└── public/                            # Статические файлы
\`\`\`

### Архитектура компонентов

#### 1. Workflow Engine

Система использует пошаговый workflow для проведения аудита:

\`\`\`
Landing → Welcome → Mode Selection → Project Mode → Auth Config → Test Config → Testing → Report
\`\`\`

Каждый шаг управляется через состояние в главном компоненте `app/page.tsx`.

#### 2. Агентный режим (Agentic Workflow)

\`\`\`typescript
// Основной цикл агентного тестирования
runAgenticWorkflow(initialRequest, config) {
  1. Выполнить начальный запрос
  2. Проанализировать ответ с помощью Gemini
  3. Получить список follow-up тестов
  4. Для каждой итерации (до maxIterations):
     - Выполнить тест
     - Проанализировать результат
     - Выявить уязвимости
     - Сгенерировать новые тесты
     - Проверить условия остановки
  5. Сформировать итоговый отчет
}
\`\`\`

**Ключевые особенности:**
- Итеративное тестирование с обучением на предыдущих результатах
- Автоматическая генерация тестовых сценариев
- Адаптивная стратегия тестирования (low/medium/high aggressiveness)
- Остановка при обнаружении критических уязвимостей

#### 3. Ручной режим (Manual Workflow)

\`\`\`typescript
// Процесс ручного тестирования
analyzeManualTest(testData) {
  1. Получить request/response пару
  2. Отправить на анализ в Gemini
  3. Выявить уязвимости
  4. Сгенерировать рекомендации
  5. Предложить follow-up тесты
  6. Вернуть детальный отчет
}
\`\`\`

**Ключевые особенности:**
- Тестирование одного эндпоинта за раз
- Детальный анализ каждого запроса
- Возможность тестировать новые эндпоинты без перезапуска
- Сохранение конфигурации аутентификации

#### 4. Система аутентификации

Поддерживает полный цикл аутентификации:

\`\`\`typescript
// Процесс аутентификации
1. Пользователь вводит данные для аутентификации
2. Система выполняет запрос к auth endpoint
3. Автоматически извлекает токен из ответа
4. Токен используется во всех последующих запросах
5. Опциональная верификация токена
\`\`\`

**Поддерживаемые методы:**
- **Bearer Token**: Токен в заголовке `Authorization: Bearer <token>`
- **API Key**: Ключ в заголовке или query-параметре
- **Basic Auth**: Username/password в заголовке
- **OAuth 2.0**: Client credentials flow

#### 5. Proxy Architecture

Все внешние запросы проходят через серверные API routes для обхода CORS:

\`\`\`
Client → /api/execute-auth → External API
Client → /api/test-endpoint → External API
\`\`\`

Это позволяет:
- Обходить CORS ограничения
- Логировать все запросы
- Добавлять дополнительную обработку
- Обеспечивать безопасность

### Типы уязвимостей

Система выявляет уязвимости согласно OWASP API Security Top 10:

1. **Broken Object Level Authorization (BOLA/IDOR)**
2. **Broken Authentication**
3. **Broken Object Property Level Authorization**
4. **Unrestricted Resource Consumption**
5. **Broken Function Level Authorization**
6. **Unrestricted Access to Sensitive Business Flows**
7. **Server Side Request Forgery (SSRF)**
8. **Security Misconfiguration**
9. **Improper Inventory Management**
10. **Unsafe Consumption of APIs**

### Формат отчета

Система генерирует детальный отчет в формате:

\`\`\`typescript
{
  scan_id: string
  timestamp: string
  api_name: string
  overall_risk_score: "critical" | "high" | "medium" | "low" | "info"
  endpoints_scanned: number
  vulnerabilities_found: number
  vulnerabilities: [
    {
      id: string
      title: string
      severity: "critical" | "high" | "medium" | "low" | "info"
      description: string
      affected_endpoints: string[]
      proof_of_concept: string
      remediation: string
      cwe_id: string
      cvss_score: number
    }
  ]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  recommendations: string[]
}
\`\`\`

## Установка и запуск

### Требования

- Node.js 18+
- pnpm (рекомендуется) или npm
- Google Generative AI API ключ

### Установка

\`\`\`bash
# Клонировать репозиторий
git clone <repository-url>
cd api-security-auditor

# Установить зависимости
pnpm install

# Настроить переменные окружения
cp .env.example .env.local
\`\`\`

### Настройка переменных окружения

Создайте файл `.env.local`:

\`\`\`env
# Google Generative AI API Key
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
\`\`\`

### Запуск в режиме разработки

\`\`\`bash
pnpm dev
\`\`\`

Приложение будет доступно по адресу: `http://localhost:3000`

### Сборка для продакшена

\`\`\`bash
pnpm build
pnpm start
\`\`\`

## Использование

### Агентный режим

1. Выберите "Agentic Mode" на экране выбора режима
2. Загрузите OpenAPI спецификацию или введите эндпоинт вручную
3. Настройте аутентификацию (если требуется)
4. Настройте параметры агента:
   - Максимальное количество итераций
   - Уровень агрессивности
   - Условия остановки
5. Запустите тестирование
6. Дождитесь завершения и изучите отчет

### Ручной режим

1. Выберите "Manual Mode" на экране выбора режима
2. Настройте аутентификацию (если требуется)
3. Введите детали запроса:
   - URL эндпоинта
   - HTTP метод
   - Заголовки
   - Query параметры
   - Тело запроса
4. Выполните запрос
5. Изучите детальный анализ
6. При необходимости протестируйте другие эндпоинты

### Настройка аутентификации

1. Включите "Login Flow" если требуется получить токен
2. Введите данные для аутентификации:
   - Endpoint для получения токена
   - Метод (POST/GET)
   - Параметры (в URL или теле запроса)
3. Нажмите "Execute Authentication"
4. Система автоматически извлечет токен
5. Опционально: верифицируйте токен на тестовом эндпоинте

## API Endpoints

### POST /api/execute-auth

Прокси для выполнения запросов аутентификации.

**Request:**
\`\`\`json
{
  "url": "string",
  "method": "POST" | "GET",
  "headers": {},
  "body": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "status": number,
  "statusText": "string",
  "headers": {},
  "body": "string"
}
\`\`\`

### POST /api/test-endpoint

Прокси для тестирования эндпоинтов.

**Request:**
\`\`\`json
{
  "url": "string",
  "method": "string",
  "headers": {},
  "queryParams": {},
  "body": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "status": number,
  "statusText": "string",
  "headers": {},
  "body": "string"
}
\`\`\`

### POST /api/analyze-manual-test

Анализ результатов ручного теста.

**Request:**
\`\`\`json
{
  "request": ManualTestRequest,
  "response": ManualTestResponse
}
\`\`\`

**Response:** SecurityReport

### POST /api/analyze-agentic-iteration

Анализ итерации агентного тестирования.

**Request:**
\`\`\`json
{
  "request": ManualTestRequest,
  "response": ManualTestResponse,
  "previousIterations": AgenticIteration[],
  "aggressiveness": "low" | "medium" | "high",
  "iterationNumber": number
}
\`\`\`

**Response:**
\`\`\`json
{
  "analysis": "string",
  "vulnerabilitiesFound": Vulnerability[],
  "reasoning": "string",
  "shouldContinue": boolean,
  "followUpTests": FollowUpTest[]
}
\`\`\`

## Безопасность

- Все внешние запросы проходят через серверные API routes
- API ключи хранятся только на сервере
- Поддержка всех стандартных методов аутентификации
- Логирование всех запросов для аудита

## Ограничения

- Требуется Google Generative AI API ключ
- Ограничения rate limiting зависят от API провайдера
- Агентный режим может занимать продолжительное время при большом количестве итераций

## Roadmap

- [ ] Поддержка GraphQL API
- [ ] Интеграция с CI/CD пайплайнами
- [ ] Экспорт отчетов в PDF/HTML
- [ ] Сохранение истории аудитов
- [ ] Сравнение результатов между аудитами
- [ ] Поддержка дополнительных AI моделей
- [ ] Автоматическое обнаружение эндпоинтов

## Лицензия

MIT

## Контакты

Для вопросов и предложений создавайте issues в репозитории.
